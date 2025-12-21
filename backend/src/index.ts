import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findMatchingComplaints } from './matching';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "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";//'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to authenticate token
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ============= Auth Endpoints =============

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Google Login (Real Implementation)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID Token is required' });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ error: 'Invalid token payload' });
        }

        const { email, name, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ error: 'Email not found in token' });
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || 'Google User',
                    googleId,
                    password: '' // No password for Google users
                },
            });
        } else if (!user.googleId) {
            // Link existing account
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId },
            });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google auth failed' });
    }
});

// Get Current User Profile & History
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' },
                    include: { questions: true }
                },
                complaints: { orderBy: { createdAt: 'desc' } },
                notifications: { orderBy: { createdAt: 'desc' } },
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ============= Notification Endpoints =============

app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Enrich notifications with current complaint status
        const enrichedNotifications = await Promise.all(
            notifications.map(async (notification) => {
                if (notification.type === 'CLAIM_REQUEST' && notification.payload) {
                    try {
                        const payload = JSON.parse(notification.payload);
                        if (payload.complaintId) {
                            const complaint = await prisma.complaint.findUnique({
                                where: { id: payload.complaintId },
                                select: { status: true }
                            });
                            payload.complaintStatus = complaint?.status || 'OPEN';
                            return {
                                ...notification,
                                payload: JSON.stringify(payload)
                            };
                        }
                    } catch (e) {
                        console.error('Error enriching notification', e);
                    }
                }
                return notification;
            })
        );

        res.json(enrichedNotifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// ============= Existing Endpoints (Updated with userId optional) =============

// Create Item (Updated to link user)
app.post('/api/items', async (req, res) => {
    try {
        const { name, category, location, date, description, contactInfo, imageUri, imageUris, questions, userId } = req.body;

        // Handle both imageUri (single) and imageUris (array)
        const images = imageUris || (imageUri ? [imageUri] : []);

        // Create the item
        const item = await prisma.item.create({
            data: {
                name,
                category,
                location,
                date,
                description,
                contactInfo,
                imageUris: images,
                questions: {
                    create: questions,
                },
                userId: userId || null, // Link to user if provided
            },
            include: {
                questions: true,
            },
        });

        // Check for matching complaints
        const matches = await findMatchingComplaints({ name, category, location, date }, prisma);

        // Create notification for matching complaints (Mock logic for now)
        // In real app, we'd find the user of the complaint and notify them

        res.json({
            item,
            matches: matches.map(m => ({
                complaintId: m.complaintId,
                complaint: m.complaint,
                score: m.score,
                matchedFields: m.matchedFields,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Create Complaint (Updated to link user)
app.post('/api/complaints', async (req, res) => {
    try {
        const { name, category, location, date, description, contactInfo, imageUris, userId } = req.body;
        const complaint = await prisma.complaint.create({
            data: {
                name,
                category,
                location,
                date,
                description,
                contactInfo,
                imageUris: imageUris ? JSON.stringify(imageUris) : '[]',
                userId: userId || null,
            },
        });
        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create complaint' });
    }
});

// ... (Rest of existing endpoints remain same)

// List Items (with search)
app.get('/api/items', async (req, res) => {
    try {
        const { query, claimedBy, excludeClaimed } = req.query;
        let where: any = {};

        if (query) {
            where.OR = [
                { name: { contains: String(query), mode: 'insensitive' as const } },
                { category: { contains: String(query), mode: 'insensitive' as const } },
                { location: { contains: String(query), mode: 'insensitive' as const } },
            ];
        }

        if (claimedBy) {
            where.claimedByUserId = String(claimedBy);
        }

        if (excludeClaimed === 'true') {
            where.status = { in: ['OPEN', 'REOPENED'] };
        }

        const items = await prisma.item.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { questions: true },
        });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Get Item by ID
app.get('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.item.findUnique({
            where: { id },
            include: { questions: true },
        });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// List Complaints (with search)
app.get('/api/complaints', async (req, res) => {
    try {
        const { query } = req.query;
        const where = query
            ? {
                OR: [
                    { name: { contains: String(query), mode: 'insensitive' as const } },
                    { category: { contains: String(query), mode: 'insensitive' as const } },
                    { location: { contains: String(query), mode: 'insensitive' as const } },
                ],
                status: 'OPEN',
            }
            : { status: 'OPEN' };

        const complaints = await prisma.complaint.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// Get Complaint by ID
app.get('/api/complaints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await prisma.complaint.findUnique({
            where: { id },
        });
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch complaint' });
    }
});

// Update Item (Status and Details)
app.patch('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, name, category, location, date, description, contactInfo, imageUris, questions } = req.body;

        const data: any = {};
        if (status) data.status = status;
        if (name) data.name = name;
        if (category) data.category = category;
        if (location) data.location = location;
        if (date) data.date = date;
        if (description) data.description = description;
        if (contactInfo) data.contactInfo = contactInfo;

        // Handle images array
        if (imageUris) {
            // Prisma expects string[] for scalar list
            data.imageUris = imageUris;
        }

        // Handle nested questions update if provided
        if (questions) {
            data.questions = {
                deleteMany: {}, // Delete all existing questions
                create: questions.map((q: any) => ({
                    question: q.question,
                    answer: q.answer
                }))
            };
        }

        const item = await prisma.item.update({
            where: { id },
            data,
            include: { questions: true }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Update Complaint Status (with founder notification)
app.patch('/api/complaints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, closureReason, reopenReason, resolvedAt, name, category, location, date, description, contactInfo, imageUris } = req.body;

        // Get the current complaint to check if status is changing
        const currentComplaint = await prisma.complaint.findUnique({ where: { id } });
        if (!currentComplaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const previousStatus = currentComplaint.status;
        const data: any = {};
        if (status) data.status = status;
        if (closureReason) data.closureReason = closureReason;
        if (reopenReason) data.reopenReason = reopenReason;
        if (resolvedAt) data.resolvedAt = resolvedAt;

        // Allow updating content fields
        if (name) data.name = name;
        if (category) data.category = category;
        if (location) data.location = location;
        if (date) data.date = date;
        if (description) data.description = description;
        if (contactInfo) data.contactInfo = contactInfo;
        if (imageUris) data.imageUris = typeof imageUris === 'string' ? imageUris : JSON.stringify(imageUris);

        const complaint = await prisma.complaint.update({
            where: { id },
            data,
        });

        // If status changed to CLOSED, check if there's a linked notification and notify the founder
        if (status === 'CLOSED' && previousStatus !== 'CLOSED') {
            // Find the notification that has this complaint to get the founder's item
            const victimNotifications = await prisma.notification.findMany({
                where: {
                    userId: currentComplaint.userId || undefined,
                    type: 'CLAIM_REQUEST'
                }
            });

            console.log(`Looking for notifications for complaint ${id}, found ${victimNotifications.length}`);

            for (const notification of victimNotifications) {
                try {
                    const payload = JSON.parse(notification.payload || '{}');
                    console.log(`Checking notification payload:`, payload);
                    if (payload.complaintId === id && payload.itemId) {
                        // Get the item to find founder
                        const item = await prisma.item.findUnique({ where: { id: payload.itemId } });
                        console.log(`Found item:`, item?.id, item?.status);
                        if (item && item.userId) {
                            // Determine if this was a Claim (via verification) or intentional close
                            const isClaim = closureReason === 'Founder contacted via Notification';
                            const newStatus = isClaim ? 'CLAIMED' : 'CLOSED';

                            // Update item status
                            await prisma.item.update({
                                where: { id: payload.itemId },
                                data: { status: newStatus }
                            });
                            console.log(`Updated item ${payload.itemId} status to ${newStatus}`);

                            // Notify founder that victim closed the complaint
                            await prisma.notification.create({
                                data: {
                                    userId: item.userId,
                                    title: 'Complaint Closed by Victim',
                                    message: `The victim has closed their complaint "${currentComplaint.name}". Reason: ${closureReason || 'No reason provided'}`,
                                    type: 'COMPLAINT_CLOSED',
                                    payload: JSON.stringify({ complaintId: id, itemId: payload.itemId, reason: closureReason }),
                                }
                            });
                            console.log(`Created notification for founder ${item.userId}`);
                        }
                        break;
                    }
                } catch (e) {
                    console.error('Error processing notification', e);
                }
            }
        }

        // If reopening a complaint (any status -> OPEN), notify founder if there was a previous notification
        if (status === 'OPEN' && previousStatus !== 'OPEN') {
            const victimNotifications = await prisma.notification.findMany({
                where: {
                    userId: currentComplaint.userId || undefined,
                    type: 'CLAIM_REQUEST'
                }
            });

            console.log(`Looking for notifications for reopening complaint ${id}, found ${victimNotifications.length}`);

            for (const notification of victimNotifications) {
                try {
                    const payload = JSON.parse(notification.payload || '{}');
                    if (payload.complaintId === id && payload.itemId) {
                        const item = await prisma.item.findUnique({ where: { id: payload.itemId } });
                        console.log(`Found item for reopen:`, item?.id, item?.status);
                        if (item && item.userId) {
                            // Update item status to REOPENED
                            await prisma.item.update({
                                where: { id: payload.itemId },
                                data: {
                                    status: 'REOPENED',
                                    reopenReason: reopenReason,
                                    linkedComplaintId: id
                                }
                            });
                            console.log(`Updated item ${payload.itemId} status to REOPENED`);

                            // Notify founder that victim reopened the complaint
                            await prisma.notification.create({
                                data: {
                                    userId: item.userId,
                                    title: 'Complaint Reopened',
                                    message: `The victim has reopened their complaint "${currentComplaint.name}". ${reopenReason || ''}`,
                                    type: 'COMPLAINT_REOPENED',
                                    payload: JSON.stringify({ complaintId: id, itemId: payload.itemId, reason: reopenReason }),
                                }
                            });
                            console.log(`Created reopen notification for founder ${item.userId}`);
                        }
                        break;
                    }
                } catch (e) {
                    console.error('Error processing notification', e);
                }
            }
        }

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update complaint' });
    }
});

// Resolve Complaint (with feedback) - Victim marks complaint as resolved
app.post('/api/complaints/:id/resolve', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        // Update complaint to RESOLVED with feedback
        const complaint = await prisma.complaint.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
                feedbackRating: rating,
                feedbackComment: comment,
                closureReason: 'Item recovered via FindMate'
            },
        });

        // Find and update any linked items (from notifications) to RECOVERED
        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.user.id,
                type: 'CLAIM_REQUEST',
            }
        });

        // Find notification with this complaint and update linked item
        for (const notification of notifications) {
            try {
                const payload = JSON.parse(notification.payload || '{}');
                if (payload.complaintId === id && payload.itemId) {
                    const item = await prisma.item.findUnique({ where: { id: payload.itemId } });

                    // Update item to RECOVERED
                    await prisma.item.update({
                        where: { id: payload.itemId },
                        data: {
                            status: 'RECOVERED',
                            recoveredAt: new Date(),
                            feedbackRating: rating,
                            feedbackComment: comment,
                        }
                    });

                    // Notify founder about successful recovery
                    if (item && item.userId) {
                        await prisma.notification.create({
                            data: {
                                userId: item.userId,
                                title: 'Item Successfully Recovered! 🎉',
                                message: `The victim has confirmed recovering "${complaint.name}". Thank you for helping!` +
                                    (rating ? ` Rating: ${rating}/5` : '') +
                                    (comment ? ` Feedback: "${comment}"` : ''),
                                type: 'ITEM_RECOVERED',
                                payload: JSON.stringify({ complaintId: id, itemId: payload.itemId, rating, comment }),
                            }
                        });
                    }
                    break;
                }
            } catch (e) {
                console.error('Error parsing notification payload', e);
            }
        }

        res.json({ success: true, complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to resolve complaint' });
    }
});

// Notify Owner (Founder -> Victim)
app.post('/api/complaints/:id/notify', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { questions, description, phone, itemId } = req.body;
        const founderUserId = req.user.id;

        const complaint = await prisma.complaint.findUnique({
            where: { id },
        });

        if (!complaint || !complaint.userId) {
            return res.status(404).json({ error: 'Complaint or owner not found' });
        }

        // Handle Item Linking or Creation
        // Handle Item Linking or Creation
        let finalItemId = itemId;

        // If no confirmed itemId, try to find an existing item for this complaint linkage
        if (!finalItemId) {
            const existingItem = await prisma.item.findFirst({
                where: {
                    userId: founderUserId,
                    linkedComplaintId: id
                }
            });
            if (existingItem) finalItemId = existingItem.id;
        }

        if (!finalItemId) {
            // Create a "Shadow Item" to track this notification
            const newItem = await prisma.item.create({
                data: {
                    name: `Found: ${complaint.name}`,
                    category: complaint.category,
                    location: complaint.location, // Approximate
                    date: new Date().toISOString().split('T')[0],
                    description: description || `Matches complaint: ${complaint.description}`,
                    contactInfo: phone,
                    imageUris: [],
                    userId: founderUserId,
                    status: 'NOTIFIED',
                    linkedComplaintId: id,
                    questions: {
                        create: questions ? questions.map((q: any) => ({
                            question: q.question,
                            answer: q.answer
                        })) : []
                    }
                }
            });
            finalItemId = newItem.id;
        } else {
            // Update existing item status
            await prisma.item.update({
                where: { id: finalItemId },
                data: {
                    status: 'NOTIFIED',
                    linkedComplaintId: id
                }
            });
        }

        // Create or Update notification for the victim
        console.log('Processing notification for user:', complaint.userId, { id, phone });

        const existingNotification = await prisma.notification.findFirst({
            where: {
                userId: complaint.userId,
                type: 'CLAIM_REQUEST',
            }
        });

        // Check if the existing notification is for the same complaint/item
        let notificationToUpdate = null;
        if (existingNotification) {
            const payload = JSON.parse(existingNotification.payload || '{}');
            if (payload.complaintId === id && payload.itemId === finalItemId) {
                notificationToUpdate = existingNotification;
            }
        }

        if (notificationToUpdate) {
            await prisma.notification.update({
                where: { id: notificationToUpdate.id },
                data: {
                    title: 'Item Match Update',
                    message: `The founder has updated their message regarding '${complaint.name}'.`,
                    read: false, // Mark as unread so they see it
                    createdAt: new Date(), // Bump to top
                    payload: JSON.stringify({
                        complaintId: id,
                        founderPhone: phone,
                        questions,
                        description,
                        itemId: finalItemId
                    }),
                }
            });
            console.log('Notification updated');
        } else {
            const notification = await prisma.notification.create({
                data: {
                    userId: complaint.userId,
                    title: 'Someone found your item!',
                    message: `A founder has reached out regarding '${complaint.name}'.`,
                    type: 'CLAIM_REQUEST',
                    payload: JSON.stringify({
                        complaintId: id,
                        founderPhone: phone,
                        questions,
                        description,
                        itemId: finalItemId
                    }),
                },
            });
            console.log('Notification created:', notification);
        }

        res.json({ success: true, itemId: finalItemId });
    } catch (error: any) {
        console.error('Error in notify endpoint:', error);
        res.status(500).json({
            error: 'Failed to notify owner',
            details: error.message || String(error)
        });
    }
});

// Claim Item
app.post('/api/items/:id/claim', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const item = await prisma.item.update({
            where: { id },
            data: {
                status: 'CLAIMED',
                claimedByUserId: userId,
            },
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to claim item' });
    }
});

// Recover Item (with feedback)
app.post('/api/items/:id/recover', async (req, res) => {
    try {
        const { id } = req.params;
        const { feedbackRating, feedbackComment } = req.body;

        console.log('Recovering item:', id, req.body);
        const item = await prisma.item.update({
            where: { id },
            data: {
                status: 'RECOVERED',
                recoveredAt: new Date(),
                feedbackRating,
                feedbackComment,
            },
        });
        console.log('Item recovered:', item);
        res.json(item);
    } catch (error: any) {
        console.error('Error in recover endpoint:', error);
        res.status(500).json({
            error: 'Failed to recover item',
            details: error.message || String(error),
            meta: error.meta // Prisma specific
        });
    }
});

// ============= Security Endpoints (Existing) =============

// In-memory storage for OTPs and CAPTCHAs (in production, use Redis)
const otpStore = new Map<string, { code: string; expires: number }>();
const captchaStore = new Map<string, { code: string; expires: number }>();

// Generate and Send OTP
app.post('/api/otp/send', (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        otpStore.set(phone, { code: otp, expires });

        // In a real app, integrate with SMS provider (Twilio, Firebase, etc.)
        // For now, we log it and return it for testing
        console.log(`[OTP] Sent to ${phone}: ${otp}`);

        res.json({ success: true, message: 'OTP sent successfully', debugCode: otp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP
app.post('/api/otp/verify', (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

        const stored = otpStore.get(phone);
        if (!stored) return res.status(400).json({ error: 'OTP not found or expired' });

        if (Date.now() > stored.expires) {
            otpStore.delete(phone);
            return res.status(400).json({ error: 'OTP expired' });
        }

        if (stored.code !== code) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        otpStore.delete(phone); // Clear after successful verification
        res.json({ success: true, message: 'OTP verified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Generate CAPTCHA
app.get('/api/captcha/generate', (req, res) => {
    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const id = Math.random().toString(36).substring(7);
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        captchaStore.set(id, { code, expires });

        // Generate styles for frontend rendering
        const styles = code.split('').map(() => ({
            transform: [{ rotate: `${Math.random() * 40 - 20}deg` }],
            fontSize: 20 + Math.random() * 8,
            marginTop: Math.random() * 10 - 5,
        }));

        res.json({ id, code, styles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate CAPTCHA' });
    }
});

// Verify CAPTCHA
app.post('/api/captcha/verify', (req, res) => {
    try {
        const { id, code } = req.body;
        if (!id || !code) return res.status(400).json({ error: 'ID and code required' });

        const stored = captchaStore.get(id);
        if (!stored) return res.status(400).json({ error: 'CAPTCHA not found or expired' });

        if (Date.now() > stored.expires) {
            captchaStore.delete(id);
            return res.status(400).json({ error: 'CAPTCHA expired' });
        }

        if (stored.code.toUpperCase() !== code.toUpperCase()) {
            return res.status(400).json({ error: 'Invalid CAPTCHA' });
        }

        // Don't delete yet, might be needed for final form submission verification
        // Or delete if this is the final check
        res.json({ success: true, message: 'CAPTCHA verified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify CAPTCHA' });
    }
});

// Start server after all routes are registered
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


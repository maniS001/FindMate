import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { findMatchingComplaints } from './matching';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// Google Login (Mock/Simplified)
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name, googleId } = req.body;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: { email, name, googleId, password: '' }, // No password for Google users
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
        console.error(error);
        res.status(500).json({ error: 'Google auth failed' });
    }
});

// Get Current User Profile & History
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                items: { orderBy: { createdAt: 'desc' } },
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
        res.json(notifications);
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
        const { query } = req.query;
        const where = query
            ? {
                OR: [
                    { name: { contains: String(query), mode: 'insensitive' as const } },
                    { category: { contains: String(query), mode: 'insensitive' as const } },
                    { location: { contains: String(query), mode: 'insensitive' as const } },
                ],
            }
            : {};

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
                status: 'open',
            }
            : { status: 'open' };

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

// Update Item Status
app.patch('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const item = await prisma.item.update({
            where: { id },
            data: { status },
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update item status' });
    }
});

// Update Complaint Status
app.patch('/api/complaints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, closureReason, reopenReason, resolvedAt } = req.body;

        const data: any = { status };
        if (closureReason) data.closureReason = closureReason;
        if (reopenReason) data.reopenReason = reopenReason;
        if (resolvedAt) data.resolvedAt = resolvedAt;

        const complaint = await prisma.complaint.update({
            where: { id },
            data,
        });
        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update complaint status' });
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


import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import { findMatchingComplaints } from './matching';

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create Item
app.post('/api/items', async (req, res) => {
    try {
        const { name, category, location, date, description, contactInfo, imageUri, imageUris, questions } = req.body;

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
            },
            include: {
                questions: true,
            },
        });

        // Check for matching complaints
        const matches = await findMatchingComplaints({ name, category, location, date }, prisma);

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

// ============= Complaint Endpoints =============

// Create Complaint
app.post('/api/complaints', async (req, res) => {
    try {
        const { name, category, location, date, description, contactInfo, imageUris } = req.body;
        const complaint = await prisma.complaint.create({
            data: {
                name,
                category,
                location,
                date,
                description,
                contactInfo,
                imageUris: imageUris ? JSON.stringify(imageUris) : '[]',
            },
        });
        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create complaint' });
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

// Start server after all routes are registered
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


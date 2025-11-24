
// API Configuration
// For real Android device, use your computer's IP address (both must be on same WiFi)
// Computer IP: 10.56.226.180
const API_URL = 'https://findmate-backend.onrender.com/api';

// = Platform.OS === 'android'
//     ? 'http://10.56.226.180:3000/api'  // For Android device on same WiFi
//     : 'http://localhost:3000/api';  // For web and iOS

// Data Models
export interface Item {
    id: string;
    name: string;
    category: string;
    location: string;
    date: string;
    description: string;
    questions: { question: string; answer: string; }[];
    contactInfo: string;
    imageUri?: string; // Main image for backward compatibility/preview
    imageUris?: string[]; // All images
}

export interface Complaint {
    id: string;
    name: string;
    category: string;
    location: string;
    date: string;
    description: string;
    contactInfo: string;
    imageUris?: string;
    status: string;
    createdAt: string;
}

// ============= Item API =============

export const addItem = async (item: Omit<Item, 'id' | 'createdAt'>) => {
    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Add item failed:', response.status, errorText);
            throw new Error(`Failed to add item: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding item:', error);
        throw error;
    }
};

export const getItems = async (): Promise<Item[]> => {
    try {
        const response = await fetch(`${API_URL}/items`);
        if (!response.ok) throw new Error('Failed to fetch items');
        return await response.json();
    } catch (error) {
        console.error('Error fetching items:', error);
        return [];
    }
};

export const searchItems = async (query: string): Promise<Item[]> => {
    try {
        const response = await fetch(`${API_URL}/items?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search items');
        return await response.json();
    } catch (error) {
        console.error('Error searching items:', error);
        return [];
    }
};

export const getItemById = async (id: string): Promise<Item | null> => {
    try {
        const response = await fetch(`${API_URL}/items/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching item:', error);
        return null;
    }
};

// ============= Complaint API =============

export const addComplaint = async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => {
    try {
        const response = await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(complaint),
        });
        if (!response.ok) throw new Error('Failed to add complaint');
        return await response.json();
    } catch (error) {
        console.error('Error adding complaint:', error);
        throw error;
    }
};

export const getComplaints = async (): Promise<Complaint[]> => {
    try {
        const response = await fetch(`${API_URL}/complaints`);
        if (!response.ok) throw new Error('Failed to fetch complaints');
        return await response.json();
    } catch (error) {
        console.error('Error fetching complaints:', error);
        return [];
    }
};

export const searchComplaints = async (query: string): Promise<Complaint[]> => {
    try {
        const response = await fetch(`${API_URL}/complaints?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search complaints');
        return await response.json();
    } catch (error) {
        console.error('Error searching complaints:', error);
        return [];
    }
};

export const getComplaintById = async (id: string): Promise<Complaint | null> => {
    try {
        const response = await fetch(`${API_URL}/complaints/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching complaint:', error);
        return null;
    }
};

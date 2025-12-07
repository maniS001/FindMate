import { API_URL } from './constants/api';

// API Configuration is now managed in constants/api.ts

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
    userId?: string;
    status?: 'OPEN' | 'CLAIMED' | 'RESOLVED' | 'RECOVERED';
    claimedByUserId?: string;
    recoveredAt?: string;
    feedbackRating?: number;
    feedbackComment?: string;
}

export interface Complaint {
    id: string;
    name: string;
    category: string;
    location: string;
    date: string;
    description: string;
    contactInfo: string;
    imageUris?: string[];
    status: 'OPEN' | 'CLOSED' | 'RESOLVED';
    createdAt: string;
    userId?: string;
    closureReason?: string;
    reopenReason?: string;
    resolvedAt?: string;
}

// ============= Item API =============

export const addItem = async (item: Omit<Item, 'id' | 'createdAt'> | FormData) => {
    try {
        const isFormData = item instanceof FormData;
        const headers: HeadersInit = isFormData ? {
            'Accept': 'application/json',
        } : {
            'Content-Type': 'application/json',
        };

        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers,
            body: isFormData ? item : JSON.stringify(item),
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
        const response = await fetch(`${API_URL}/items?query=${encodeURIComponent(query)}&excludeClaimed=true`);
        if (!response.ok) throw new Error('Failed to search items');
        return await response.json();
    } catch (error) {
        console.error('Error searching items:', error);
        return [];
    }
};

export const getClaimedItems = async (userId: string): Promise<Item[]> => {
    try {
        const response = await fetch(`${API_URL}/items?claimedBy=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch claimed items');
        return await response.json();
    } catch (error) {
        console.error('Error fetching claimed items:', error);
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

export const updateItemStatus = async (id: string, status: string): Promise<Item | null> => {
    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update item status');
        return await response.json();
    } catch (error) {
        console.error('Error updating item status:', error);
        return null;
    }
};

export const claimItem = async (id: string, userId: string): Promise<Item | null> => {
    try {
        const response = await fetch(`${API_URL}/items/${id}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error('Failed to claim item');
        return await response.json();
    } catch (error) {
        console.error('Error claiming item:', error);
        return null;
    }
};

export const recoverItem = async (id: string, feedback: { rating: number; comment: string }): Promise<Item | null> => {
    try {
        const response = await fetch(`${API_URL}/items/${id}/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedbackRating: feedback.rating,
                feedbackComment: feedback.comment,
            }),
        });
        if (!response.ok) throw new Error('Failed to recover item');
        return await response.json();
    } catch (error) {
        console.error('Error recovering item:', error);
        return null;
    }
};

export const notifyOwner = async (id: string, data: { securityAnswer: string; description: string; phone: string }) => {
    try {
        const response = await fetch(`${API_URL}/complaints/${id}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to notify owner');
        return await response.json();
    } catch (error) {
        console.error('Error notifying owner:', error);
        throw error;
    }
};

export const getRecoveredItems = async (): Promise<Item[]> => {
    try {
        const response = await fetch(`${API_URL}/items?excludeClaimed=false`); // Get all items
        if (!response.ok) throw new Error('Failed to fetch items');
        const items: Item[] = await response.json();
        return items.filter(item => item.status === 'RECOVERED');
    } catch (error) {
        console.error('Error fetching recovered items:', error);
        return [];
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

export const updateComplaintStatus = async (id: string, status: string, reason?: string): Promise<Complaint | null> => {
    try {
        const body: any = { status };
        if (status === 'CLOSED') body.closureReason = reason;
        if (status === 'OPEN') body.reopenReason = reason;
        if (status === 'RESOLVED') body.resolvedAt = new Date().toISOString();

        const response = await fetch(`${API_URL}/complaints/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to update complaint status');
        return await response.json();
    } catch (error) {
        console.error('Error updating complaint status:', error);
        return null;
    }
};

export const getClosedComplaints = async (): Promise<Complaint[]> => {
    try {
        const response = await fetch(`${API_URL}/complaints?status=CLOSED&status=RESOLVED`);
        if (!response.ok) throw new Error('Failed to fetch closed complaints');
        return await response.json();
    } catch (error) {
        console.error('Error fetching closed complaints:', error);
        return [];
    }
};

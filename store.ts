// Simple in-memory store for the prototype
export interface FoundItem {
    id: string;
    name: string;
    category: string;
    location: string;
    date: string;
    description: string;
    secretQuestion: string;
    secretAnswer: string;
    contactInfo: string;
    imageUri?: string;
}

let items: FoundItem[] = [];

export const addItem = (item: FoundItem) => {
    items.push(item);
};

export const getItems = () => {
    return items;
};

export const searchItems = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.location.toLowerCase().includes(lowerQuery)
    );
};

export const getItemById = (id: string) => {
    return items.find(item => item.id === id);
};

// Fuzzy matching utility for complaints
export interface Match {
    complaintId: string;
    complaint: any;
    score: number;
    matchedFields: string[];
}

export const findMatchingComplaints = async (item: {
    name: string;
    category: string;
    location: string;
    date: string;
}, prisma: any): Promise<Match[]> => {
    // Get all open complaints
    const complaints = await prisma.complaint.findMany({
        where: { status: 'open' },
    });

    const matches: Match[] = [];

    for (const complaint of complaints) {
        let score = 0;
        const matchedFields: string[] = [];

        // Name matching (fuzzy)
        if (fuzzyMatch(item.name, complaint.name)) {
            score += 40;
            matchedFields.push('name');
        }

        // Category matching (exact, case-insensitive)
        if (item.category.toLowerCase() === complaint.category.toLowerCase()) {
            score += 30;
            matchedFields.push('category');
        }

        // Location matching (fuzzy)
        if (fuzzyMatch(item.location, complaint.location)) {
            score += 20;
            matchedFields.push('location');
        }

        // Date proximity (within 7 days)
        const itemDate = new Date(item.date);
        const complaintDate = new Date(complaint.date);
        const daysDiff = Math.abs((itemDate.getTime() - complaintDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) {
            score += 10;
            matchedFields.push('date');
        }

        // Consider it a match if score >= 50
        if (score >= 50) {
            matches.push({
                complaintId: complaint.id,
                complaint,
                score,
                matchedFields,
            });
        }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
};

// Simple fuzzy matching: check if strings are similar (case-insensitive, ignores spaces)
function fuzzyMatch(str1: string, str2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    // Exact match
    if (s1 === s2) return true;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Check for common words
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);

    return commonWords.length >= Math.min(words1.length, words2.length) / 2;
}

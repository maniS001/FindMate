import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = "10e0e18d-586e-4a3b-afbb-f5071f040534";
    const complaintId = "ccdfaebb-ecb1-4bab-b6bb-0e7b7e931ac2";

    const updated = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
            userId: userId,
            status: "OPEN" // Normalize status
        }
    });
    console.log('Updated Complaint:', updated);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

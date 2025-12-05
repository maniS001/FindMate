import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    const complaints = await prisma.complaint.findMany({
        select: { id: true, name: true, userId: true, status: true }
    });
    console.log('Complaints:', JSON.stringify(complaints, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

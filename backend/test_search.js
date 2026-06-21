const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.community.findMany({
            where: { scope: 'PUBLIC' },
            include: {
                organization: true,
                _count: { select: { members: { where: { role: { not: 'PENDING' } } } } },
                members: {
                    where: { userId: 'some-random-id' },
                    select: { role: true }
                }
            },
            take: 2
        });
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();

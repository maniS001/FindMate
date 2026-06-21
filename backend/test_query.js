const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const result = await prisma.community.findMany({
            include: {
                _count: { select: { members: { where: { role: { not: 'PENDING' } } } } },
                members: { where: { userId: '123' }, select: { role: true } }
            }
        });
        console.log("SUCCESS");
    } catch(e) { console.error("ERROR:", e.message); }
}
main();

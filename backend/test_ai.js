

async function test() {
    try {
        console.log("Testing validate-complaint...");
        const res1 = await fetch('http://localhost:5000/api/ai/validate-complaint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'Physics book Books & Stationery',
                description: 'I lost my physics book at Chennai park on June 14, 2026. Please help me find it.',
                location: 'Chennai park',
                date: '2026-06-14'
            })
        });
        console.log('validate-complaint:', await res1.json());

        console.log("\nTesting generate-description...");
        const res2 = await fetch('http://localhost:5000/api/ai/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Physics book',
                category: 'Books & Stationery',
                location: 'Chennai park',
                date: '2026-06-14',
                role: 'victim'
            })
        });
        console.log('generate-description:', await res2.json());

    } catch (e) {
        console.error(e);
    }
}
test();

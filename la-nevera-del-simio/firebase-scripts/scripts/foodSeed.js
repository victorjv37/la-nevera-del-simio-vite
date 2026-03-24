const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 🔐 Cargar clave privada
const serviceAccount = require('../la-nevera-del-simio-firebase-adminsdk-fbsvc-2f156cfcd6.json');

// 📦 Cargar JSON de alimentos
const foodsSeed = require('../../assets/foodJsons/foodSeed.json');

// 🚀 Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function normalizeId(text) {
    return text
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
}

async function seedFoods() {
    console.log('🌱 Iniciando seed...');

    for (const alimento of foodsSeed) {
        if (!alimento?.nombre_base) continue;

        const id = normalizeId(alimento.nombre_base);

        await db.collection('foods_base').doc(id).set(
            {
                ...alimento,
                created_at: new Date(),
            },
            { merge: false }
        );

        console.log(`✔ Insertado: ${alimento.nombre_base}`);
    }

    console.log('✅ Seed completado');
    process.exit();
}

seedFoods().catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
});
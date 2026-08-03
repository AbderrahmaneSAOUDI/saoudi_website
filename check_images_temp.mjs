import fs from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
});

let pk = process.env.FIREBASE_PRIVATE_KEY || '';
if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
pk = pk.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk,
    }),
  });
}

const db = getFirestore();

async function main() {
  const lines = [];
  lines.push('=== PROJECTS ===');
  const projSnap = await db.collection('projects').get();
  projSnap.docs.forEach(doc => {
    const d = doc.data();
    lines.push(`[PROJ] ID: ${doc.id} | Title: "${d.title}"`);
    lines.push(`       imageUrl: "${d.imageUrl}"`);
    if (Array.isArray(d.blocks)) {
      d.blocks.forEach((b, i) => {
        if (b.type === 'single_image') lines.push(`       Block ${i} (single_image): "${b.imageUrl}"`);
        if (b.type === 'carousel') lines.push(`       Block ${i} (carousel): ${JSON.stringify(b.images)}`);
      });
    }
  });

  lines.push('\n=== DESIGNS ===');
  const desSnap = await db.collection('designs').get();
  desSnap.docs.forEach(doc => {
    const d = doc.data();
    lines.push(`[DES] ID: ${doc.id} | Title: "${d.title}" | Company: "${d.companyName}"`);
    lines.push(`      imageUrl: "${d.imageUrl}"`);
  });

  fs.writeFileSync('./check_output.txt', lines.join('\n'));
  console.log('Wrote check_output.txt');
}

main().catch(console.error);

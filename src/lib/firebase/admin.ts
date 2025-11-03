import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID as string;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string;
let privateKey = process.env.FIREBASE_PRIVATE_KEY as string;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing Firebase Admin credentials: ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY are set');
}

// Normalize private key from env (handle quoted and \n-escaped keys)
if (typeof privateKey === 'string') {
  if (privateKey.startsWith('"') || privateKey.startsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

export const adminDb = getFirestore(adminApp);



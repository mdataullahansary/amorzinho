import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Firebase environment variables are not configured');
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return firebaseApp;
}

export function getStorageBucket() {
  return getFirebaseApp().storage().bucket();
}

export async function uploadAudioToFirebase(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(`amorzinho/music/${Date.now()}_${fileName}`);

  await file.save(fileBuffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2100',
  });

  return url;
}

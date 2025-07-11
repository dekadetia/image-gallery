import { getFirestore } from 'firebase-admin/firestore';
import admin from '../../firebase-admin';

export default async function handler(req, res) {
  try {
    const db = getFirestore(admin);
    const snapshot = await db.collection('images').orderBy('alphaname').get();

    const images = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ images });
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

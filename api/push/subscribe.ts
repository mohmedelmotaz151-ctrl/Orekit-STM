import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from './_firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const h = String(req.headers.authorization || '');
    if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = await adminAuth().verifyIdToken(h.slice(7));
    const { token, userId, role } = req.body || {};
    if (!token || !userId || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const ref = adminDb()
      .collection('orkeit_civil_defense')
      .doc('push_tokens')
      .collection('records')
      .doc(token.slice(0, 120));

    await ref.set({
      token: String(token),
      userId: String(userId),
      role,
      authUid: decoded.uid,
      updatedAt: Date.now(),
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Push subscription failed' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminMessaging } from '../push/_firebase';

function daysUntil(date: string) {
  const a = new Date();
  const b = new Date(date + 'T00:00:00');
  a.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cronSecret = process.env.cron_secret || process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = adminDb();
    const root = db.collection('orkeit_civil_defense');
    const [sitesSnap, maintSnap, tokensSnap] = await Promise.all([
      root.doc('sites').collection('records').get(),
      root.doc('maintenance').collection('records').get(),
      root.doc('push_tokens').collection('records').where('role', '==', 'admin').get(),
    ]);

    const tokens = tokensSnap.docs.map(d => String(d.data().token)).filter(Boolean).slice(0, 500);
    const notificationCollection = root.doc('notifications').collection('records');
    const messages: Array<{ id: string; body: string; relatedId: string }> = [];
    const today = todayKey();

    const addExpiry = async (id: string, relatedId: string, body: string) => {
      const notificationId = `expiry-${today}-${id}`;
      const ref = notificationCollection.doc(notificationId);
      const existing = await ref.get();
      if (existing.exists) return;
      await ref.set({
        id: notificationId,
        recipientType: 'admin',
        title: 'Orkeit — تنبيه موعد استحقاق',
        body,
        type: 'expiry',
        createdAt: Date.now(),
        read: false,
        relatedId,
      });
      messages.push({ id: notificationId, body, relatedId });
    };

    for (const d of sitesSnap.docs) {
      const x = d.data();
      const contractEnd = String(x.contractEnd || '');
      if (!contractEnd) continue;
      const days = daysUntil(contractEnd);
      if ([30, 15, 7, 3].includes(days)) {
        await addExpiry(`contract-${d.id}-${days}`, String(x.id || d.id), `العقد: ${x.facility || x.client || 'منشأة'} — متبقي ${days} يوم`);
      }
    }

    for (const d of maintSnap.docs) {
      const x = d.data();
      const expiryDate = String(x.expiryDate || '');
      if (!expiryDate) continue;
      const days = daysUntil(expiryDate);
      if ([30, 15, 7, 3].includes(days)) {
        await addExpiry(`maintenance-${d.id}-${days}`, String(x.siteId || d.id), `صيانة الطفايات: ${x.service || 'صيانة'} — متبقي ${days} يوم`);
      }
    }

    let sent = 0;
    let failed = 0;
    if (tokens.length) {
      for (const message of messages) {
        const r = await adminMessaging().sendEachForMulticast({
          tokens,
          notification: { title: 'Orkeit — تنبيه موعد استحقاق', body: message.body },
          data: { type: 'expiry', relatedId: message.relatedId },
          webpush: { fcmOptions: { link: '/' } },
        });
        sent += r.successCount;
        failed += r.failureCount;
      }
    }

    return res.status(200).json({ ok: true, sent, failed, notificationsCreated: messages.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Expiry notification job failed' });
  }
}

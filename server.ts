import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Ensure database directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database schema and default initial admin user
const DEFAULT_DB = {
  users: [
    {
      id: 'user_admin_oriket',
      name: 'إدارة شركة أوريكيت',
      username: '0555335477',
      phone: '0555335477',
      password: '5520',
      role: 'admin',
      active: true,
      targetSitesMonth: 0,
      assignedCity: 'المملكة العربية السعودية',
      joinedDate: new Date().toISOString().split('T')[0],
    },
  ],
  sites: [],
  visits: [],
  followups: [],
  settings: {
    ratePerApprovedSiteSAR: 1.50,
    minTargetSites: 300,
    targetBonusSAR: 100.0,
    tier2TargetSites: 500,
    tier2BonusSAR: 250.0,
  },
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure admin user always exists
    const hasAdmin = parsed.users && parsed.users.some(
      (u: any) => u.phone === '0555335477' || u.username === '0555335477'
    );
    if (!hasAdmin) {
      parsed.users = parsed.users || [];
      parsed.users.unshift(DEFAULT_DB.users[0]);
      writeDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return DEFAULT_DB;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// =================== REST API ENDPOINTS ===================

// GET all database state
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json({
    users: db.users || [],
    sites: db.sites || [],
    visits: db.visits || [],
    followups: db.followups || [],
    settings: db.settings || DEFAULT_DB.settings,
  });
});

// POST /api/login - Centralized authentication across any device
app.post('/api/login', (req, res) => {
  const { phoneOrUsername, password } = req.body || {};
  if (!phoneOrUsername || !password) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم/الجوال وكلمة المرور' });
  }

  const cleanInput = String(phoneOrUsername).trim().toLowerCase();
  const cleanPass = String(password).trim();

  const db = readDB();
  const users = db.users || [];

  const matchedUser = users.find(
    (u: any) =>
      String(u.phone).trim().toLowerCase() === cleanInput ||
      String(u.username).trim().toLowerCase() === cleanInput
  );

  if (!matchedUser) {
    return res.status(404).json({ error: 'رقم الجوال أو اسم المستخدم غير مسجل بالنظام.' });
  }

  if (!matchedUser.active) {
    return res.status(403).json({ error: 'هذا الحساب تم تعطيله من قبل الإدارة.' });
  }

  if (matchedUser.password && String(matchedUser.password).trim() !== cleanPass) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' });
  }

  res.json({
    success: true,
    user: matchedUser,
    allUsers: users,
  });
});

// POST /api/sync - Bidirectional synchronization between client and server
app.post('/api/sync', (req, res) => {
  try {
    const clientData = req.body || {};
    const db = readDB();
    db.users = db.users || [];
    db.sites = db.sites || [];
    db.visits = db.visits || [];
    db.followups = db.followups || [];

    // Merge users (agents)
    if (Array.isArray(clientData.users)) {
      clientData.users.forEach((cUser: any) => {
        if (!cUser || !cUser.phone) return;
        const idx = db.users.findIndex((u: any) => u.id === cUser.id || u.phone === cUser.phone);
        if (idx >= 0) {
          db.users[idx] = { ...db.users[idx], ...cUser };
        } else {
          db.users.push(cUser);
        }
      });
    }

    // Merge sites
    if (Array.isArray(clientData.sites)) {
      clientData.sites.forEach((cSite: any) => {
        if (!cSite || !cSite.id) return;
        const idx = db.sites.findIndex((s: any) => s.id === cSite.id);
        if (idx >= 0) {
          db.sites[idx] = { ...db.sites[idx], ...cSite };
        } else {
          db.sites.unshift(cSite);
        }
      });
    }

    // Merge visits
    if (Array.isArray(clientData.visits)) {
      clientData.visits.forEach((cVisit: any) => {
        if (!cVisit || !cVisit.id) return;
        const exists = db.visits.some((v: any) => v.id === cVisit.id);
        if (!exists) {
          db.visits.unshift(cVisit);
        }
      });
    }

    // Merge followups
    if (Array.isArray(clientData.followups)) {
      clientData.followups.forEach((c言: any) => {
        if (!c言 || !c言.id) return;
        const exists = db.followups.some((f: any) => f.id === c言.id);
        if (!exists) {
          db.followups.unshift(c言);
        }
      });
    }

    // Settings
    if (clientData.settings) {
      db.settings = { ...db.settings, ...clientData.settings };
    }

    writeDB(db);

    res.json({
      success: true,
      users: db.users,
      sites: db.sites,
      visits: db.visits,
      followups: db.followups,
      settings: db.settings,
    });
  } catch (err) {
    console.error('Error during /api/sync:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// POST save / update user (Add Agent via Admin)
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  if (!newUser || !newUser.phone || !newUser.name) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const db = readDB();
  db.users = db.users || [];

  const existingIdx = db.users.findIndex((u: any) => u.id === newUser.id || u.phone === newUser.phone);
  if (existingIdx >= 0) {
    db.users[existingIdx] = { ...db.users[existingIdx], ...newUser };
  } else {
    db.users.push(newUser);
  }

  writeDB(db);
  res.json({ success: true, user: newUser, users: db.users });
});

// PUT toggle user status
app.put('/api/users/:id/toggle', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.users = db.users || [];

  const user = db.users.find((u: any) => u.id === id);
  if (user) {
    user.active = !user.active;
    writeDB(db);
    return res.json({ success: true, user, users: db.users });
  }
  res.status(404).json({ error: 'User not found' });
});

// POST save / update site
app.post('/api/sites', (req, res) => {
  const newSite = req.body;
  if (!newSite || !newSite.name) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  const db = readDB();
  db.sites = db.sites || [];

  const existingIdx = db.sites.findIndex((s: any) => s.id === newSite.id);
  if (existingIdx >= 0) {
    db.sites[existingIdx] = { ...db.sites[existingIdx], ...newSite };
  } else {
    db.sites.unshift(newSite);
  }

  writeDB(db);
  res.json({ success: true, site: newSite, sites: db.sites });
});

// PUT approve / reject site
app.put('/api/sites/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approved, reason, approvedBy } = req.body;
  const db = readDB();
  db.sites = db.sites || [];

  const site = db.sites.find((s: any) => s.id === id);
  if (site) {
    site.approvalStatus = approved ? 'approved' : 'rejected';
    site.rejectionReason = approved ? undefined : reason;
    site.approvedAt = approved ? new Date().toISOString().split('T')[0] : undefined;
    site.approvedBy = approved ? approvedBy : undefined;
    site.incentivePaid = approved;

    writeDB(db);
    return res.json({ success: true, site, sites: db.sites });
  }
  res.status(404).json({ error: 'Site not found' });
});

// PUT update site status
app.put('/api/sites/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDB();
  db.sites = db.sites || [];

  const site = db.sites.find((s: any) => s.id === id);
  if (site) {
    site.status = status;
    site.updatedAt = new Date().toISOString().split('T')[0];
    writeDB(db);
    return res.json({ success: true, site, sites: db.sites });
  }
  res.status(404).json({ error: 'Site not found' });
});

// POST save visit
app.post('/api/visits', (req, res) => {
  const newVisit = req.body;
  if (!newVisit) {
    return res.status(400).json({ error: 'Visit data required' });
  }

  const db = readDB();
  db.visits = db.visits || [];
  db.visits.unshift(newVisit);

  writeDB(db);
  res.json({ success: true, visit: newVisit, visits: db.visits });
});

// POST save follow-up
app.post('/api/followups', (req, res) => {
  const newFol = req.body;
  const db = readDB();
  db.followups = db.followups || [];
  db.followups.unshift(newFol);

  writeDB(db);
  res.json({ success: true, followup: newFol, followups: db.followups });
});

// PUT update settings
app.put('/api/settings', (req, res) => {
  const newSettings = req.body;
  const db = readDB();
  db.settings = { ...db.settings, ...newSettings };

  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// =================== VITE & STATIC FILES ===================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Oriket Server] Running on http://localhost:${PORT}`);
    console.log(`[Oriket Database] Stored at: ${DB_FILE}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();

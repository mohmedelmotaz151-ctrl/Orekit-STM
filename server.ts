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
      username: '0555334577',
      phone: '0555334577',
      password: '5520',
      role: 'admin',
      active: true,
      targetSitesMonth: 0,
      assignedCity: 'المملكة العربية السعودية',
      joinedDate: new Date().toISOString().split('T')[0],
    },
    {
      id: 'user_client_demo',
      name: 'عبدالله السبيعي (مسؤول السلامة)',
      username: '0500112233',
      phone: '0500112233',
      password: '1234',
      role: 'client',
      active: true,
      targetSitesMonth: 0,
      assignedCity: 'الرياض',
      facilityName: 'مجمع أسواق السلام التجاري',
      joinedDate: new Date().toISOString().split('T')[0],
    },
  ],
  sites: [],
  visits: [],
  followups: [],
  incidents: [],
  inquiries: [],
  renewals: [],
  civilDefenseAlerts: [],
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
    parsed.users = parsed.users || [];

    // Ensure admin user with 0555334577 (or previous 0555335477) always exists and is updated
    const adminIdx = parsed.users.findIndex(
      (u: any) => u.phone === '0555334577' || u.username === '0555334577' || u.phone === '0555335477' || u.username === '0555335477' || u.id === 'user_admin_oriket'
    );
    if (adminIdx >= 0) {
      if (parsed.users[adminIdx].phone !== '0555334577' || parsed.users[adminIdx].username !== '0555334577') {
        parsed.users[adminIdx].phone = '0555334577';
        parsed.users[adminIdx].username = '0555334577';
        writeDB(parsed);
      }
    } else {
      parsed.users.unshift(DEFAULT_DB.users[0]);
      writeDB(parsed);
    }
    const hasClient = parsed.users.some(
      (u: any) => u.phone === '0500112233' || u.username === '0500112233'
    );
    if (!hasClient && DEFAULT_DB.users[1]) {
      parsed.users.push(DEFAULT_DB.users[1]);
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
    incidents: db.incidents || [],
    inquiries: db.inquiries || [],
    renewals: db.renewals || [],
    civilDefenseAlerts: db.civilDefenseAlerts || [],
    settings: db.settings || DEFAULT_DB.settings,
  });
});

// GET users
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json({ users: db.users || [] });
});

// GET sites
app.get('/api/sites', (req, res) => {
  const db = readDB();
  res.json({ sites: db.sites || [] });
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

    // Merge incidents
    db.incidents = db.incidents || [];
    if (Array.isArray(clientData.incidents)) {
      clientData.incidents.forEach((cInc: any) => {
        if (!cInc || !cInc.id) return;
        const idx = db.incidents.findIndex((i: any) => i.id === cInc.id);
        if (idx >= 0) {
          db.incidents[idx] = { ...db.incidents[idx], ...cInc };
        } else {
          db.incidents.unshift(cInc);
        }
      });
    }

    // Merge inquiries
    db.inquiries = db.inquiries || [];
    if (Array.isArray(clientData.inquiries)) {
      clientData.inquiries.forEach((cInq: any) => {
        if (!cInq || !cInq.id) return;
        const idx = db.inquiries.findIndex((i: any) => i.id === cInq.id);
        if (idx >= 0) {
          db.inquiries[idx] = { ...db.inquiries[idx], ...cInq };
        } else {
          db.inquiries.unshift(cInq);
        }
      });
    }

    // Merge renewals
    db.renewals = db.renewals || [];
    if (Array.isArray(clientData.renewals)) {
      clientData.renewals.forEach((cRen: any) => {
        if (!cRen || !cRen.id) return;
        const idx = db.renewals.findIndex((r: any) => r.id === cRen.id);
        if (idx >= 0) {
          db.renewals[idx] = { ...db.renewals[idx], ...cRen };
        } else {
          db.renewals.unshift(cRen);
        }
      });
    }

    // Merge civil defense alerts
    db.civilDefenseAlerts = db.civilDefenseAlerts || [];
    if (Array.isArray(clientData.civilDefenseAlerts)) {
      clientData.civilDefenseAlerts.forEach((cAlert: any) => {
        if (!cAlert || !cAlert.id) return;
        const idx = db.civilDefenseAlerts.findIndex((a: any) => a.id === cAlert.id);
        if (idx >= 0) {
          db.civilDefenseAlerts[idx] = { ...db.civilDefenseAlerts[idx], ...cAlert };
        } else {
          db.civilDefenseAlerts.unshift(cAlert);
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
      incidents: db.incidents,
      inquiries: db.inquiries,
      renewals: db.renewals,
      civilDefenseAlerts: db.civilDefenseAlerts,
      settings: db.settings,
    });
  } catch (err) {
    console.error('Error during /api/sync:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// POST /api/register-client - Self-service client account creation with site and optional initial request
app.post('/api/register-client', (req, res) => {
  const {
    clientName,
    phone,
    password,
    facilityName,
    siteType,
    city,
    district,
    address,
    hasLicense,
    licenseType,
    hasContract,
    contractCompany,
    contractEndDate,
    initialRequestType,
    initialRequestNotes,
  } = req.body || {};

  if (!clientName || !phone || !facilityName) {
    return res.status(400).json({ error: 'اسم العميل ورقم الجوال واسم المنشأة مطلوبان.' });
  }

  const cleanPhone = String(phone).trim();
  const db = readDB();
  db.users = db.users || [];
  db.sites = db.sites || [];
  db.incidents = db.incidents || [];
  db.renewals = db.renewals || [];
  db.civilDefenseAlerts = db.civilDefenseAlerts || [];

  // Check if client with this phone or username already exists
  const existingUser = db.users.find(
    (u: any) => u.phone === cleanPhone || u.username === cleanPhone
  );

  const siteId = `site_client_${Date.now()}`;
  const userId = existingUser ? existingUser.id : `client_${Date.now()}`;

  // 1. Create or link Site
  const newSite = {
    id: siteId,
    name: String(facilityName).trim(),
    type: siteType || 'مطعم',
    managerName: String(clientName).trim(),
    phone: cleanPhone,
    city: city || 'الرياض',
    district: district || '',
    address: address || '',
    latitude: 24.7136,
    longitude: 46.6753,
    license: {
      hasLicense: hasLicense === 'yes' ? 'yes' : 'no',
      licenseType: licenseType || 'رخصة دفاع مدني',
      licenseNumber: '',
      expiryDate: '',
    },
    contract: {
      hasContract: hasContract === 'yes' ? 'yes' : 'no',
      companyName: contractCompany || (hasContract === 'yes' ? 'شركة سلامة' : ''),
      startDate: new Date().toISOString().split('T')[0],
      endDate: contractEndDate || '',
    },
    equipment: {
      extinguishers: {
        totalCount: 4,
        types: ['powder', 'co2'],
        needsMaintenance: hasContract !== 'yes',
        needsReplacement: false,
        needsNewInstall: false,
      },
      alarmSystem: {
        exists: true,
        working: true,
        needsMaintenance: false,
        needsInstall: false,
        detectorCount: 4,
        callPointCount: 1,
        panelType: 'معنون (Addressable)',
      },
      waterAndPumps: {
        sprinklersExist: false,
        sprinklersCount: 0,
        sprinklersCondition: 'good',
        pumpsExist: false,
        pumpsType: 'كهرباء',
        pumpsWorking: true,
        fireHoseReelsCount: 1,
        fireCabinetsCount: 1,
        specialSuppressionSystem: 'لا يوجد',
        specialSuppressionWorking: true,
      },
    },
    civilDefense: {
      hasRecord: true,
      nextVisitDate: initialRequestType === 'civil_defense' ? '2026-10-15' : undefined,
    },
    status: (hasContract !== 'yes' || initialRequestType === 'renewal' || initialRequestType === 'urgent_fault')
      ? 'urgent_maintenance'
      : 'needs_followup',
    approvalStatus: 'approved',
    approvedAt: new Date().toISOString().split('T')[0],
    approvedBy: 'التسجيل الذاتي للعميل',
    createdByAgentId: 'client_self_registration',
    createdByAgentName: 'تسجيل العميل الذاتي',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    incentiveAmount: 0,
    incentivePaid: false,
    visitsCount: 0,
  };

  db.sites.unshift(newSite);

  // 2. Create or update User
  const newUser = {
    id: userId,
    name: String(clientName).trim(),
    username: cleanPhone,
    phone: cleanPhone,
    password: password ? String(password).trim() : '1234',
    role: 'client',
    active: true,
    siteId: siteId,
    facilityName: String(facilityName).trim(),
    assignedCity: city || 'الرياض',
    targetSitesMonth: 0,
    joinedDate: new Date().toISOString().split('T')[0],
  };

  if (existingUser) {
    const idx = db.users.findIndex((u: any) => u.id === existingUser.id);
    db.users[idx] = { ...db.users[idx], ...newUser };
  } else {
    db.users.push(newUser);
  }

  // 3. Handle initial immediate request if selected
  if (initialRequestType === 'renewal') {
    const newRenewal = {
      id: `ren_${Date.now()}`,
      siteId,
      siteName: newSite.name,
      clientUserId: userId,
      clientName: newUser.name,
      clientPhone: cleanPhone,
      currentContractEndDate: contractEndDate || undefined,
      requestedDurationYears: 1,
      notes: initialRequestNotes || 'طلب تجديد عقد صيانة السلامة مقدم فور إنشاء الحساب',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.renewals.unshift(newRenewal);
  } else if (initialRequestType === 'urgent_fault') {
    const newIncident = {
      id: `inc_${Date.now()}`,
      siteId,
      siteName: newSite.name,
      clientUserId: userId,
      clientName: newUser.name,
      clientPhone: cleanPhone,
      title: 'طلب زيارة طارئة لعطل',
      category: 'other',
      priority: 'urgent',
      description: initialRequestNotes || 'طلب زيارة صيانة طارئة وفحص فوري لأنظمة السلامة',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.incidents.unshift(newIncident);
  } else if (initialRequestType === 'regular_visit') {
    const newIncident = {
      id: `inc_visit_${Date.now()}`,
      siteId,
      siteName: newSite.name,
      clientUserId: userId,
      clientName: newUser.name,
      clientPhone: cleanPhone,
      title: 'طلب زيارة فحص دوري ومعاينة',
      category: 'extinguisher',
      priority: 'medium',
      description: initialRequestNotes || 'طلب زيارة فحص دوري والتأكد من مطابقة طفايات وأنظمة السلامة',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.incidents.unshift(newIncident);
  } else if (initialRequestType === 'civil_defense') {
    const cdAlert = {
      id: `cd_${siteId}`,
      siteId,
      siteName: newSite.name,
      scheduledDate: '2026-10-15',
      inspectionType: 'safety_compliance',
      preInspectionVisitRequested: true,
      checklistStatus: {
        extinguishersReady: true,
        alarmSystemReady: true,
        exitsAndLightingClear: true,
        pumpsReady: true,
        contractValid: hasContract === 'yes',
      },
      status: 'upcoming',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    db.civilDefenseAlerts.unshift(cdAlert);

    // Also create urgent ticket for pre-inspection audit
    const newIncident = {
      id: `inc_cd_${Date.now()}`,
      siteId,
      siteName: newSite.name,
      clientUserId: userId,
      clientName: newUser.name,
      clientPhone: cleanPhone,
      title: 'تحديد موعد زيارة دفاع مدني - طلب كشف استباقي',
      category: 'other',
      priority: 'urgent',
      description: initialRequestNotes || 'تحديد موعد تفتيش قادم للدفاع المدني، نطلب زيارة فحص استباقية للجاهزية',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.incidents.unshift(newIncident);
  }

  writeDB(db);

  res.json({
    success: true,
    user: newUser,
    site: newSite,
    allUsers: db.users,
    allSites: db.sites,
  });
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

// =================== CLIENT PORTAL ENDPOINTS ===================

// POST save / create incident
app.post('/api/incidents', (req, res) => {
  const incident = req.body;
  if (!incident || !incident.id || !incident.title) {
    return res.status(400).json({ error: 'Incident details are required' });
  }

  const db = readDB();
  db.incidents = db.incidents || [];
  const idx = db.incidents.findIndex((i: any) => i.id === incident.id);
  if (idx >= 0) {
    db.incidents[idx] = { ...db.incidents[idx], ...incident };
  } else {
    db.incidents.unshift(incident);
  }

  writeDB(db);
  res.json({ success: true, incident, incidents: db.incidents });
});

// PUT update incident status or technician notes
app.put('/api/incidents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const db = readDB();
  db.incidents = db.incidents || [];

  const idx = db.incidents.findIndex((i: any) => i.id === id);
  if (idx >= 0) {
    db.incidents[idx] = { ...db.incidents[idx], ...updates };
    writeDB(db);
    return res.json({ success: true, incident: db.incidents[idx], incidents: db.incidents });
  }
  res.status(404).json({ error: 'Incident not found' });
});

// POST save inquiry
app.post('/api/inquiries', (req, res) => {
  const inquiry = req.body;
  if (!inquiry || !inquiry.id || !inquiry.question) {
    return res.status(400).json({ error: 'Inquiry details are required' });
  }

  const db = readDB();
  db.inquiries = db.inquiries || [];
  const idx = db.inquiries.findIndex((i: any) => i.id === inquiry.id);
  if (idx >= 0) {
    db.inquiries[idx] = { ...db.inquiries[idx], ...inquiry };
  } else {
    db.inquiries.unshift(inquiry);
  }

  writeDB(db);
  res.json({ success: true, inquiry, inquiries: db.inquiries });
});

// PUT answer inquiry
app.put('/api/inquiries/:id/answer', (req, res) => {
  const { id } = req.params;
  const { answer, answeredBy } = req.body || {};
  const db = readDB();
  db.inquiries = db.inquiries || [];

  const idx = db.inquiries.findIndex((i: any) => i.id === id);
  if (idx >= 0) {
    db.inquiries[idx] = {
      ...db.inquiries[idx],
      status: 'answered',
      answer,
      answeredBy: answeredBy || 'مهندس السلامة - أوريكيت',
      answeredAt: new Date().toISOString(),
    };
    writeDB(db);
    return res.json({ success: true, inquiry: db.inquiries[idx], inquiries: db.inquiries });
  }
  res.status(404).json({ error: 'Inquiry not found' });
});

// POST save contract renewal request
app.post('/api/renewals', (req, res) => {
  const renewal = req.body;
  if (!renewal || !renewal.id) {
    return res.status(400).json({ error: 'Renewal request details are required' });
  }

  const db = readDB();
  db.renewals = db.renewals || [];
  const idx = db.renewals.findIndex((r: any) => r.id === renewal.id);
  if (idx >= 0) {
    db.renewals[idx] = { ...db.renewals[idx], ...renewal };
  } else {
    db.renewals.unshift(renewal);
  }

  writeDB(db);
  res.json({ success: true, renewal, renewals: db.renewals });
});

// PUT update contract renewal request
app.put('/api/renewals/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const db = readDB();
  db.renewals = db.renewals || [];

  const idx = db.renewals.findIndex((r: any) => r.id === id);
  if (idx >= 0) {
    db.renewals[idx] = { ...db.renewals[idx], ...updates };
    writeDB(db);
    return res.json({ success: true, renewal: db.renewals[idx], renewals: db.renewals });
  }
  res.status(404).json({ error: 'Renewal request not found' });
});

// POST / PUT civil defense alert
app.post('/api/civil_defense_alerts', (req, res) => {
  const alert = req.body;
  if (!alert || !alert.id) {
    return res.status(400).json({ error: 'Civil defense alert details required' });
  }

  const db = readDB();
  db.civilDefenseAlerts = db.civilDefenseAlerts || [];
  const idx = db.civilDefenseAlerts.findIndex((a: any) => a.id === alert.id);
  if (idx >= 0) {
    db.civilDefenseAlerts[idx] = { ...db.civilDefenseAlerts[idx], ...alert };
  } else {
    db.civilDefenseAlerts.unshift(alert);
  }

  writeDB(db);
  res.json({ success: true, alert, civilDefenseAlerts: db.civilDefenseAlerts });
});

app.put('/api/civil_defense_alerts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const db = readDB();
  db.civilDefenseAlerts = db.civilDefenseAlerts || [];

  const idx = db.civilDefenseAlerts.findIndex((a: any) => a.id === id);
  if (idx >= 0) {
    db.civilDefenseAlerts[idx] = { ...db.civilDefenseAlerts[idx], ...updates };
    writeDB(db);
    return res.json({ success: true, alert: db.civilDefenseAlerts[idx], civilDefenseAlerts: db.civilDefenseAlerts });
  }
  res.status(404).json({ error: 'Civil defense alert not found' });
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

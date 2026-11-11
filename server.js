import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (!Number.isFinite(nodeMajor) || nodeMajor < 24) {
  console.error(`同频需要 Node.js 24 或更高版本（当前 ${process.versions.node}）。`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');
const INDEX_TEMPLATE = fs.readFileSync(INDEX_FILE, 'utf8');
const DB_FILE = process.env.DB_PATH || path.join(DATA_DIR, 'tongpin.db');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_COOKIE = 'tp_session';
const SESSION_DAYS = 30;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#0A66FF',
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    course TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL REFERENCES users(id),
    join_slug TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'prep',
    status TEXT NOT NULL DEFAULT 'active',
    deadline TEXT,
    color INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TEXT NOT NULL,
    work_status TEXT NOT NULL DEFAULT 'idle',
    activity TEXT NOT NULL DEFAULT '',
    status_updated_at TEXT,
    PRIMARY KEY (project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploader_id TEXT NOT NULL REFERENCES users(id),
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    file_id TEXT REFERENCES files(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES users(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    progress INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_updates (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(project_id, target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_posts_project ON posts(project_id);
  CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id, created_at);
`);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
  ].join('; '));
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tongpin', time: new Date().toISOString() });
});
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const nowIso = () => new Date().toISOString();
const newId = () => crypto.randomUUID();
const avatarPalette = ['#0A66FF', '#12B76A', '#7A5AF8', '#F79009', '#EE4E8B', '#00A6A6', '#F04438', '#4E5BA6'];
const statusLabels = {
  idle: '空闲',
  focus: '专注工作中',
  research: '资料调研中',
  review: '评审中',
  blocked: '遇到阻塞',
  break: '稍作休息',
};
const taskStatusLabels = { todo: '待开始', doing: '进行中', review: '待评审', done: '已完成' };
const allowedWorkStatuses = new Set(Object.keys(statusLabels));
const allowedTaskStatuses = new Set(Object.keys(taskStatusLabels));
const allowedPriorities = new Set(['low', 'medium', 'high']);
const allowedExtensions = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.zip', '.rar', '.7z',
]);

function hashSecret(secret) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifySecret(secret, stored) {
  try {
    const [kind, salt, hash] = String(stored).split('$');
    if (kind !== 'scrypt' || !salt || !hash) return false;
    const candidate = crypto.scryptSync(secret, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    bio: row.bio || '',
    createdAt: row.created_at,
  };
}

function publicMember(row) {
  return {
    id: row.user_id || row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
  };
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      try { out[key] = decodeURIComponent(value); } catch { out[key] = value; }
    }
  }
  return out;
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.*, s.expires_at FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return safeUser(row);
}

function setSessionCookie(req, res, token) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: '请先登录后再继续。', code: 'UNAUTHENTICATED' });
  req.user = user;
  next();
}

function optionalAuth(req, _res, next) {
  req.user = currentUser(req);
  next();
}

function projectRowById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function membership(projectId, userId) {
  return db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
}

function loadProjectMember(req, res, next) {
  const project = projectRowById(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在或链接已失效。' });
  const member = membership(project.id, req.user.id);
  if (!member) return res.status(403).json({ error: '你还不是该项目成员，请通过项目链接和密码加入。', code: 'NOT_MEMBER' });
  req.project = project;
  req.membership = member;
  next();
}

function requireActive(req, res, next) {
  if (req.project.status !== 'active') {
    return res.status(409).json({ error: '项目已结束，当前为只读归档状态。', code: 'PROJECT_ENDED' });
  }
  next();
}

function requireOwner(req, res, next) {
  if (req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只有项目发起者可以执行此操作。' });
  }
  next();
}

function cleanText(value, max = 500) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

function validDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function logActivity(projectId, userId, kind, message) {
  db.prepare('INSERT INTO activities (id, project_id, user_id, kind, message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(newId(), projectId, userId || null, kind, message, nowIso());
}

function projectSummary(project) {
  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(project.owner_id);
  const count = db.prepare('SELECT COUNT(*) AS n FROM project_members WHERE project_id = ?').get(project.id).n;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    course: project.course,
    ownerId: project.owner_id,
    owner: safeUser(owner),
    joinSlug: project.join_slug,
    sharePath: `/p/${project.join_slug}`,
    phase: project.phase,
    status: project.status,
    deadline: project.deadline,
    color: project.color,
    memberCount: count,
    createdAt: project.created_at,
    startedAt: project.started_at,
    endedAt: project.ended_at,
  };
}

function normalizedFileName(name) {
  const fallback = '未命名文件';
  if (!name) return fallback;
  let result = name;
  if (!/[\u3400-\u9fff]/.test(result)) {
    try {
      const decoded = Buffer.from(result, 'latin1').toString('utf8');
      if (!decoded.includes('\uFFFD')) result = decoded;
    } catch { /* keep original */ }
  }
  return result.replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 180) || fallback;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(normalizedFileName(file.originalname)).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(normalizedFileName(file.originalname)).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      const error = new Error('暂不支持该文件类型，请上传文档、表格、演示文稿、图片或压缩包。');
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

function removeUpload(storedName) {
  if (!storedName) return;
  const full = path.join(UPLOAD_DIR, storedName);
  if (path.dirname(full) !== UPLOAD_DIR) return;
  fs.unlink(full, () => {});
}

const rateBuckets = new Map();
function rateLimit({ windowMs = 60_000, max = 20, key = 'default' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const bucketKey = `${key}:${ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(bucketKey);
    if (!bucket || now - bucket.startedAt > windowMs) {
      bucket = { count: 0, startedAt: now };
      rateBuckets.set(bucketKey, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: '操作过于频繁，请稍后再试。' });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.startedAt > 15 * 60_000) rateBuckets.delete(key);
  }
}, 5 * 60_000).unref();

// ---------------- Authentication ----------------

app.post('/api/auth/register', rateLimit({ windowMs: 10 * 60_000, max: 30, key: 'register' }), (req, res) => {
  const username = cleanText(req.body.username, 24).toLowerCase();
  const displayName = cleanText(req.body.displayName, 24) || username;
  const password = String(req.body.password || '');
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    return res.status(400).json({ error: '用户名需为 3–24 位字母、数字、下划线、点或短横线。' });
  }
  if (!displayName) return res.status(400).json({ error: '请填写你的昵称。' });
  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ error: '密码长度需为 6–72 位。' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '这个用户名已被使用，换一个试试。' });

  const id = newId();
  const color = avatarPalette[Math.floor(Math.random() * avatarPalette.length)];
  db.prepare(`
    INSERT INTO users (id, username, display_name, password_hash, avatar_color, bio, created_at)
    VALUES (?, ?, ?, ?, ?, '', ?)
  `).run(id, username, displayName, hashSecret(password), color, nowIso());

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, id, nowIso(), expires);
  setSessionCookie(req, res, token);
  const user = safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  res.status(201).json({ user });
});

app.post('/api/auth/login', rateLimit({ windowMs: 10 * 60_000, max: 40, key: 'login' }), (req, res) => {
  const username = cleanText(req.body.username, 24).toLowerCase();
  const password = String(req.body.password || '');
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码。' });
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row || !verifySecret(password, row.password_hash)) {
    return res.status(401).json({ error: '用户名或密码不正确。' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, row.id, nowIso(), expires);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
  setSessionCookie(req, res, token);
  res.json({ user: safeUser(row) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  res.json({ user: user || null });
});

app.patch('/api/me', requireAuth, (req, res) => {
  const displayName = req.body.displayName === undefined ? req.user.displayName : cleanText(req.body.displayName, 24);
  const bio = req.body.bio === undefined ? req.user.bio : cleanText(req.body.bio, 160);
  if (!displayName) return res.status(400).json({ error: '昵称不能为空。' });
  const colorCandidate = String(req.body.avatarColor || req.user.avatarColor);
  const avatarColor = avatarPalette.includes(colorCandidate) ? colorCandidate : req.user.avatarColor;
  db.prepare('UPDATE users SET display_name = ?, bio = ?, avatar_color = ? WHERE id = ?')
    .run(displayName, bio, avatarColor, req.user.id);
  const user = safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  res.json({ user });
});

// ---------------- Projects & dashboard ----------------

app.get('/api/projects', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, pm.role, pm.work_status, pm.activity,
      (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS member_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count,
      (SELECT COALESCE(ROUND(AVG(t.progress)), 0) FROM tasks t WHERE t.project_id = p.id) AS task_progress,
      (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) AS comment_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = ?
    ORDER BY CASE WHEN p.status = 'active' THEN 0 ELSE 1 END, p.updated_at DESC
  `).all(req.user.id);

  const projects = rows.map((row) => {
    const summary = projectSummary(row);
    const members = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_color
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?
      ORDER BY CASE pm.role WHEN 'owner' THEN 0 ELSE 1 END, pm.joined_at ASC
      LIMIT 5
    `).all(row.id).map((member) => ({
      id: member.id,
      username: member.username,
      displayName: member.display_name,
      avatarColor: member.avatar_color,
    }));
    return {
      ...summary,
      role: row.role,
      memberCount: row.member_count,
      taskCount: row.task_count,
      doneCount: row.done_count,
      commentCount: row.comment_count,
      progress: row.task_count ? row.task_progress : 0,
      myRole: row.role,
      workStatus: row.work_status,
      activity: row.activity,
      members,
    };
  });

  const pendingTasks = db.prepare(`
    SELECT t.*, p.name AS project_name, p.color AS project_color, p.status AS project_status
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.assignee_id = ? AND t.status != 'done' AND p.status = 'active'
    ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.updated_at DESC
    LIMIT 8
  `).all(req.user.id).map((task) => ({
    id: task.id,
    projectId: task.project_id,
    projectName: task.project_name,
    projectColor: task.project_color,
    title: task.title,
    status: task.status,
    progress: task.progress,
    priority: task.priority,
    dueDate: task.due_date,
    updatedAt: task.updated_at,
  }));

  const active = projects.filter((project) => project.status === 'active');
  const ended = projects.filter((project) => project.status !== 'active');
  res.json({
    projects,
    active,
    ended,
    pendingTasks,
    stats: {
      activeCount: active.length,
      endedCount: ended.length,
      pendingCount: pendingTasks.length,
      totalCount: projects.length,
    },
  });
});

app.post('/api/projects', requireAuth, rateLimit({ windowMs: 60 * 60_000, max: 30, key: 'create-project' }), (req, res) => {
  const name = cleanText(req.body.name, 60);
  const description = cleanText(req.body.description, 400);
  const course = cleanText(req.body.course, 40);
  const password = String(req.body.password || '');
  const deadline = validDate(req.body.deadline);
  if (!name) return res.status(400).json({ error: '请填写项目名称。' });
  if (password.length < 4 || password.length > 64) {
    return res.status(400).json({ error: '项目密码长度需为 4–64 位。' });
  }

  const id = newId();
  const slug = crypto.randomBytes(6).toString('base64url');
  const createdAt = nowIso();
  const color = Math.floor(Math.random() * 5);
  db.prepare(`
    INSERT INTO projects (id, name, description, course, owner_id, join_slug, password_hash, phase, status, deadline, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'prep', 'active', ?, ?, ?, ?)
  `).run(id, name, description, course, req.user.id, slug, hashSecret(password), deadline, color, createdAt, createdAt);
  db.prepare(`
    INSERT INTO project_members (project_id, user_id, role, joined_at, work_status, activity, status_updated_at)
    VALUES (?, ?, 'owner', ?, 'idle', '', ?)
  `).run(id, req.user.id, createdAt, createdAt);
  logActivity(id, req.user.id, 'project', `创建了项目「${name}」`);
  const project = projectRowById(id);
  res.status(201).json({ project: { ...projectSummary(project), isOwner: true, myRole: 'owner' } });
});

app.get('/api/projects/by-slug/:slug', optionalAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE join_slug = ?').get(req.params.slug);
  if (!project) return res.status(404).json({ error: '项目不存在或链接已失效。' });
  const isMember = req.user ? Boolean(membership(project.id, req.user.id)) : false;
  const summary = projectSummary(project);
  res.json({
    project: {
      id: summary.id,
      name: summary.name,
      course: summary.course,
      owner: summary.owner,
      memberCount: summary.memberCount,
      phase: summary.phase,
      status: summary.status,
      color: summary.color,
      createdAt: summary.createdAt,
    },
    isMember,
    isOwner: req.user ? summary.ownerId === req.user.id : false,
    joinClosed: summary.status !== 'active',
  });
});

app.post('/api/projects/by-slug/:slug/unlock', requireAuth, rateLimit({ windowMs: 10 * 60_000, max: 30, key: 'unlock' }), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE join_slug = ?').get(req.params.slug);
  if (!project) return res.status(404).json({ error: '项目不存在或链接已失效。' });
  const existing = membership(project.id, req.user.id);
  if (existing) return res.json({ projectId: project.id, joined: false });
  if (project.status !== 'active') {
    return res.status(409).json({ error: '项目已结束，无法再加入。', code: 'PROJECT_ENDED' });
  }
  const password = String(req.body.password || '');
  if (!password || !verifySecret(password, project.password_hash)) {
    return res.status(403).json({ error: '项目密码不正确，请向项目发起者确认。', code: 'WRONG_PASSWORD' });
  }
  const joinedAt = nowIso();
  db.prepare(`
    INSERT INTO project_members (project_id, user_id, role, joined_at, work_status, activity, status_updated_at)
    VALUES (?, ?, 'member', ?, 'idle', '', ?)
  `).run(project.id, req.user.id, joinedAt, joinedAt);
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(joinedAt, project.id);
  logActivity(project.id, req.user.id, 'member', '加入了项目');
  emitProject(project.id, 'member');
  res.json({ projectId: project.id, joined: true });
});

app.get('/api/projects/:id', requireAuth, loadProjectMember, (req, res) => {
  res.json(buildProjectOverview(req.project, req.user, req.membership));
});

function buildProjectOverview(project, user, member) {
  const summary = projectSummary(project);
  const memberRows = db.prepare(`
    SELECT pm.*, u.username, u.display_name, u.avatar_color, u.bio
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY CASE pm.role WHEN 'owner' THEN 0 ELSE 1 END, pm.joined_at ASC
  `).all(project.id);

  const tasks = db.prepare(`
    SELECT t.*, u.display_name AS assignee_name, u.avatar_color AS assignee_color, u.username AS assignee_username
    FROM tasks t JOIN users u ON u.id = t.assignee_id
    WHERE t.project_id = ?
    ORDER BY CASE t.status WHEN 'doing' THEN 0 WHEN 'review' THEN 1 WHEN 'todo' THEN 2 ELSE 3 END,
      CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.updated_at DESC
  `).all(project.id).map((task) => ({
    id: task.id,
    projectId: task.project_id,
    assigneeId: task.assignee_id,
    createdBy: task.created_by,
    title: task.title,
    description: task.description,
    status: task.status,
    progress: task.progress,
    priority: task.priority,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    assignee: {
      id: task.assignee_id,
      username: task.assignee_username,
      displayName: task.assignee_name,
      avatarColor: task.assignee_color,
    },
  }));

  const memberCommentCounts = new Map();
  for (const row of db.prepare(`
    SELECT target_id, COUNT(*) AS n FROM comments
    WHERE project_id = ? AND target_type = 'member' GROUP BY target_id
  `).all(project.id)) {
    memberCommentCounts.set(row.target_id, row.n);
  }

  const members = memberRows.map((row) => {
    const ownTasks = tasks.filter((task) => task.assigneeId === row.user_id);
    const done = ownTasks.filter((task) => task.status === 'done').length;
    const progress = ownTasks.length
      ? Math.round(ownTasks.reduce((sum, task) => sum + task.progress, 0) / ownTasks.length)
      : 0;
    return {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarColor: row.avatar_color,
      bio: row.bio || '',
      role: row.role,
      joinedAt: row.joined_at,
      workStatus: row.work_status,
      statusLabel: statusLabels[row.work_status] || statusLabels.idle,
      activity: row.activity || '',
      statusUpdatedAt: row.status_updated_at,
      taskCount: ownTasks.length,
      doneCount: done,
      progress,
      commentCount: memberCommentCounts.get(row.user_id) || 0,
      taskTitles: ownTasks.slice(0, 3).map((task) => task.title),
    };
  });

  const commentRows = db.prepare(`
    SELECT c.*, u.display_name, u.avatar_color, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.project_id = ? AND c.target_type = 'post'
    ORDER BY c.created_at ASC
  `).all(project.id);
  const commentsByPost = new Map();
  for (const row of commentRows) {
    if (!commentsByPost.has(row.target_id)) commentsByPost.set(row.target_id, []);
    commentsByPost.get(row.target_id).push({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      user: { id: row.user_id, username: row.username, displayName: row.display_name, avatarColor: row.avatar_color },
    });
  }

  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_color,
      f.original_name, f.size, f.mime, f.created_at AS file_created_at
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN files f ON f.id = p.file_id
    WHERE p.project_id = ?
    ORDER BY p.created_at DESC
  `).all(project.id).map((post) => {
    const comments = commentsByPost.get(post.id) || [];
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.created_at,
      user: { id: post.user_id, username: post.username, displayName: post.display_name, avatarColor: post.avatar_color },
      file: post.file_id ? {
        id: post.file_id,
        name: post.original_name,
        size: post.size,
        mime: post.mime,
        createdAt: post.file_created_at,
      } : null,
      comments,
      commentCount: comments.length,
    };
  });

  const notices = db.prepare(`
    SELECT n.*, u.display_name, u.avatar_color
    FROM notices n JOIN users u ON u.id = n.user_id
    WHERE n.project_id = ? AND n.pinned = 1
    ORDER BY n.created_at DESC
  `).all(project.id).map((notice) => ({
    id: notice.id,
    title: notice.title,
    content: notice.content,
    createdAt: notice.created_at,
    author: { id: notice.user_id, displayName: notice.display_name, avatarColor: notice.avatar_color },
  }));

  const links = db.prepare(`
    SELECT l.*, u.display_name, u.avatar_color
    FROM links l JOIN users u ON u.id = l.user_id
    WHERE l.project_id = ?
    ORDER BY l.created_at DESC
  `).all(project.id).map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description,
    createdAt: link.created_at,
    author: { id: link.user_id, displayName: link.display_name, avatarColor: link.avatar_color },
  }));

  const activities = db.prepare(`
    SELECT a.*, u.display_name, u.avatar_color
    FROM activities a LEFT JOIN users u ON u.id = a.user_id
    WHERE a.project_id = ?
    ORDER BY a.created_at DESC LIMIT 40
  `).all(project.id).map((activity) => ({
    id: activity.id,
    kind: activity.kind,
    message: activity.message,
    createdAt: activity.created_at,
    user: activity.user_id ? {
      id: activity.user_id,
      displayName: activity.display_name || '已注销用户',
      avatarColor: activity.avatar_color || '#8E8E93',
    } : null,
  }));

  const stats = {
    totalTasks: tasks.length,
    doneTasks: tasks.filter((task) => task.status === 'done').length,
    doingTasks: tasks.filter((task) => task.status === 'doing' || task.status === 'review').length,
    todoTasks: tasks.filter((task) => task.status === 'todo').length,
    overallProgress: tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
      : 0,
  };

  return {
    project: {
      ...summary,
      isOwner: project.owner_id === user.id,
      isMember: true,
      myRole: member.role,
      myStatus: member.work_status,
      myActivity: member.activity,
    },
    members,
    tasks,
    posts,
    notices,
    links,
    activities,
    stats,
  };
}

app.get('/api/projects/:id/members/:memberId', requireAuth, loadProjectMember, (req, res) => {
  const row = db.prepare(`
    SELECT pm.*, u.username, u.display_name, u.avatar_color, u.bio
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(req.project.id, req.params.memberId);
  if (!row) return res.status(404).json({ error: '成员不存在。' });

  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE project_id = ? AND assignee_id = ?
    ORDER BY CASE status WHEN 'doing' THEN 0 WHEN 'review' THEN 1 WHEN 'todo' THEN 2 ELSE 3 END, updated_at DESC
  `).all(req.project.id, req.params.memberId).map((task) => ({
    id: task.id,
    projectId: task.project_id,
    assigneeId: task.assignee_id,
    title: task.title,
    description: task.description,
    status: task.status,
    progress: task.progress,
    priority: task.priority,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }));

  const updates = db.prepare(`
    SELECT tu.*, t.title AS task_title, u.display_name, u.avatar_color
    FROM task_updates tu
    JOIN tasks t ON t.id = tu.task_id
    JOIN users u ON u.id = tu.user_id
    WHERE tu.project_id = ? AND t.assignee_id = ?
    ORDER BY tu.created_at DESC LIMIT 30
  `).all(req.project.id, req.params.memberId).map((update) => ({
    id: update.id,
    taskId: update.task_id,
    taskTitle: update.task_title,
    content: update.content,
    status: update.status,
    progress: update.progress,
    createdAt: update.created_at,
    user: { id: update.user_id, displayName: update.display_name, avatarColor: update.avatar_color },
  }));

  const comments = db.prepare(`
    SELECT c.*, u.display_name, u.avatar_color, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.project_id = ? AND c.target_type = 'member' AND c.target_id = ?
    ORDER BY c.created_at ASC
  `).all(req.project.id, req.params.memberId).map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    user: { id: comment.user_id, username: comment.username, displayName: comment.display_name, avatarColor: comment.avatar_color },
  }));

  const done = tasks.filter((task) => task.status === 'done').length;
  const progress = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length) : 0;

  res.json({
    project: { id: req.project.id, name: req.project.name, phase: req.project.phase, status: req.project.status },
    member: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarColor: row.avatar_color,
      bio: row.bio,
      role: row.role,
      joinedAt: row.joined_at,
      workStatus: row.work_status,
      statusLabel: statusLabels[row.work_status] || statusLabels.idle,
      activity: row.activity || '',
      statusUpdatedAt: row.status_updated_at,
      taskCount: tasks.length,
      doneCount: done,
      progress,
      isSelf: row.user_id === req.user.id,
    },
    tasks,
    updates,
    comments,
  });
});

// ---------------- Project lifecycle & settings ----------------

app.post('/api/projects/:id/start', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  if (req.project.phase === 'work') return res.status(409).json({ error: '项目已经处于正式协作阶段。' });
  const time = nowIso();
  db.prepare("UPDATE projects SET phase = 'work', started_at = ?, updated_at = ? WHERE id = ?")
    .run(time, time, req.project.id);
  logActivity(req.project.id, req.user.id, 'phase', '正式协作阶段已启动');
  emitProject(req.project.id, 'phase');
  res.json({ ok: true, phase: 'work' });
});

app.post('/api/projects/:id/end', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  const time = nowIso();
  db.prepare("UPDATE projects SET status = 'ended', ended_at = ?, updated_at = ? WHERE id = ?")
    .run(time, time, req.project.id);
  logActivity(req.project.id, req.user.id, 'phase', '项目已结束并归档');
  emitProject(req.project.id, 'ended');
  res.json({ ok: true, status: 'ended' });
});

app.patch('/api/projects/:id/settings', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  const name = req.body.name === undefined ? req.project.name : cleanText(req.body.name, 60);
  const description = req.body.description === undefined ? req.project.description : cleanText(req.body.description, 400);
  const course = req.body.course === undefined ? req.project.course : cleanText(req.body.course, 40);
  const deadline = req.body.deadline === undefined ? req.project.deadline : validDate(req.body.deadline);
  const password = String(req.body.password || '');
  if (!name) return res.status(400).json({ error: '项目名称不能为空。' });
  if (req.body.password !== undefined && req.body.password !== '' && (password.length < 4 || password.length > 64)) {
    return res.status(400).json({ error: '项目密码长度需为 4–64 位。' });
  }
  const updatedAt = nowIso();
  if (req.body.password) {
    db.prepare('UPDATE projects SET name = ?, description = ?, course = ?, deadline = ?, password_hash = ?, updated_at = ? WHERE id = ?')
      .run(name, description, course, deadline, hashSecret(password), updatedAt, req.project.id);
    logActivity(req.project.id, req.user.id, 'settings', '更新了项目信息和项目密码');
  } else {
    db.prepare('UPDATE projects SET name = ?, description = ?, course = ?, deadline = ?, updated_at = ? WHERE id = ?')
      .run(name, description, course, deadline, updatedAt, req.project.id);
    logActivity(req.project.id, req.user.id, 'settings', '更新了项目信息');
  }
  emitProject(req.project.id, 'settings');
  res.json({ ok: true });
});

app.post('/api/projects/:id/rotate-link', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  const slug = crypto.randomBytes(6).toString('base64url');
  db.prepare('UPDATE projects SET join_slug = ?, updated_at = ? WHERE id = ?').run(slug, nowIso(), req.project.id);
  logActivity(req.project.id, req.user.id, 'settings', '重置了项目分享链接');
  emitProject(req.project.id, 'settings');
  res.json({ ok: true, joinSlug: slug, sharePath: `/p/${slug}` });
});

app.post('/api/projects/:id/status', requireAuth, loadProjectMember, requireActive, (req, res) => {
  const workStatus = String(req.body.workStatus || 'idle');
  const activity = cleanText(req.body.activity, 100);
  if (!allowedWorkStatuses.has(workStatus)) return res.status(400).json({ error: '无效的工作状态。' });
  const time = nowIso();
  db.prepare('UPDATE project_members SET work_status = ?, activity = ?, status_updated_at = ? WHERE project_id = ? AND user_id = ?')
    .run(workStatus, activity, time, req.project.id, req.user.id);
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(time, req.project.id);
  logActivity(req.project.id, req.user.id, 'status', `工作状态更新为「${statusLabels[workStatus]}」${activity ? ` · ${activity}` : ''}`);
  emitProject(req.project.id, 'status');
  res.json({ ok: true, workStatus, activity, statusUpdatedAt: time });
});

// ---------------- Pre-discussion posts & comments ----------------

app.post('/api/projects/:id/posts', requireAuth, loadProjectMember, requireActive, upload.single('file'), (req, res) => {
  const title = cleanText(req.body.title, 80);
  const content = cleanText(req.body.content, 4000);
  if (!title && !content && !req.file) {
    if (req.file) removeUpload(req.file.filename);
    return res.status(400).json({ error: '写一点想法，或上传一份资料再发布。' });
  }
  let fileId = null;
  if (req.file) {
    fileId = newId();
    db.prepare(`
      INSERT INTO files (id, project_id, uploader_id, original_name, stored_name, mime, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, req.project.id, req.user.id, normalizedFileName(req.file.originalname), req.file.filename,
      req.file.mimetype || 'application/octet-stream', req.file.size, nowIso());
  }
  const id = newId();
  const createdAt = nowIso();
  db.prepare('INSERT INTO posts (id, project_id, user_id, title, content, file_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.project.id, req.user.id, title, content, fileId, createdAt);
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(createdAt, req.project.id);
  logActivity(req.project.id, req.user.id, 'post', `发布了${fileId ? '资料' : '讨论'}「${title || content.slice(0, 20) || '未命名'}」`);
  emitProject(req.project.id, 'post');
  res.status(201).json({ ok: true, id });
});

app.delete('/api/projects/:id/posts/:postId', requireAuth, loadProjectMember, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND project_id = ?').get(req.params.postId, req.project.id);
  if (!post) return res.status(404).json({ error: '内容不存在。' });
  if (post.user_id !== req.user.id && req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己发布的内容。' });
  }
  if (post.file_id) {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(post.file_id);
    if (file) removeUpload(file.stored_name);
    db.prepare('DELETE FROM files WHERE id = ?').run(post.file_id);
  }
  db.prepare("DELETE FROM comments WHERE project_id = ? AND target_type = 'post' AND target_id = ?").run(req.project.id, post.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  logActivity(req.project.id, req.user.id, 'post', '删除了一条前期讨论');
  emitProject(req.project.id, 'post');
  res.json({ ok: true });
});

app.post('/api/projects/:id/posts/:postId/comments', requireAuth, loadProjectMember, requireActive, (req, res) => {
  const content = cleanText(req.body.content, 1000);
  if (!content) return res.status(400).json({ error: '评论不能为空。' });
  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND project_id = ?').get(req.params.postId, req.project.id);
  if (!post) return res.status(404).json({ error: '内容不存在。' });
  db.prepare('INSERT INTO comments (id, project_id, user_id, target_type, target_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(newId(), req.project.id, req.user.id, 'post', post.id, content, nowIso());
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(nowIso(), req.project.id);
  emitProject(req.project.id, 'comment');
  res.status(201).json({ ok: true });
});

app.post('/api/projects/:id/members/:memberId/comments', requireAuth, loadProjectMember, requireActive, (req, res) => {
  const content = cleanText(req.body.content, 1000);
  if (!content) return res.status(400).json({ error: '评论不能为空。' });
  const targetMember = db.prepare(`
    SELECT u.display_name FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(req.project.id, req.params.memberId);
  if (!targetMember) return res.status(404).json({ error: '成员不存在。' });
  db.prepare('INSERT INTO comments (id, project_id, user_id, target_type, target_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(newId(), req.project.id, req.user.id, 'member', req.params.memberId, content, nowIso());
  logActivity(req.project.id, req.user.id, 'comment', `给 ${targetMember.display_name} 的成员模块留言`);
  emitProject(req.project.id, 'comment');
  res.status(201).json({ ok: true });
});

app.delete('/api/projects/:id/comments/:commentId', requireAuth, loadProjectMember, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND project_id = ?').get(req.params.commentId, req.project.id);
  if (!comment) return res.status(404).json({ error: '评论不存在。' });
  if (comment.user_id !== req.user.id && req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己的评论。' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  emitProject(req.project.id, 'comment');
  res.json({ ok: true });
});

// ---------------- Notices & shared links ----------------

app.post('/api/projects/:id/notices', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  const title = cleanText(req.body.title, 80);
  const content = cleanText(req.body.content, 1000);
  if (!title) return res.status(400).json({ error: '请填写通知标题。' });
  db.prepare('INSERT INTO notices (id, project_id, user_id, title, content, pinned, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
    .run(newId(), req.project.id, req.user.id, title, content, nowIso());
  logActivity(req.project.id, req.user.id, 'notice', `发布了置顶通知「${title}」`);
  emitProject(req.project.id, 'notice');
  res.status(201).json({ ok: true });
});

app.delete('/api/projects/:id/notices/:noticeId', requireAuth, loadProjectMember, (req, res) => {
  const notice = db.prepare('SELECT * FROM notices WHERE id = ? AND project_id = ?').get(req.params.noticeId, req.project.id);
  if (!notice) return res.status(404).json({ error: '通知不存在。' });
  if (notice.user_id !== req.user.id && req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己发布的通知。' });
  }
  db.prepare('DELETE FROM notices WHERE id = ?').run(notice.id);
  emitProject(req.project.id, 'notice');
  res.json({ ok: true });
});

app.post('/api/projects/:id/links', requireAuth, loadProjectMember, requireActive, (req, res) => {
  const title = cleanText(req.body.title, 80);
  const url = cleanText(req.body.url, 500);
  const description = cleanText(req.body.description, 300);
  if (!title) return res.status(400).json({ error: '请填写文档名称。' });
  if (!isHttpUrl(url)) return res.status(400).json({ error: '请填写有效的 http/https 链接。' });
  db.prepare('INSERT INTO links (id, project_id, user_id, title, url, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(newId(), req.project.id, req.user.id, title, url, description, nowIso());
  logActivity(req.project.id, req.user.id, 'link', `共享了文档「${title}」`);
  emitProject(req.project.id, 'link');
  res.status(201).json({ ok: true });
});

app.delete('/api/projects/:id/links/:linkId', requireAuth, loadProjectMember, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND project_id = ?').get(req.params.linkId, req.project.id);
  if (!link) return res.status(404).json({ error: '文档链接不存在。' });
  if (link.user_id !== req.user.id && req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己共享的文档。' });
  }
  db.prepare('DELETE FROM links WHERE id = ?').run(link.id);
  emitProject(req.project.id, 'link');
  res.json({ ok: true });
});

// ---------------- Division of work & task workflow ----------------

app.post('/api/projects/:id/tasks', requireAuth, loadProjectMember, requireActive, (req, res) => {
  if (req.project.phase !== 'work') return res.status(409).json({ error: '请先开启正式协作阶段。' });
  const title = cleanText(req.body.title, 100);
  const description = cleanText(req.body.description, 1000);
  const assigneeId = String(req.body.assigneeId || '');
  const priority = allowedPriorities.has(req.body.priority) ? req.body.priority : 'medium';
  const dueDate = validDate(req.body.dueDate);
  if (!title) return res.status(400).json({ error: '请填写任务名称。' });
  const target = db.prepare(`
    SELECT u.display_name FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(req.project.id, assigneeId);
  if (!target) return res.status(400).json({ error: '请选择项目内的成员。' });
  if (req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只有项目发起者可以进行分工。' });
  }
  const id = newId();
  const time = nowIso();
  db.prepare(`
    INSERT INTO tasks (id, project_id, assignee_id, created_by, title, description, status, progress, priority, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'todo', 0, ?, ?, ?, ?)
  `).run(id, req.project.id, assigneeId, req.user.id, title, description, priority, dueDate, time, time);
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(time, req.project.id);
  logActivity(req.project.id, req.user.id, 'task', `将「${title}」分配给 ${target.display_name}`);
  emitProject(req.project.id, 'task');
  res.status(201).json({ ok: true, id });
});

app.post('/api/projects/:id/assign/random', requireAuth, loadProjectMember, requireOwner, requireActive, (req, res) => {
  if (req.project.phase !== 'work') return res.status(409).json({ error: '请先开启正式协作阶段。' });
  const rawTasks = Array.isArray(req.body.tasks) ? req.body.tasks : [];
  const titles = rawTasks
    .map((item) => typeof item === 'string' ? cleanText(item, 100) : cleanText(item?.title, 100))
    .filter(Boolean)
    .slice(0, 30);
  if (!titles.length) return res.status(400).json({ error: '请至少填写一个任务名称。' });

  const members = db.prepare(`
    SELECT pm.user_id, u.display_name FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? ORDER BY pm.joined_at ASC
  `).all(req.project.id);
  if (members.length < 1) return res.status(400).json({ error: '项目还没有成员。' });

  const shuffledMembers = [...members];
  for (let i = shuffledMembers.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [shuffledMembers[i], shuffledMembers[j]] = [shuffledMembers[j], shuffledMembers[i]];
  }
  const time = nowIso();
  const assignments = [];
  const insert = db.prepare(`
    INSERT INTO tasks (id, project_id, assignee_id, created_by, title, description, status, progress, priority, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '', 'todo', 0, 'medium', NULL, ?, ?)
  `);
  titles.forEach((title, index) => {
    const member = shuffledMembers[index % shuffledMembers.length];
    const id = newId();
    insert.run(id, req.project.id, member.user_id, req.user.id, title, time, time);
    assignments.push({ id, title, assigneeId: member.user_id, assigneeName: member.display_name });
  });
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(time, req.project.id);
  logActivity(req.project.id, req.user.id, 'task', `随机完成了 ${titles.length} 项任务分工`);
  emitProject(req.project.id, 'task');
  res.status(201).json({ ok: true, assignments });
});

app.patch('/api/projects/:id/tasks/:taskId', requireAuth, loadProjectMember, requireActive, (req, res) => {
  if (req.project.phase !== 'work') return res.status(409).json({ error: '正式协作阶段尚未开启。' });
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.project.id);
  if (!task) return res.status(404).json({ error: '任务不存在。' });
  if (task.assignee_id !== req.user.id && req.project.owner_id !== req.user.id) {
    return res.status(403).json({ error: '只有任务负责人或项目发起者可以更新该任务。' });
  }
  let status = req.body.status === undefined ? task.status : String(req.body.status);
  let progress = req.body.progress === undefined ? task.progress : Number(req.body.progress);
  const note = cleanText(req.body.note, 500);
  if (!allowedTaskStatuses.has(status)) return res.status(400).json({ error: '无效的任务状态。' });
  if (!Number.isFinite(progress)) progress = task.progress;
  progress = Math.max(0, Math.min(100, Math.round(progress)));
  if (status === 'done') progress = 100;
  else if (progress === 100) status = 'done';
  else if (status === 'done' && progress < 100) progress = 100;
  if (status === 'doing' && progress === 0 && task.status === 'todo') progress = 10;

  const time = nowIso();
  db.prepare('UPDATE tasks SET status = ?, progress = ?, updated_at = ? WHERE id = ?')
    .run(status, progress, time, task.id);
  db.prepare('INSERT INTO task_updates (id, task_id, project_id, user_id, content, status, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(newId(), task.id, req.project.id, req.user.id,
      note || `将「${task.title}」更新为${taskStatusLabels[status]} · ${progress}%`,
      status, progress, time);
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(time, req.project.id);
  logActivity(req.project.id, req.user.id, 'task', `更新了「${task.title}」的进度至 ${progress}%`);
  emitProject(req.project.id, 'task');
  res.json({ ok: true, status, progress });
});

app.delete('/api/projects/:id/tasks/:taskId', requireAuth, loadProjectMember, requireActive, requireOwner, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.project.id);
  if (!task) return res.status(404).json({ error: '任务不存在。' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  logActivity(req.project.id, req.user.id, 'task', `删除了任务「${task.title}」`);
  emitProject(req.project.id, 'task');
  res.json({ ok: true });
});

// ---------------- File delivery ----------------

const mimeByExt = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
};

app.get('/api/files/:fileId', requireAuth, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
  if (!file) return res.status(404).json({ error: '文件不存在。' });
  if (!membership(file.project_id, req.user.id)) return res.status(403).json({ error: '无权访问该文件。' });
  const full = path.join(UPLOAD_DIR, file.stored_name);
  if (path.dirname(full) !== UPLOAD_DIR || !fs.existsSync(full)) {
    return res.status(404).json({ error: '文件已丢失，请重新上传。' });
  }
  const ext = path.extname(file.stored_name).toLowerCase();
  const contentType = mimeByExt[ext] || 'application/octet-stream';
  const disposition = req.query.download === '1' ? 'attachment' : 'inline';
  const encoded = encodeURIComponent(file.original_name);
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encoded}`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  fs.createReadStream(full).pipe(res);
});

// ---------------- Server-sent events for live updates ----------------

const streams = new Map();
function emitProject(projectId, type = 'update') {
  const clients = streams.get(projectId);
  if (!clients) return;
  const payload = `event: update\ndata: ${JSON.stringify({ type, at: nowIso() })}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { clients.delete(res); }
  }
}

app.get('/api/projects/:id/events', requireAuth, loadProjectMember, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(`retry: 4000\n\n`);
  res.write(`event: ready\ndata: {"ok":true}\n\n`);
  if (!streams.has(req.project.id)) streams.set(req.project.id, new Set());
  streams.get(req.project.id).add(res);
  const heartbeat = setInterval(() => {
    try { res.write(': keep-alive\n\n'); } catch { clearInterval(heartbeat); }
  }, 25_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    const set = streams.get(req.project.id);
    if (set) {
      set.delete(res);
      if (!set.size) streams.delete(req.project.id);
    }
  });
});

// ---------------- Static app & error handling ----------------

function htmlAttribute(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function renderAppShell({ title, description, canonical, image, noindex = false }) {
  const safeTitle = htmlAttribute(title);
  const safeDescription = htmlAttribute(description);
  const safeCanonical = htmlAttribute(canonical);
  const safeImage = htmlAttribute(image);
  let html = INDEX_TEMPLATE
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${safeTitle}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${safeDescription}">`)
    .replace(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${safeTitle}">`)
    .replace(/<meta property="og:description"[^>]*>/, () => `<meta property="og:description" content="${safeDescription}">`)
    .replace(/<meta property="og:type"[^>]*>/, (tag) => `${tag}\n  <meta property="og:url" content="${safeCanonical}">\n  <link rel="canonical" href="${safeCanonical}">`)
    .replace(/<meta property="og:image"[^>]*>/, () => `<meta property="og:image" content="${safeImage}">`)
    .replace(/<meta name="twitter:title"[^>]*>/, () => `<meta name="twitter:title" content="${safeTitle}">`)
    .replace(/<meta name="twitter:description"[^>]*>/, () => `<meta name="twitter:description" content="${safeDescription}">`)
    .replace(/<meta name="twitter:image"[^>]*>/, () => `<meta name="twitter:image" content="${safeImage}">`);
  if (noindex) html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow">\n</head>');
  return html;
}

app.use(express.static(PUBLIC_DIR, {
  index: false,
  etag: true,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path === '/index.html') return res.redirect(301, '/');
  const origin = `${req.protocol}://${req.get('host')}`;
  const canonical = `${origin}${req.path}`;
  const image = `${origin}/og-image.png`;
  const defaults = {
    title: '同频 · 让小组作业像专业团队一样运转',
    description: '从资料收集、自由讨论，到正式分工、实时进度与交付。一个链接，把所有人和每一步收进同一条清晰的工作流。',
  };
  const noindex = req.path !== '/';
  let meta = { ...defaults, canonical, image, noindex };
  const gateMatch = req.path.match(/^\/p\/([A-Za-z0-9_-]+)$/);
  if (gateMatch) {
    const project = db.prepare('SELECT name, course, owner_id FROM projects WHERE join_slug = ?').get(gateMatch[1]);
    if (project) {
      const owner = db.prepare('SELECT display_name FROM users WHERE id = ?').get(project.owner_id);
      meta = {
        title: `${project.name} · 邀请你加入同频`,
        description: `${owner?.display_name || '项目发起者'} 邀请你加入「${project.name}」${project.course ? `（${project.course}）` : ''}。登录同频并输入项目密码，即可参与讨论、分工与协作。`,
        canonical,
        image,
        noindex: true,
      };
    }
  }
  if (noindex) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(renderAppShell(meta));
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在。' });
});

app.use((err, req, res, _next) => {
  console.error('[error]', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: '文件不能超过 50MB。' });
    return res.status(400).json({ error: '文件上传失败，请重试。' });
  }
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message || '请求无效。' });
  }
  res.status(500).json({ error: '服务器开小差了，请稍后再试。' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Tongpin running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});

function shutdown() {
  console.log('\nShutting down…');
  server.close(() => {
    try { db.close(); } catch { /* ignore */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

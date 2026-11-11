import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const BUCKET = String(process.env.SUPABASE_BUCKET || 'tongpin').trim() || 'tongpin';
const DB_OBJECT = 'system/tongpin.db';
const UPLOAD_PREFIX = 'uploads';

if (Boolean(SUPABASE_URL) !== Boolean(SUPABASE_KEY)) {
  throw new Error('SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 必须同时配置。');
}

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const cloudBucket = BUCKET;
export const cloudProjectUrl = SUPABASE_URL;

const headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
});

function encodeObjectPath(key) {
  return String(key)
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function objectUrl(base, key) {
  return `${SUPABASE_URL}${base}/${encodeURIComponent(BUCKET)}/${encodeObjectPath(key)}`;
}

async function checkResponse(res, message) {
  if (res.ok) return res;
  let detail = '';
  try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
  const error = new Error(`${message} (${res.status})${detail ? `: ${detail}` : ''}`);
  error.status = res.status;
  throw error;
}

async function bucketExists() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(BUCKET)}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.ok) return true;
  if (res.status === 404 || res.status === 400) return false;
  await checkResponse(res, '无法检查 Supabase 存储桶');
  return false;
}

export async function ensureCloudBucket() {
  if (!cloudEnabled) return false;
  if (await bucketExists()) return true;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: 52428800,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.ok) return true;
  if (res.status === 400 || res.status === 409) {
    const exists = await bucketExists();
    if (exists) return true;
  }
  await checkResponse(res, '无法创建 Supabase 存储桶');
  return false;
}

async function fetchObject(key) {
  const res = await fetch(objectUrl('/storage/v1/object', key), {
    headers: headers(),
    signal: AbortSignal.timeout(90_000),
  });
  if (res.ok || res.status === 404) return res;
  await checkResponse(res, '无法从 Supabase 读取对象');
  return null;
}

export async function restoreDatabaseSnapshot(destination) {
  if (!cloudEnabled) return false;
  const res = await fetchObject(DB_OBJECT);
  if (!res) return false;
  if (res.status === 404) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) return false;
  const temp = `${destination}.restore-${process.pid}.tmp`;
  fs.writeFileSync(temp, buffer);
  try {
    const probe = new DatabaseSync(temp, { readOnly: true });
    let valid = false;
    try {
      const table = probe.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
      valid = Boolean(table);
    } finally {
      probe.close();
    }
    if (!valid) throw new Error('云端数据库快照缺少有效数据表。');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.rmSync(destination, { force: true });
    fs.rmSync(`${destination}-wal`, { force: true });
    fs.rmSync(`${destination}-shm`, { force: true });
    fs.renameSync(temp, destination);
    return true;
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

export async function uploadDatabaseSnapshot(localFile) {
  if (!cloudEnabled) return false;
  const buffer = fs.readFileSync(localFile);
  const res = await fetch(objectUrl('/storage/v1/object', DB_OBJECT), {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: buffer,
    signal: AbortSignal.timeout(90_000),
  });
  await checkResponse(res, '无法把数据库同步到 Supabase');
  return true;
}

export async function uploadFileObject(storedName, localFile, mime) {
  if (!cloudEnabled) return false;
  const buffer = fs.readFileSync(localFile);
  const res = await fetch(objectUrl('/storage/v1/object', `${UPLOAD_PREFIX}/${storedName}`), {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': mime || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: buffer,
    signal: AbortSignal.timeout(120_000),
  });
  await checkResponse(res, '文件上传到云端失败');
  return true;
}

export async function fetchFileObject(storedName) {
  if (!cloudEnabled) return null;
  return fetchObject(`${UPLOAD_PREFIX}/${storedName}`);
}

export async function deleteFileObject(storedName) {
  if (!cloudEnabled) return false;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}`, {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [`${UPLOAD_PREFIX}/${storedName}`] }),
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 404) return false;
  await checkResponse(res, '无法删除云端文件');
  return true;
}

export function cloudStatus() {
  return {
    enabled: cloudEnabled,
    bucket: cloudEnabled ? BUCKET : null,
    provider: cloudEnabled ? 'supabase' : null,
  };
}

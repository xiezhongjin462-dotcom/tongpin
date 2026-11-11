/* =========================================================
   同频 Tongpin — application
   ========================================================= */
'use strict';

const appEl = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

const state = {
  user: null,
  route: null,
  dashboard: null,
  gate: null,
  project: null,
  currentProjectId: null,
  tab: 'prep',
  assignMode: 'random',
  authMode: 'login',
  authNext: '/home',
  pendingShare: null,
  confirmAction: null,
  modalOpen: false,
  modalCloseTimer: null,
  liveSource: null,
  livePoll: null,
  liveRefreshTimer: null,
  hasStaleUpdate: false,
  lastSynced: 0,
  submitting: false,
  revealObserver: null,
  returnToMember: null,
};

/* =========================================================
   Icons
   ========================================================= */
const ICONS = {
  'arrow-right': '<path d="M4.5 12h15M13 5.5 19.5 12 13 18.5"/>',
  'arrow-left': '<path d="M19.5 12h-15M11 5.5 4.5 12 11 18.5"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3L15.8 9"/>',
  'check-square': '<path d="M9 11l2.2 2.2L15.5 9"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M16 7l2 2M19 4l2 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.01a1.7 1.7 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  pin: '<path d="M12 17v5M9 10.8V4l-1.5-1h9L15 4v6.8l3 4.2H6l3-4.2Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  sparkles: '<path d="m12 3 1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 2l.7 1.8L7.5 4.5l-1.8.7L5 7l-.7-1.8L2.5 4.5l1.8-.7L5 2Z"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 7.5v.1"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.1 3.1M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.8-4M4 5v5h5M4 13a8 8 0 0 0 14.8 4M20 19v-5h-5"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  play: '<path d="m8 5 12 7-12 7V5Z"/>',
  bolt: '<path d="M13 2 4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  paperclip: '<path d="m21.4 11.6-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  'bar-chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  flag: '<path d="M4 22V4M4 4h11l-1.5 4L15 12H4"/>',
  home: '<path d="m3 10.5 9-7.5 9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-6h6v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  'more-vertical': '<circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
};

function icon(name, size = 18, stroke = 1.8, className = '') {
  const body = ICONS[name] || ICONS.circle;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function brandHTML({ light = false, href = null } = {}) {
  const target = href || (state.user ? '/home' : '/');
  return `<a href="${esc(target)}" class="brand${light ? ' brand--light' : ''}" data-nav="${esc(target)}" aria-label="同频首页">
    <span class="brand__mark"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 14.5c2.9 0 3.3-6 6.8-6s4 6 7.2 6" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="5" cy="9.5" r="1.15" fill="#fff" opacity=".55"/><circle cx="19" cy="9.5" r="1.15" fill="#fff" opacity=".55"/></svg></span>
    <span>同频</span><span class="brand__tag">TEAM OS</span>
  </a>`;
}

/* =========================================================
   Utilities
   ========================================================= */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#0A66FF';
}

function initialOf(name) {
  const chars = Array.from(String(name || '?').trim());
  return chars[0] || '?';
}

function avatarHTML(user, size = '', extraClass = '') {
  if (!user) return '';
  const name = user.displayName || user.name || '?';
  const color = safeColor(user.avatarColor);
  const sizeClass = size ? ` avatar--${size}` : '';
  return `<span class="avatar${sizeClass} ${extraClass}" style="--av:${color}" title="${esc(name)}" aria-label="${esc(name)}">${esc(initialOf(name))}</span>`;
}

function avatarStackHTML(members = [], max = 4, extra = 0) {
  const shown = members.slice(0, max);
  const rest = Math.max(0, members.length - shown.length + extra);
  return `<span class="avatar-stack">${shown.map((m) => avatarHTML(m, 'xs')).join('')}${rest ? `<span class="avatar avatar--xs avatar-stack__more">+${rest}</span>` : ''}</span>`;
}

function fmtDate(value, { year = false } = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  const options = year ? { year: 'numeric', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
}

function fmtDateFull(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function fmtTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < day * 2) return '昨天';
  if (diff < day * 7) return `${Math.floor(diff / day)} 天前`;
  return fmtDate(value);
}

function dueText(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { label: '已逾期', tone: 'red' };
  if (days === 0) return { label: '今天截止', tone: 'amber' };
  if (days === 1) return { label: '明天截止', tone: 'amber' };
  if (days <= 7) return { label: `${days} 天后截止`, tone: 'gray' };
  return { label: fmtDate(dateStr), tone: 'gray' };
}

function todayLabel() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now);
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${weekday}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}w`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

function projectColor(project) {
  const n = Number(project?.color);
  return Number.isInteger(n) && n >= 0 && n <= 4 ? n : 0;
}

function fileKind(name = '') {
  const ext = String(name).split('.').pop().toLowerCase();
  if (ext === 'pdf') return { cls: 'pdf', label: 'PDF', image: false };
  if (['doc', 'docx'].includes(ext)) return { cls: 'doc', label: 'DOC', image: false };
  if (['ppt', 'pptx'].includes(ext)) return { cls: 'ppt', label: 'PPT', image: false };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { cls: 'xls', label: ext === 'csv' ? 'CSV' : 'XLS', image: false };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return { cls: 'img', label: 'IMG', image: ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) };
  if (['zip', 'rar', '7z'].includes(ext)) return { cls: 'zip', label: 'ZIP', image: false };
  if (['txt', 'md'].includes(ext)) return { cls: 'default', label: 'TXT', image: false };
  return { cls: 'default', label: ext ? ext.slice(0, 4).toUpperCase() : 'FILE', image: false };
}

function fileIconHTML(name) {
  const kind = fileKind(name);
  return `<span class="file-ico file-ico--${kind.cls}">${kind.label}</span>`;
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return '外部链接'; }
}

function parseProjectLink(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  try {
    const url = new URL(text, location.origin);
    const match = url.pathname.match(/^\/p\/([A-Za-z0-9_-]+)/);
    if (match) return match[1];
  } catch { /* fall through */ }
  const match = text.match(/\/p\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{6,24}$/.test(text)) return text;
  return null;
}

function projectLink(project) {
  return `${location.origin}${project?.sharePath || `/p/${project?.joinSlug || ''}`}`;
}

function projectInitial(project) {
  return esc(initialOf(project?.name || '项'));
}

function phaseBadge(project) {
  if (!project) return '';
  if (project.status === 'ended') return `<span class="badge badge--gray">已归档</span>`;
  if (project.phase === 'work') return `<span class="badge badge--blue"><span class="status-dot status-dot--focus" style="width:5px;height:5px"></span>正式协作</span>`;
  return `<span class="badge badge--amber">前期准备</span>`;
}

const WORK_STATUS = {
  idle: { label: '当前空闲', dot: 'idle', online: '', tone: 'gray' },
  focus: { label: '专注工作中', dot: 'focus', online: 'is-focus', tone: 'blue' },
  research: { label: '资料调研中', dot: 'focus', online: 'is-focus', tone: 'blue' },
  review: { label: '评审中', dot: 'focus', online: 'is-focus', tone: 'violet' },
  blocked: { label: '遇到阻塞', dot: 'blocked', online: 'is-blocked', tone: 'red' },
  break: { label: '稍作休息', dot: 'break', online: 'is-break', tone: 'amber' },
};

const TASK_STATUS = {
  todo: { label: '待开始', badge: 'gray', dot: '' },
  doing: { label: '进行中', badge: 'blue', dot: 'focus' },
  review: { label: '待评审', badge: 'violet', dot: 'focus' },
  done: { label: '已完成', badge: 'green', dot: 'live' },
};

function statusDotHTML(status, extraClass = '') {
  const meta = WORK_STATUS[status] || WORK_STATUS.idle;
  const dotClass = meta.dot && meta.dot !== 'idle' ? ` status-dot--${meta.dot}` : '';
  return `<span class="status-dot${dotClass} ${extraClass}"></span>`;
}

function taskBadge(status) {
  const meta = TASK_STATUS[status] || TASK_STATUS.todo;
  return `<span class="badge badge--${meta.badge}">${meta.label}</span>`;
}

function memberRoleLabel(member) {
  return member.role === 'owner' ? '项目发起者' : '小组成员';
}

function deadlineMeta(project) {
  if (!project?.deadline) return '';
  const due = dueText(project.deadline);
  return `<span>${icon('calendar', 13)} 截止 <strong>${esc(fmtDate(project.deadline))}</strong>${due?.label === '已逾期' ? ' · 已逾期' : ''}</span>`;
}

function emptyState({ iconName = 'sparkles', title = '这里还是空的', text = '', action = '' } = {}) {
  return `<div class="empty"><div class="empty__icon">${icon(iconName, 22)}</div><strong>${esc(title)}</strong>${text ? `<p>${esc(text)}</p>` : ''}${action}</div>`;
}

function projectTopbarHTML(project) {
  return `<header class="topbar project-topbar">
    <div class="topbar__inner">
      ${brandHTML({ href: '/home' })}
      <div class="topbar__project">
        <span class="topbar__project-root">工作台</span><span class="sep">/</span>
        <strong title="${esc(project.name)}">${esc(project.name)}</strong>
      </div>
      <div class="topbar__spacer"></div>
      <div class="topbar__right">
        <button class="btn btn--sm" data-action="open-share">${icon('share', 15)}<span>分享</span></button>
        ${userButtonHTML()}
      </div>
    </div>
  </header>`;
}

function userButtonHTML() {
  const u = state.user;
  if (!u) return '';
  return `<button class="topbar__user" data-action="open-account" aria-label="打开个人账户">
    ${avatarHTML(u, 'sm')}
    <span class="topbar__user-meta"><span class="topbar__user-name">${esc(u.displayName)}</span><span class="topbar__user-sub">@${esc(u.username)}</span></span>
  </button>`;
}

function homeTopbarHTML() {
  return `<header class="topbar">
    <div class="topbar__inner">
      ${brandHTML()}
      <nav class="topbar__nav" aria-label="主导航">
        <button class="topbar__link is-active" data-nav="/home">${icon('home', 14)}工作台</button>
      </nav>
      <div class="topbar__spacer"></div>
      <div class="topbar__right">
        <button class="btn btn--sm btn--primary" data-action="open-create-project">${icon('plus', 14)}<span>新建项目</span></button>
        ${userButtonHTML()}
      </div>
    </div>
  </header>`;
}

function loadingScreen(label = '正在加载') {
  return `${homeTopbarHTML()}<div class="page"><div class="panel" style="padding:40px;display:grid;gap:16px">
    <div class="skeleton" style="height:20px;width:180px"></div>
    <div class="skeleton" style="height:200px;width:100%;border-radius:22px"></div>
    <div class="skeleton" style="height:90px;width:100%;border-radius:18px"></div>
    <p class="subtle" style="font-size:11px;text-align:center">${esc(label)}…</p>
  </div></div>`;
}

/* =========================================================
   API
   ========================================================= */
async function api(path, { method = 'GET', data, form } = {}) {
  const options = { method, credentials: 'same-origin', headers: {} };
  if (form) {
    options.body = form;
  } else if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    const error = new Error('网络连接失败，请检查网络后重试。');
    error.network = true;
    throw error;
  }
  let payload = {};
  try { payload = await response.json(); } catch { /* ignore empty */ }
  if (!response.ok) {
    const error = new Error(payload.error || `请求失败 (${response.status})`);
    error.status = response.status;
    error.code = payload.code;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function toast(message, type = 'success') {
  if (!message) return;
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : type === 'info' ? ' toast--info' : ''}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check-circle', 17)}<span>${esc(message)}</span>`;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

function formError(form, message) {
  const box = form.querySelector('.form-error');
  if (box) {
    box.innerHTML = `${icon('alert', 15)}<span>${esc(message)}</span>`;
    box.classList.add('is-visible');
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } else {
    toast(message, 'error');
  }
}

function clearFormError(form) {
  const box = form?.querySelector('.form-error');
  if (box) {
    box.classList.remove('is-visible');
    box.innerHTML = '';
  }
}

function setLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.classList.add('btn--loading');
    button.disabled = true;
  } else {
    button.classList.remove('btn--loading');
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

async function copyText(text, successMessage = '已复制') {
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    textarea.remove();
  }
  toast(copied ? successMessage : '复制失败，请手动选择文本', copied ? 'success' : 'error');
}

function formToObject(form) {
  const data = {};
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    if (typeof File !== 'undefined' && value instanceof File) continue;
    data[key] = typeof value === 'string' ? value : String(value);
  }
  return data;
}

/* =========================================================
   Modal infrastructure
   ========================================================= */
function openModal({
  title = '',
  eyebrow = '',
  subtitle = '',
  body = '',
  footer = '',
  wide = false,
  small = false,
  drawer = false,
  flush = false,
  className = '',
  hideHead = false,
  onMount = null,
} = {}) {
  if (state.modalCloseTimer) {
    clearTimeout(state.modalCloseTimer);
    state.modalCloseTimer = null;
  }
  state.modalOpen = true;
  document.body.classList.add('modal-open');
  const classes = ['modal'];
  if (wide) classes.push('modal--wide');
  if (small) classes.push('modal--sm');
  if (drawer) classes.push('modal--drawer');
  if (className) classes.push(className);
  const head = hideHead ? '' : `<div class="modal__head${flush ? ' modal__head--border' : ''}">
    <div>
      ${eyebrow ? `<div class="modal__eyebrow">${esc(eyebrow)}</div>` : ''}
      <h3 id="modal-title">${esc(title)}</h3>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
    </div>
    <button class="modal__close" type="button" data-action="close-modal" aria-label="关闭">${icon('close', 16)}</button>
  </div>`;
  modalRoot.innerHTML = `<div class="modal-backdrop${drawer ? ' modal-backdrop--drawer' : ''}" data-modal-backdrop="true">
    <section class="${classes.join(' ')}" role="dialog" aria-modal="true" ${title ? 'aria-labelledby="modal-title"' : ''}>
      ${head}
      <div class="modal__body${flush ? ' modal__body--flush' : ''}" id="modal-body">${body}</div>
      ${footer ? `<div class="modal__foot" id="modal-footer">${footer}</div>` : ''}
    </section>
  </div>`;
  const backdrop = modalRoot.querySelector('.modal-backdrop');
  requestAnimationFrame(() => {
    backdrop?.classList.add('is-open');
    const focusTarget = modalRoot.querySelector('[autofocus]') || modalRoot.querySelector('input:not([type="hidden"]), textarea, select, .modal__close');
    if (focusTarget) {
      try { focusTarget.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
  });
  if (typeof onMount === 'function') onMount(modalRoot);
}

function replaceModalBody(html, footer) {
  const body = document.getElementById('modal-body');
  if (body) body.innerHTML = html;
  if (footer !== undefined) {
    const foot = document.getElementById('modal-footer');
    if (foot) foot.innerHTML = footer;
  }
}

function closeModal() {
  if (!state.modalOpen) return;
  const backdrop = modalRoot.querySelector('.modal-backdrop');
  backdrop?.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  state.modalOpen = false;
  state.confirmAction = null;
  const shouldRefresh = state.hasStaleUpdate && state.route === 'project';
  state.modalCloseTimer = setTimeout(() => {
    modalRoot.innerHTML = '';
    state.modalCloseTimer = null;
    if (shouldRefresh && state.route === 'project' && !state.modalOpen) refreshProjectLive();
  }, 230);
}

function trapFocus(event) {
  if (event.key !== 'Tab' || !state.modalOpen) return;
  const modal = modalRoot.querySelector('.modal');
  if (!modal) return;
  const focusables = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openConfirm({ title, message, confirmLabel = '确认', danger = true, onConfirm }) {
  state.confirmAction = onConfirm;
  openModal({
    title,
    small: true,
    body: `<div style="display:flex;gap:12px;align-items:flex-start;padding:4px 0 14px">
      <div style="width:38px;height:38px;border-radius:12px;flex:none;display:grid;place-items:center;background:${danger ? 'var(--red-soft)' : 'var(--blue-soft)'};color:${danger ? 'var(--red)' : 'var(--blue)'}">${icon(danger ? 'alert' : 'info', 19)}</div>
      <div style="font-size:12px;line-height:1.7;color:var(--ink-2);padding-top:2px">${esc(message)}</div>
    </div>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-action="run-confirm">${esc(confirmLabel)}</button>`,
  });
}

function projectById(id) {
  return state.project?.project?.id === id ? state.project : null;
}

function userIsOwner() {
  return Boolean(state.project?.project?.isOwner);
}

function projectIsActive() {
  return state.project?.project?.status === 'active';
}

function memberLookup(id) {
  return state.project?.members?.find((member) => member.id === id) || null;
}

function currentMember() {
  return state.project?.members?.find((member) => member.id === state.user?.id) || null;
}

/* =========================================================
   Navigation shell
   ========================================================= */
let navigatorFn = null;
function setNavigator(fn) { navigatorFn = fn; }
async function navigate(path, options) {
  if (navigatorFn) return navigatorFn(path, options);
  location.href = path;
  return null;
}

/* =========================================================
   Page markers — implemented below
   ========================================================= */
/* =========================================================
   Landing
   ========================================================= */
function renderLanding() {
  document.title = '同频 · 让小组作业像专业团队一样运转';
  document.body.style.background = '#fbfbfd';
  appEl.innerHTML = `<div class="landing">
    <header class="landing-nav">
      <div class="landing-nav__inner">
        ${brandHTML({ href: '/' })}
        <nav class="landing-nav__links" aria-label="产品介绍">
          <a href="#workflow">工作方式</a>
          <a href="#features">功能</a>
          <a href="#security">安全与分享</a>
        </nav>
        <div class="landing-nav__actions">
          <button class="btn btn--ghost" data-nav="/login">登录</button>
          <button class="btn btn--primary" data-nav="/login?mode=register">免费开始 ${icon('arrow-right', 15)}</button>
        </div>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="hero__copy">
          <div class="hero-badge"><span class="hero-badge__dot">${icon('sparkles', 11)}</span>为真实的小组作业而生</div>
          <h1>让小组作业，<br /><span class="accent">像专业团队<br class="hero-break-mobile" />一样运转。</span></h1>
          <p class="hero__lead">从资料收集、自由讨论，到正式分工、实时进度与交付。一个链接，把散落的想法和每个人的努力，收进同一个清晰的工作流。</p>
          <div class="hero__actions">
            <button class="btn btn--primary btn--lg" data-nav="/login?mode=register">创建你的项目 ${icon('arrow-right', 17)}</button>
            <button class="btn btn--lg" data-nav="/login">已有账号，登录</button>
          </div>
          <div class="hero__note">
            ${avatarStackHTML([
              { displayName: '林澈', avatarColor: '#0A66FF' },
              { displayName: '苏雨', avatarColor: '#EE4E8B' },
              { displayName: '陈默', avatarColor: '#12B76A' },
              { displayName: '周野', avatarColor: '#7A5AF8' },
            ], 4)}
            <span><strong>无需安装</strong> · 电脑与手机都能打开</span>
          </div>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <div class="hero-window">
            <div class="hero-window__bar">
              <span class="traffic"><i></i><i></i><i></i></span>
              <span class="hero-window__url">${icon('lock', 8)} tongpin.team / 品牌焕新计划</span>
            </div>
            <div class="hero-window__body">
              <aside class="hero-mini-side">
                <span class="hero-mini-side__logo">${icon('layers', 13)}</span>
                <span class="hero-mini-nav is-active">${icon('grid', 13)}</span>
                <span class="hero-mini-nav">${icon('message', 13)}</span>
                <span class="hero-mini-nav">${icon('folder', 13)}</span>
                <span class="spacer"></span>
                <span class="avatar avatar--xs" style="--av:#F79009">周</span>
              </aside>
              <div class="hero-window__main">
                <div class="hero-mini-head">
                  <div class="hero-mini-project">
                    <span class="hero-mini-project__mark">${icon('layers', 15)}</span>
                    <div><strong>品牌焕新计划</strong><span>市场营销 · 第 3 小组</span></div>
                  </div>
                  <div class="hero-mini-actions">
                    <span class="hero-mini-pill">${icon('users', 8)} 4</span>
                    <span class="hero-mini-pill hero-mini-pill--blue">${icon('share', 8)} 分享</span>
                  </div>
                </div>
                <div class="hero-mini-stats">
                  <div class="hero-mini-stat"><span>整体进度</span><strong>68<em>%</em></strong></div>
                  <div class="hero-mini-stat"><span>进行中</span><strong>3</strong></div>
                  <div class="hero-mini-stat"><span>已完成</span><strong>5</strong></div>
                </div>
                <div class="hero-mini-sub"><span>成员工作台</span><span>实时同步中</span></div>
                <div class="hero-mini-members">
                  <div class="hero-mini-member">
                    <span class="avatar" style="--av:#0A66FF">林</span>
                    <div class="hero-mini-member__main">
                      <div class="hero-mini-member__name">林澈 <i></i><span style="font-weight:400;color:#a1a7b1">发起者</span></div>
                      <div class="hero-mini-member__task">正在整合消费者洞察报告</div>
                    </div>
                    <div class="hero-mini-progress"><span>72%</span><div class="hero-mini-progress__track"><i style="width:72%"></i></div></div>
                  </div>
                  <div class="hero-mini-member">
                    <span class="avatar" style="--av:#EE4E8B">苏</span>
                    <div class="hero-mini-member__main">
                      <div class="hero-mini-member__name">苏雨 <i style="background:#7A5AF8"></i></div>
                      <div class="hero-mini-member__task">竞品视觉分析 · 待评审</div>
                    </div>
                    <div class="hero-mini-progress"><span>90%</span><div class="hero-mini-progress__track"><i style="width:90%;background:#7A5AF8"></i></div></div>
                  </div>
                  <div class="hero-mini-member">
                    <span class="avatar" style="--av:#12B76A">陈</span>
                    <div class="hero-mini-member__main">
                      <div class="hero-mini-member__name">陈默 <i style="background:#F79009"></i></div>
                      <div class="hero-mini-member__task">方案框架搭建</div>
                    </div>
                    <div class="hero-mini-progress"><span>45%</span><div class="hero-mini-progress__track"><i style="width:45%;background:#12B76A"></i></div></div>
                  </div>
                </div>
                <div class="hero-mini-taskbar">${icon('bolt', 10)} 提交截止还有 6 天 · 本周目标：完成初稿</div>
              </div>
            </div>
          </div>
          <div class="hero-float hero-float--status">
            <span class="avatar" style="--av:#EE4E8B">苏</span>
            <div class="hero-float__copy"><strong>苏雨更新了工作进度</strong><span>竞品视觉分析 · 90%</span></div>
            <span class="hero-float__check">${icon('check', 12)}</span>
          </div>
          <div class="hero-float hero-float--live">
            <span class="status-dot status-dot--live"></span><strong>4 人正在协作</strong>
          </div>
          <div class="hero-glow"></div>
        </div>
      </section>

      <section class="landing-strip">
        <div class="landing-strip__inner">
          <span class="landing-strip__label">为这些时刻设计</span>
          <div class="landing-strip__items">
            <span class="landing-strip__item">${icon('folder', 14)}课程小组作业</span>
            <span class="landing-strip__item">${icon('users', 14)}社团项目</span>
            <span class="landing-strip__item">${icon('bar-chart', 14)}商赛与案例</span>
            <span class="landing-strip__item">${icon('sparkles', 14)}毕业设计</span>
            <span class="landing-strip__item">${icon('globe', 14)}跨设备协作</span>
          </div>
        </div>
      </section>

      <section class="marketing-section" id="workflow">
        <div class="marketing-head" data-reveal>
          <span class="eyebrow eyebrow--blue">THE WORKFLOW</span>
          <h2>把混乱的群聊，<br />变成一条清晰的工作流。</h2>
          <p>先讨论，再分工，然后让每个人都清楚自己该做什么。同频用两个阶段，陪小组从零走到交付。</p>
        </div>
        <div class="workflow">
          <article class="workflow-card" style="--glow:rgba(10,102,255,.12)" data-reveal>
            <div class="workflow-card__top"><span class="workflow-card__step">STAGE 01</span><span class="workflow-card__icon">${icon('message', 19)}</span></div>
            <h3>前期讨论与资料</h3>
            <p>像贴吧一样发布想法、上传文件，其他成员在下方评论。所有资料自然沉淀，不再被群消息淹没。</p>
            <div class="workflow-card__foot">${icon('check-circle', 13)}资料上传 · 讨论版块 · 评论区</div>
          </article>
          <article class="workflow-card" style="--glow:rgba(117,87,246,.12)" data-reveal>
            <div class="workflow-card__top"><span class="workflow-card__step">STAGE 02</span><span class="workflow-card__icon">${icon('layers', 19)}</span></div>
            <h3>启动正式协作</h3>
            <p>由发起者按下开启按钮，进入新的工作台。随机抽取或主动分配职责，任务与进度从此有迹可循。</p>
            <div class="workflow-card__foot">${icon('check-circle', 13)}一键开启 · 随机/手动分工</div>
          </article>
          <article class="workflow-card" style="--glow:rgba(15,159,110,.12)" data-reveal>
            <div class="workflow-card__top"><span class="workflow-card__step">DELIVERY</span><span class="workflow-card__icon">${icon('target', 19)}</span></div>
            <h3>实时进度与交付</h3>
            <p>每位成员拥有专属模块，工作状态、负责事项与详细进度一目了然。置顶通知和共享文档始终在视线里。</p>
            <div class="workflow-card__foot">${icon('check-circle', 13)}实时状态 · 进度留痕 · 归档复盘</div>
          </article>
        </div>
      </section>

      <section class="marketing-section" id="features">
        <div class="marketing-head" data-reveal>
          <span class="eyebrow eyebrow--blue">BUILT FOR TEAMS</span>
          <h2>该有的都有，<br />不该打扰的都没有。</h2>
          <p>没有复杂的项目管理术语，也不是另一个喧嚣的聊天软件。只保留小组作业真正需要的部分。</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card feature-card--wide" data-reveal>
            <div>
              <span class="feature-card__icon">${icon('users', 18)}</span>
              <h3>每个人，都有一个专属工作台</h3>
              <p>外显精简的工作状态、职责与完成度；点击进入，能看到详细任务、进度记录和组员留言。</p>
            </div>
            <div class="feature-card__mock" aria-hidden="true">
              <div class="mock-row"><span class="avatar" style="--av:#0A66FF">林</span><div class="mock-row__main"><b>林澈</b><span>整合消费者洞察报告</span></div><span class="mock-badge">专注中</span></div>
              <div class="mock-row"><span class="avatar" style="--av:#EE4E8B">苏</span><div class="mock-row__main"><b>苏雨</b><span>竞品视觉分析</span></div><span class="mock-badge mock-badge--blue">待评审</span></div>
              <div class="mock-row"><span class="avatar" style="--av:#12B76A">陈</span><div class="mock-row__main"><b>陈默</b><span>方案框架搭建</span></div><span class="mock-badge" style="background:var(--amber-soft);color:#a36100">进行中</span></div>
            </div>
          </article>
          <article class="feature-card" data-reveal>
            <span class="feature-card__icon">${icon('link', 18)}</span>
            <h3>项目链接 + 密码</h3>
            <p>发起者生成专属链接并设置密码，组员用链接即可加入。项目内外，边界清晰。</p>
          </article>
          <article class="feature-card" data-reveal>
            <span class="feature-card__icon">${icon('message', 18)}</span>
            <h3>像贴吧一样讨论</h3>
            <p>发布文件或想法，组员在下面评论。前期讨论在正式阶段也会完整保留。</p>
          </article>
          <article class="feature-card" data-reveal>
            <span class="feature-card__icon">${icon('upload', 18)}</span>
            <h3>文档和图片都能传</h3>
            <p>Word、PDF、PPT、Excel、照片与压缩包，单个文件最高 50MB，随项目安全存放。</p>
          </article>
          <article class="feature-card" data-reveal>
            <span class="feature-card__icon">${icon('pin', 18)}</span>
            <h3>置顶通知与共享文档</h3>
            <p>重要通知和在线文档固定在成员视线中，链接直达，不再反复翻找聊天记录。</p>
          </article>
          <article class="feature-card" data-reveal>
            <span class="feature-card__icon">${icon('activity', 18)}</span>
            <h3>进度实时同步</h3>
            <p>状态、任务和留言实时更新，谁在推进、哪里卡住，一眼就能看见。</p>
          </article>
        </div>
      </section>

      <section class="cta-band" id="security" data-reveal>
        <div>
          <h2>下一次小组作业，<br />从一条清晰的链接开始。</h2>
          <p>创建项目、设置密码、把链接发给队友。剩下的，同频来安排。</p>
        </div>
        <div class="cta-band__actions">
          <button class="btn btn--white btn--lg" data-nav="/login?mode=register">免费创建项目 ${icon('arrow-right', 16)}</button>
          <button class="btn btn--ghost btn--lg" data-nav="/login">登录工作台</button>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
      ${brandHTML({ href: '/' })}
      <span>© 2026 同频 Tongpin · 为更好的小组协作而设计</span>
      <div class="landing-footer__links"><a href="#workflow">工作方式</a><a href="#features">功能</a><a href="#security">安全</a></div>
    </footer>
  </div>`;
  initReveal();
}

function initReveal() {
  if (state.revealObserver) state.revealObserver.disconnect();
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((item) => item.classList.add('is-revealed'));
    return;
  }
  state.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        state.revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
  items.forEach((item) => state.revealObserver.observe(item));
}

/* =========================================================
   Authentication
   ========================================================= */
function renderAuthPage() {
  const isRegister = state.authMode === 'register';
  const next = state.authNext || '/home';
  const switchMode = isRegister ? 'login' : 'register';
  document.title = `${isRegister ? '创建账号' : '登录'} · 同频`;
  document.body.style.background = '#fff';
  appEl.innerHTML = `<div class="auth-page">
    <aside class="auth-aside">
      ${brandHTML({ light: true, href: '/' })}
      <div class="auth-aside__body">
        <span class="eyebrow" style="color:rgba(255,255,255,.42)">WORKFLOW, TOGETHER</span>
        <h1 style="margin-top:16px">好的协作，<br /><span>让每个人都被看见。</span></h1>
        <p class="auth-aside__lead">资料、想法、分工与进度，同频把小组作业从零散的消息，变成一条所有人都能看懂的工作流。</p>
        <div class="auth-aside__quote">
          <p>“以前要在三个群和五个文档之间来回找东西。现在打开一个链接，谁做了什么、做到哪一步，都清清楚楚。”</p>
          <div class="auth-aside__quote-by">
            <span class="avatar" style="--av:#EE4E8B">苏</span>
            <div><strong>苏雨</strong><span>市场营销 · 小组组长</span></div>
          </div>
        </div>
      </div>
      <div class="auth-aside__foot">© 2026 同频 Tongpin · Simple collaboration for real teams.</div>
    </aside>
    <main class="auth-main">
      <div class="auth-main__top">
        ${brandHTML({ href: '/' })}
        <a class="auth-main__back" href="/" data-nav="/">${icon('arrow-left', 14)} 返回首页</a>
      </div>
      <div class="auth-form-wrap">
        <div class="auth-mobile-brand" style="margin-bottom:28px">${brandHTML({ href: '/' })}</div>
        <h2>${isRegister ? '开始一次更好的协作。' : '欢迎回来。'}</h2>
        <p>${isRegister ? '创建账号，然后建立或加入你的第一个项目。' : '登录后回到你的项目、成员工作台和待办。'}</p>
        <div class="auth-tabs" role="tablist" aria-label="登录或注册">
          <button class="auth-tab${!isRegister ? ' is-active' : ''}" type="button" role="tab" aria-selected="${!isRegister}" data-action="switch-auth" data-mode="login">登录</button>
          <button class="auth-tab${isRegister ? ' is-active' : ''}" type="button" role="tab" aria-selected="${isRegister}" data-action="switch-auth" data-mode="register">创建账号</button>
        </div>
        <form class="auth-form" data-form="${isRegister ? 'register' : 'login'}" novalidate>
          <div class="form-error" role="alert"></div>
          ${isRegister ? `<div class="field">
            <label class="field__label" for="auth-name">你的昵称</label>
            <div class="input-wrap">${icon('user', 16)}<input class="input" id="auth-name" name="displayName" maxlength="24" placeholder="例如：林澈" autocomplete="nickname" required autofocus /></div>
          </div>` : ''}
          <div class="field">
            <label class="field__label" for="auth-username">用户名</label>
            <div class="input-wrap">${icon('user', 16)}<input class="input" id="auth-username" name="username" maxlength="24" placeholder="字母、数字，至少 3 位" autocomplete="username" autocapitalize="none" spellcheck="false" required ${isRegister ? '' : 'autofocus'} /></div>
          </div>
          <div class="field">
            <label class="field__label" for="auth-password">密码 <span class="field__hint">${isRegister ? '至少 6 位' : ''}</span></label>
            <div class="input-wrap">${icon('lock', 16)}<input class="input input--with-action" id="auth-password" name="password" type="password" minlength="6" maxlength="72" placeholder="${isRegister ? '设置一个密码' : '输入你的密码'}" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required />
              <button class="input-action" type="button" data-action="toggle-password" data-target="auth-password" aria-label="显示密码">${icon('eye', 16)}</button>
            </div>
          </div>
          <button class="btn btn--primary btn--full auth-submit" type="submit">${isRegister ? '创建账号并继续' : '登录'}${icon('arrow-right', 16)}</button>
          <p class="auth-terms">${isRegister ? '点击创建即表示你同意以真实、友善的方式与队友协作。' : '会话将保持 30 天，你可以在个人账户中随时退出。'}</p>
        </form>
        <div class="auth-switch">
          ${isRegister ? '已经有账号了？' : '第一次使用同频？'}
          <button type="button" data-action="switch-auth" data-mode="${switchMode}">${isRegister ? '直接登录' : '免费创建账号'}</button>
        </div>
        ${next && next !== '/home' ? `<div class="auth-page__project-chip">${icon('link', 15)}<span>登录后将返回你刚才打开的项目链接。</span></div>` : ''}
      </div>
      <div class="auth-main__foot">
        <span>${icon('shield', 12)} 密码经加密存储，仅用于登录</span>
        <span>需要帮助？联系项目发起者</span>
      </div>
    </main>
  </div>`;
}

/* =========================================================
   Dashboard
   ========================================================= */
function renderDashboard() {
  const data = state.dashboard;
  if (!data) {
    renderLoadingPage();
    return;
  }
  document.title = '工作台 · 同频';
  document.body.style.background = 'var(--bg)';
  const active = data.active || [];
  const ended = data.ended || [];
  const stats = data.stats || {};
  const tasks = data.pendingTasks || [];
  const user = state.user;
  appEl.innerHTML = `${homeTopbarHTML()}
    <main class="page">
      <section class="home-hero">
        <div class="home-hero__main">
          <div class="home-hero__date">${esc(todayLabel())}</div>
          <h1>${greeting()}，${esc(user.displayName)}<span>。</span></h1>
          <p class="home-hero__sub">${active.length ? `你有 ${active.length} 个进行中的项目，${stats.pendingCount || 0} 项任务等待推进。把今天的每一步，都留在工作流里。` : '准备好开始一次清晰、从容的小组协作了么？创建一个项目，或通过链接加入队友。'}</p>
          <div class="home-hero__actions">
            <button class="btn btn--white" data-action="open-create-project">${icon('plus', 15)} 新建项目</button>
            <button class="btn btn--glass" data-action="focus-join">${icon('link', 15)} 通过链接加入</button>
          </div>
        </div>
        <aside class="home-hero__stats" aria-label="协作概览">
          <div class="home-hero__stats-label">YOUR WORKSPACE</div>
          <div class="hero-stat-main"><strong>${stats.activeCount || 0}</strong><span>个进行中的项目<br />正在这里推进</span></div>
          <div class="hero-stat-grid">
            <div class="hero-stat-cell"><span>待推进任务</span><strong>${stats.pendingCount || 0}</strong></div>
            <div class="hero-stat-cell"><span>已完成项目</span><strong>${stats.endedCount || 0}</strong></div>
          </div>
        </aside>
      </section>

      <div class="dashboard-layout">
        <div class="dashboard-main">
          <section>
            <div class="section-head">
              <div class="section-head__left">
                <h2 class="section-title">进行中的项目</h2>
                <p>${active.length ? '继续推进，或者打开项目看看队友的进展。' : '你的项目会出现在这里。'}</p>
              </div>
              <button class="linkish" data-action="open-create-project">${icon('plus', 14)}新建项目</button>
            </div>
            <div class="project-list">
              ${active.length ? active.map((project) => projectRowHTML(project)).join('') : emptyProjectStateHTML()}
            </div>
          </section>

          <section>
            <div class="section-head">
              <div class="section-head__left">
                <h2 class="section-title">已结束的项目</h2>
                <p>归档不是终点，是下一次复盘的起点。</p>
              </div>
            </div>
            ${ended.length ? `<div class="ended-grid">${ended.map((project) => endedCardHTML(project)).join('')}</div>` : `<div class="panel" style="padding:6px">${emptyState({ iconName: 'check-circle', title: '还没有已结束的项目', text: '当一次协作完成，你可以在项目设置中结束并归档它。' })}</div>`}
          </section>
        </div>

        <aside class="dashboard-rail">
          <section class="panel">
            <div class="panel__head" style="min-height:50px;padding:12px 16px">
              <span class="panel__title">${icon('bolt', 15)} 待我推进</span>
              ${tasks.length ? `<span class="badge badge--blue">${tasks.length}</span>` : ''}
            </div>
            ${tasks.length ? `<div class="todo-list">${tasks.map((task) => pendingTaskHTML(task)).join('')}</div>` : emptyState({ iconName: 'check-circle', title: '暂时没有待办', text: '所有分配给你的任务都完成了，去帮队友看看进度吧。' })}
          </section>

          <section class="rail-panel quick-join" id="quick-join">
            <div class="rail-panel__head"><span class="rail-panel__title">${icon('link', 14)} 加入项目</span></div>
            <div class="quick-join__body">
              <p class="quick-join__copy">粘贴队友分享的项目链接，使用项目密码进入。</p>
              <form class="quick-join__form" data-form="quick-join">
                <input class="input" name="link" placeholder="粘贴项目链接…" aria-label="项目链接" autocomplete="off" />
                <button class="btn btn--primary" type="submit" aria-label="打开链接">${icon('arrow-right', 16)}</button>
              </form>
            </div>
          </section>

          <section class="rail-panel profile-mini">
            <div class="profile-mini__head">
              ${avatarHTML(user, 'lg')}
              <div style="min-width:0;flex:1">
                <div class="profile-mini__name">${esc(user.displayName)} ${icon('check-circle', 13)}</div>
                <div class="profile-mini__handle">@${esc(user.username)}</div>
              </div>
            </div>
            <p class="profile-mini__bio">${user.bio ? esc(user.bio) : '写一句自我介绍，让队友更了解你。'}</p>
            <div class="profile-mini__foot">
              <span>加入于 ${esc(fmtDate(user.createdAt, { year: true }))}</span>
              <button class="profile-mini__edit" data-action="open-account">编辑资料</button>
            </div>
          </section>
        </aside>
      </div>
    </main>`;
}

function projectRowHTML(project) {
  const members = project.members || [];
  const due = dueText(project.deadline);
  return `<button class="project-row" data-nav="/project/${esc(project.id)}" aria-label="打开项目 ${esc(project.name)}">
    <span class="project-row__mark theme-${projectColor(project)}">${projectInitial(project)}</span>
    <span class="project-row__content">
      <span class="project-row__title"><strong>${esc(project.name)}</strong>${phaseBadge(project)}</span>
      <span class="project-row__meta">
        ${project.course ? `<span>${icon('folder', 12)}${esc(project.course)}</span><span class="dot-sep"></span>` : ''}
        <span>${icon('users', 12)}${project.memberCount} 位成员</span>
        <span class="dot-sep"></span>
        <span>${icon('message', 12)}${project.commentCount} 条讨论</span>
        ${project.deadline ? `<span class="dot-sep"></span><span>${icon('calendar', 12)}${esc(due?.label || fmtDate(project.deadline))}</span>` : ''}
      </span>
    </span>
    <span class="project-row__people">${avatarStackHTML(members, 4)}</span>
    ${project.phase === 'work' && project.taskCount > 0 ? `<span class="project-row__progress">
      <span class="project-row__progress-head"><span>整体进度</span><strong>${project.progress}%</strong></span>
      <span class="progress-track"><i style="width:${project.progress}%"></i></span>
    </span>` : ''}
    <span class="project-row__arrow">${icon('arrow-right', 17)}</span>
  </button>`;
}

function endedCardHTML(project) {
  return `<button class="ended-card" data-nav="/project/${esc(project.id)}">
    <div class="ended-card__head">
      <span class="ended-card__mark theme-${projectColor(project)}" style="border-radius:10px">${projectInitial(project)}</span>
      <div style="min-width:0;flex:1"><strong>${esc(project.name)}</strong><span>${project.course ? esc(project.course) : '小组项目'} · ${project.memberCount} 人</span></div>
      ${icon('arrow-up-right', 14)}
    </div>
    <div class="ended-card__foot">
      <span>${project.endedAt ? `${esc(fmtDate(project.endedAt))} 归档` : '已归档'}</span>
      ${avatarStackHTML(project.members || [], 3)}
    </div>
  </button>`;
}

function pendingTaskHTML(task) {
  return `<button class="todo-item" data-nav="/project/${esc(task.projectId)}">
    <span class="todo-check">${icon('check', 11)}</span>
    <span class="todo-item__main">
      <span class="todo-item__title">${esc(task.title)}</span>
      <span class="todo-item__meta">
        <span class="todo-item__project"><i style="background:${['#0A66FF','#12B76A','#7A5AF8','#F79009','#EE4E8B'][Number(task.projectColor) || 0]}"></i><span>${esc(task.projectName)}</span></span>
        ${task.dueDate ? `<span>·</span><span>${esc(dueText(task.dueDate)?.label || fmtDate(task.dueDate))}</span>` : ''}
      </span>
    </span>
    <span class="todo-item__progress">${task.progress}%</span>
  </button>`;
}

function emptyProjectStateHTML() {
  return `<div class="panel" style="padding:10px">
    <div class="empty" style="padding:44px 24px">
      <div class="empty__icon" style="width:58px;height:58px;border-radius:19px;background:var(--blue-soft);color:var(--blue)">${icon('layers', 25)}</div>
      <strong style="font-size:15px">从第一个项目开始</strong>
      <p>创建项目、设置一个分享密码，然后把链接发给你的小组成员。讨论、分工和进度都会在同频里自然发生。</p>
      <div style="display:flex;gap:8px;margin-top:7px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn--primary btn--sm" data-action="open-create-project">${icon('plus', 13)} 新建项目</button>
        <button class="btn btn--sm" data-action="focus-join">${icon('link', 13)} 通过链接加入</button>
      </div>
    </div>
  </div>`;
}

function renderLoadingPage() {
  appEl.innerHTML = loadingScreen('正在整理你的工作台');
}

/* =========================================================
   Project gate (link + password)
   ========================================================= */
function renderProjectGate() {
  const gate = state.gate;
  if (!gate?.project) {
    renderErrorPage({ code: '404', title: '这个项目链接不存在', text: '链接可能已经重置，或者输入有误。请联系项目发起者获取新的链接。', action: '返回工作台' });
    return;
  }
  const project = gate.project;
  const loggedIn = Boolean(state.user);
  const currentPath = `/p/${project.joinSlug || state.gate.slug || ''}`;
  document.title = `${project.name} · 邀请你加入同频`;
  document.body.style.background = '#f5f7fa';
  const loginUrl = `/login?next=${encodeURIComponent(currentPath)}`;
  const registerUrl = `/login?mode=register&next=${encodeURIComponent(currentPath)}`;
  appEl.innerHTML = `<div class="gate-page">
    <header class="gate-nav">
      ${brandHTML({ href: state.user ? '/home' : '/' })}
      <a class="gate-nav__back" href="${state.user ? '/home' : '/'}" data-nav="${state.user ? '/home' : '/'}">${icon('arrow-left', 13)} ${state.user ? '返回工作台' : '返回首页'}</a>
    </header>
    <main class="gate-main">
      <div class="gate-card">
        <section class="gate-visual">
          <div class="gate-visual__icon">${icon('layers', 21)}</div>
          <div class="gate-visual__eyebrow">YOU'RE INVITED</div>
          <h1>${esc(project.name)}</h1>
          ${project.course ? `<span class="gate-visual__course">${icon('folder', 12)}&nbsp; ${esc(project.course)}</span>` : ''}
          <div class="gate-visual__meta">
            <div class="gate-visual__owner">
              ${avatarHTML(project.owner, 'sm')}
              <div><strong>${esc(project.owner?.displayName || '项目发起者')}</strong><span>邀请你加入这个协作空间</span></div>
            </div>
            <div class="gate-visual__stats">
              <div class="gate-visual__stat"><span>项目成员</span><strong>${project.memberCount} 人</strong></div>
              <div class="gate-visual__stat"><span>当前阶段</span><strong>${project.phase === 'work' ? '正式协作' : '前期准备'}</strong></div>
              <div class="gate-visual__stat"><span>项目状态</span><strong>${project.status === 'ended' ? '已归档' : '进行中'}</strong></div>
            </div>
          </div>
        </section>
        <section class="gate-form">
          ${!loggedIn ? `
            <div class="gate-form__lock">${icon('lock', 20)}</div>
            <h2>登录后进入项目</h2>
            <p>为了保护小组的资料与讨论，请先登录，再使用项目密码进入「${esc(project.name)}」。</p>
            <div style="display:grid;gap:9px;margin-top:22px">
              <button class="btn btn--primary btn--full" data-nav="${loginUrl}">登录已有账号 ${icon('arrow-right', 15)}</button>
              <button class="btn btn--full" data-nav="${registerUrl}">创建账号并加入</button>
            </div>
            <div class="gate-form__hint">${icon('shield', 13)}<span>这是你自己的同频账号，不是项目密码。登录后还需要输入发起者设置的项目密码。</span></div>
          ` : gate.joinClosed ? `
            <div class="gate-form__lock" style="background:var(--amber-soft);color:var(--amber)">${icon('lock', 20)}</div>
            <h2>项目已经归档</h2>
            <p>「${esc(project.name)}」的协作已经结束，当前不再接受新成员加入。</p>
            <div class="gate-closed">${icon('info', 15)}<span>如果你已经是项目成员，请从工作台打开该项目。若链接刚刚被重置，请联系项目发起者。</span></div>
            <button class="btn btn--full" style="margin-top:16px" data-nav="/home">返回我的工作台</button>
          ` : `
            <div class="gate-form__lock">${icon('key', 20)}</div>
            <h2>输入项目密码</h2>
            <p>你正在以 <strong style="color:var(--ink-2)">${esc(state.user.displayName)}</strong> 的身份加入。请向发起者获取项目密码。</p>
            <form data-form="unlock-project" data-slug="${esc(project.joinSlug || state.gate.slug || '')}" novalidate>
              <div class="form-error" role="alert"></div>
              <div class="field">
                <label class="field__label" for="project-password">项目密码</label>
                <div class="input-wrap">${icon('lock', 16)}<input class="input input--with-action" id="project-password" name="password" type="password" placeholder="输入发起者设置的密码" autocomplete="off" required autofocus />
                  <button class="input-action" type="button" data-action="toggle-password" data-target="project-password" aria-label="显示密码">${icon('eye', 16)}</button>
                </div>
              </div>
              <button class="btn btn--primary btn--full" type="submit">进入项目 ${icon('arrow-right', 16)}</button>
            </form>
            <div class="gate-form__hint">${icon('info', 13)}<span>加入后，你将看到项目的前期讨论，并能参与正式协作。项目密码由发起者设置。</span></div>
            <div class="gate-form__login">
              当前登录：<strong style="color:var(--ink-2)">@${esc(state.user.username)}</strong>
              <button class="linkish" style="margin-left:6px" data-action="logout">切换账号</button>
            </div>
          `}
        </section>
      </div>
    </main>
  </div>`;
}

/* =========================================================
   Errors
   ========================================================= */
function renderErrorPage({ code = '404', title = '页面走丢了', text = '你访问的页面不存在，或者链接已经失效。', action = '返回工作台', path = null } = {}) {
  document.title = `${title} · 同频`;
  document.body.style.background = 'var(--bg)';
  const target = path || (state.user ? '/home' : '/');
  appEl.innerHTML = `<div class="error-page">
    <div class="error-card">
      <div class="error-code">${esc(code)}</div>
      <h1>${esc(title)}</h1>
      <p>${esc(text)}</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn--primary" data-nav="${esc(target)}">${icon('arrow-left', 15)} ${esc(action)}</button>
        ${state.user ? `<button class="btn" data-action="logout">退出登录</button>` : ''}
      </div>
    </div>
  </div>`;
}

function renderNotFound() {
  renderErrorPage({ code: '404', title: '页面走丢了', text: '这个地址没有对应的页面，检查一下链接，或者回到工作台继续。' });
}

/* =========================================================
   Project loading & page shell
   ========================================================= */
async function loadProjectPage(id, { tab = null } = {}) {
  stopProjectLive();
  const previousId = state.currentProjectId;
  renderProjectSkeleton();
  try {
    const data = await api(`/api/projects/${encodeURIComponent(id)}`);
    state.currentProjectId = id;
    state.project = data;
    state.lastSynced = Date.now();
    state.hasStaleUpdate = false;
    const allowedTabs = data.project.phase === 'work' ? ['work', 'prep'] : ['prep'];
    let nextTab = tab;
    if (!nextTab) {
      if (previousId === id && allowedTabs.includes(state.tab)) nextTab = state.tab;
      else nextTab = data.project.phase === 'work' ? 'work' : 'prep';
    }
    if (!allowedTabs.includes(nextTab)) nextTab = allowedTabs[0];
    state.tab = nextTab;
    renderProjectPage();
    startProjectLive(id);
    if (state.pendingShare) {
      const pending = state.pendingShare;
      state.pendingShare = null;
      setTimeout(() => openShareModal(pending), 280);
    }
  } catch (error) {
    state.currentProjectId = null;
    state.project = null;
    if (error.status === 401) {
      await navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }
    if (error.status === 403) {
      renderErrorPage({
        code: '403',
        title: '你还不是这个项目的成员',
        text: '请通过项目发起者分享的项目链接和密码加入。加入后，这个项目的讨论和工作台就会出现在这里。',
        action: '返回工作台',
      });
      return;
    }
    renderErrorPage({
      code: error.status === 404 ? '404' : '出错了',
      title: error.status === 404 ? '项目不存在' : '暂时无法打开项目',
      text: error.message || '请稍后重试。',
      action: '返回工作台',
    });
  }
}

function renderProjectSkeleton() {
  document.body.style.background = 'var(--bg)';
  appEl.innerHTML = `<header class="topbar"><div class="topbar__inner">${brandHTML()}<div class="topbar__spacer"></div></div></header>
    <div class="project-wrap">
      <div class="skeleton" style="height:240px;border-radius:26px"></div>
      <div class="skeleton" style="height:48px;border-radius:10px;margin-top:18px"></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px">
        ${Array.from({ length: 4 }).map(() => '<div class="skeleton" style="height:95px;border-radius:16px"></div>').join('')}
      </div>
      <div class="skeleton" style="height:280px;border-radius:22px;margin-top:20px"></div>
    </div>`;
}

function renderProjectPage({ preserveScroll = false } = {}) {
  if (!state.project?.project) return;
  const project = state.project.project;
  const scrollY = preserveScroll ? window.scrollY : null;
  document.title = `${project.name} · 同频`;
  document.body.style.background = 'var(--bg)';
  const activeTab = state.tab;
  const canViewWork = project.phase === 'work';
  const postsCount = state.project.posts.length;
  appEl.innerHTML = `${projectTopbarHTML(project)}
    <div class="project-wrap project-page">
      ${projectCoverHTML()}
      <div class="project-tabs" role="tablist" aria-label="项目阶段">
        ${canViewWork ? `<button class="project-tab${activeTab === 'work' ? ' is-active' : ''}" role="tab" aria-selected="${activeTab === 'work'}" data-action="switch-project-tab" data-tab="work">${icon('grid', 15)} 工作台</button>` : `<button class="project-tab is-disabled" disabled title="开启正式协作后解锁">${icon('grid', 15)} 工作台 <span class="badge badge--gray" style="font-size:8px;min-height:18px">未开启</span></button>`}
        <button class="project-tab${activeTab === 'prep' ? ' is-active' : ''}" role="tab" aria-selected="${activeTab === 'prep'}" data-action="switch-project-tab" data-tab="prep">${icon('message', 15)} ${canViewWork ? '前期讨论' : '讨论与资料'}<span class="project-tab__count">${postsCount}</span></button>
        <span class="project-tab__spacer"></span>
        <div class="project-tab-aside">
          ${project.status === 'ended'
            ? `<span class="pill" style="min-height:25px;font-size:10px">${icon('lock', 11)} 只读归档</span>`
            : project.phase === 'work'
              ? `<span class="live-pill pill">${icon('activity', 11)} 实时同步</span>`
              : `<span class="pill" style="min-height:25px;font-size:10px">${icon('clock', 11)} 等待开启</span>`}
          <button class="project-tab-aside__refresh" data-action="refresh-project" title="刷新项目数据">${icon('refresh', 13)} 刷新</button>
        </div>
      </div>
      <div class="project-pane" id="project-pane">
        ${activeTab === 'work' ? workPaneHTML() : prepPaneHTML()}
      </div>
    </div>`;
  if (scrollY !== null) requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
}

function projectCoverHTML() {
  const data = state.project;
  const project = data.project;
  const members = data.members;
  const isOwner = project.isOwner;
  const active = project.status === 'active';
  const phase = project.phase;
  const step1Class = phase === 'prep' ? (project.status === 'ended' ? 'is-done' : 'is-current') : 'is-done';
  const step2Class = project.status === 'ended' ? 'is-done' : phase === 'work' ? 'is-current' : '';
  return `<section class="project-cover cover-theme-${projectColor(project)}">
    <div class="project-cover__top">
      <div style="min-width:0">
        <div class="project-cover__eyebrow">
          ${project.course ? `<span class="cover-chip">${icon('folder', 11)} ${esc(project.course)}</span>` : ''}
          ${project.status === 'ended'
            ? `<span class="cover-chip">${icon('lock', 11)} 已归档</span>`
            : phase === 'work'
              ? `<span class="cover-chip cover-chip--live"><span class="status-dot"></span> 正式协作中</span>`
              : `<span class="cover-chip">${icon('clock', 11)} 前期准备</span>`}
          <span class="cover-chip">${icon('users', 11)} ${members.length} 位成员</span>
        </div>
        <h1>${esc(project.name)}</h1>
        ${project.description ? `<p class="project-cover__desc">${esc(project.description)}</p>` : `<p class="project-cover__desc" style="opacity:.5">还没有项目描述${isOwner && active ? '，可以在项目设置中补充。' : '。'}</p>`}
        <div class="project-cover__meta">
          <span>${icon('calendar', 13)} ${project.deadline ? `截止 <strong>${esc(fmtDate(project.deadline))}</strong>` : '未设置截止日期'}</span>
          <span>${icon('layers', 13)} 创建于 <strong>${esc(fmtDate(project.createdAt, { year: true }))}</strong></span>
          ${project.status === 'ended' && project.endedAt ? `<span>${icon('check-circle', 13)} 结束于 <strong>${esc(fmtDate(project.endedAt))}</strong></span>` : ''}
        </div>
      </div>
      <div class="cover-actions">
        <button class="btn" data-action="open-share">${icon('share', 14)} 分享项目</button>
        ${isOwner && active ? `<button class="btn" data-action="open-settings">${icon('settings', 14)} 项目设置</button>` : ''}
        ${isOwner && active && phase === 'prep' ? `<button class="btn btn--solid" data-action="open-start">${icon('bolt', 14)} 开启正式协作</button>` : ''}
      </div>
    </div>
    <div class="project-cover__bottom">
      <div class="cover-members">
        ${avatarStackHTML(members, 5)}
        <span class="cover-members__label"><strong>${members.length}</strong> 位成员在这里协作</span>
      </div>
      <div class="phase-track" aria-label="项目阶段进度">
        <span class="phase-step ${step1Class}"><span class="phase-step__dot">${phase === 'prep' && project.status !== 'ended' ? '1' : icon('check', 9)}</span> 前期讨论</span>
        <span class="phase-line ${phase === 'work' || project.status === 'ended' ? 'is-done' : ''}"></span>
        <span class="phase-step ${step2Class}"><span class="phase-step__dot">${phase === 'work' && project.status !== 'ended' ? '2' : project.status === 'ended' ? icon('check', 9) : '2'}</span> 正式协作</span>
      </div>
    </div>
  </section>`;
}

function projectEndedBannerHTML() {
  const project = state.project.project;
  return `<div class="ended-banner">
    ${icon('lock', 17)}
    <span><strong>项目已结束并归档</strong> · ${project.endedAt ? esc(fmtDateTimeShort(project.endedAt)) : ''} 后的内容为只读状态，前期讨论与工作记录均已保留。</span>
    <button class="btn btn--sm" data-nav="/home">返回工作台</button>
  </div>`;
}

function fmtDateTimeShort(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

/* =========================================================
   Prep stage
   ========================================================= */
function prepPaneHTML() {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  return `<div class="prep-pane">
    ${project.status === 'ended' ? projectEndedBannerHTML() : ''}
    ${stageIntroHTML()}
    <div class="prep-layout">
      <div class="prep-main">
        ${active ? postComposerHTML() : ''}
        <div class="feed-head">
          <div class="feed-head__title">${icon('message', 15)} 讨论与资料 <span class="badge badge--gray">${data.posts.length}</span></div>
          <span class="subtle" style="font-size:10px">${data.posts.length ? '最新发布在前' : '从第一条开始'}</span>
        </div>
        ${data.posts.length ? `<div style="display:grid;gap:12px">${data.posts.map(postCardHTML).join('')}</div>` : discussionEmptyHTML()}
      </div>
      <aside class="prep-rail">
        ${noticesRailHTML()}
        ${linksRailHTML()}
        ${teamRailHTML()}
      </aside>
    </div>
  </div>`;
}

function stageIntroHTML() {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  const isOwner = project.isOwner;
  if (project.phase === 'work') {
    return `<section class="stage-intro">
      <div class="stage-intro__main">
        <span class="eyebrow eyebrow--blue">STAGE 01 · 前期讨论</span>
        <h2>资料与想法，都还在这里。</h2>
        <p>正式协作已经开始，但前期讨论、文件与评论会完整保留。这里是项目共同思考的起点，随时可以回来翻看。</p>
        <div class="stage-intro__checks">
          <span class="stage-intro__check">${icon('check-circle', 13)} ${data.posts.length} 条讨论与资料</span>
          <span class="stage-intro__check">${icon('check-circle', 13)} 正式阶段已保留讨论区入口</span>
        </div>
      </div>
      <div class="stage-start">
        <div class="stage-start__label"><span class="status-dot status-dot--live"></span> STAGE 02 ACTIVE</div>
        <h3>团队已进入正式协作</h3>
        <p>前往工作台查看成员分工、实时进度与任务看板。</p>
        <button class="btn btn--soft" data-action="switch-project-tab" data-tab="work">${icon('grid', 14)} 打开工作台</button>
      </div>
    </section>`;
  }
  return `<section class="stage-intro">
    <div class="stage-intro__main">
      <span class="eyebrow eyebrow--blue">STAGE 01 · 前期讨论</span>
      <h2>先收集，再一起想清楚。</h2>
      <p>把找到的资料、灵感和初步想法放在这里。小组成员可以在下方评论、补充，所有内容都会保留到正式协作阶段。</p>
      <div class="stage-intro__checks">
        <span class="stage-intro__check">${icon('check-circle', 13)} 上传文档与图片</span>
        <span class="stage-intro__check">${icon('check-circle', 13)} 像贴吧一样讨论</span>
        <span class="stage-intro__check">${icon('check-circle', 13)} 开启后仍然保留</span>
      </div>
    </div>
    <div class="stage-start">
      <div class="stage-start__label"><span class="status-dot status-dot--focus"></span> NEXT STAGE</div>
      <h3>${isOwner ? '准备好分工了吗？' : '等待正式协作开启'}</h3>
      <p>${isOwner ? '正式开启后进入成员分工、工作进度与实时状态工作台。' : '发起者开启后，你将进入新的成员工作台。'}</p>
      ${isOwner && active
        ? `<button class="btn btn--primary" data-action="open-start">${icon('bolt', 14)} 开启正式协作</button>`
        : `<div class="stage-start__wait"><span class="status-dot"></span><span>${project.status === 'ended' ? '项目已归档' : '等待发起者按下开启按钮'}</span></div>`}
    </div>
  </section>`;
}

function postComposerHTML() {
  return `<form class="composer" data-form="create-post" novalidate>
    <div class="composer__head">
      ${avatarHTML(state.user, 'sm')}
      <div class="composer__main">
        <input class="composer__title-input" name="title" maxlength="80" placeholder="给这份资料或想法起个标题（选填）" aria-label="标题" />
        <textarea class="textarea" name="content" maxlength="4000" placeholder="分享找到的资料、灵感，或对小组作业的想法…" aria-label="内容" rows="3"></textarea>
        <div class="composer__file" id="composer-file"></div>
      </div>
    </div>
    <div class="composer__toolbar">
      <label class="composer-tool" for="post-file">${icon('paperclip', 14)}<span>添加文件</span></label>
      <input type="file" id="post-file" name="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.heic,.zip,.rar,.7z" />
      <span class="subtle" style="font-size:9.5px">支持文档、图片，最大 50MB</span>
      <span class="composer__submit"><button class="btn btn--primary" type="submit">${icon('send', 13)} 发布</button></span>
    </div>
    <div class="form-error" style="margin-top:10px" role="alert"></div>
  </form>`;
}

function discussionEmptyHTML() {
  const active = state.project.project.status === 'active';
  return `<div class="feed-empty">
    <div class="empty__icon">${icon('message', 24)}</div>
    <h3>还没有人发言</h3>
    <p>${active ? '上传第一份资料，或写下你对这个项目的初步想法，让讨论从这里开始。' : '这个项目没有留下前期讨论。'}</p>
  </div>`;
}

function postCardHTML(post) {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  const canDelete = active && (post.user.id === state.user.id || project.isOwner);
  const authorIsOwner = post.user.id === project.ownerId;
  const image = post.file && fileKind(post.file.name).image;
  return `<article class="post-card" id="post-${esc(post.id)}">
    <div class="post-head">
      ${avatarHTML(post.user, 'sm')}
      <div class="post-head__main">
        <div class="post-head__line"><span class="post-head__name">${esc(post.user.displayName)}</span>${authorIsOwner ? '<span class="post-head__role">发起者</span>' : ''}</div>
        <div class="post-head__time">${esc(timeAgo(post.createdAt))} · ${esc(fmtTime(post.createdAt))}</div>
      </div>
      ${canDelete ? `<div class="post-head__actions"><button class="icon-btn icon-btn--danger" data-action="delete-post" data-id="${esc(post.id)}" title="删除这条内容" aria-label="删除">${icon('trash', 15)}</button></div>` : ''}
    </div>
    ${post.title ? `<h3 class="post-title">${esc(post.title)}</h3>` : ''}
    ${post.content ? `<div class="post-content">${esc(post.content)}</div>` : ''}
    ${post.file ? `${image ? `<div class="post-image"><img src="/api/files/${esc(post.file.id)}" alt="${esc(post.file.name)}" loading="lazy" data-action="preview-image" data-src="/api/files/${esc(post.file.id)}" /></div>` : ''}
      <div class="file-attachment">
        ${fileIconHTML(post.file.name)}
        <div class="file-meta"><span class="file-name">${esc(post.file.name)}</span><span class="file-sub">${esc(formatSize(post.file.size))} · ${esc(fileKind(post.file.name).label)}</span></div>
        <a class="file-download" href="/api/files/${esc(post.file.id)}" target="_blank" rel="noopener" title="预览">${icon('eye', 13)}<span>预览</span></a>
        <a class="file-download" href="/api/files/${esc(post.file.id)}?download=1" title="下载">${icon('download', 13)}<span>下载</span></a>
      </div>` : ''}
    <div class="post-comments">
      ${post.comments.length ? post.comments.map((comment) => postCommentHTML(comment)).join('') : `<div class="no-comments">还没有评论，来说点什么。</div>`}
      ${active ? `<form class="comment-form" data-form="post-comment" data-post-id="${esc(post.id)}" novalidate>
        ${avatarHTML(state.user, 'xs')}
        <div class="comment-input-wrap">
          <input class="comment-input" name="content" maxlength="1000" placeholder="写下你的评论…" aria-label="评论内容" autocomplete="off" required />
          <button class="comment-submit" type="submit" aria-label="发送评论">${icon('send', 12)}</button>
        </div>
      </form>` : ''}
    </div>
  </article>`;
}

function postCommentHTML(comment) {
  const active = state.project.project.status === 'active';
  const canDelete = active && (comment.user.id === state.user.id || state.project.project.isOwner);
  return `<div class="comment-row" id="comment-${esc(comment.id)}">
    ${avatarHTML(comment.user, 'xs')}
    <div class="comment-row__main">
      <div class="comment-bubble">
        <div class="comment-bubble__head"><span class="comment-bubble__name">${esc(comment.user.displayName)}</span><span class="comment-bubble__time">${esc(timeAgo(comment.createdAt))}</span></div>
        <div class="comment-bubble__content">${esc(comment.content)}</div>
      </div>
    </div>
    ${canDelete ? `<button class="comment-row__del" data-action="delete-comment" data-id="${esc(comment.id)}" title="删除评论" aria-label="删除评论">${icon('trash', 12)}</button>` : ''}
  </div>`;
}

/* =========================================================
   Prep rail: notices, links, team
   ========================================================= */
function noticesRailHTML() {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  return `<section class="rail-panel">
    <div class="rail-panel__head">
      <span class="rail-panel__title">${icon('pin', 14)} 置顶通知</span>
      ${active && project.isOwner ? `<button class="rail-panel__action" data-action="open-notice">${icon('plus', 11)} 发布</button>` : ''}
    </div>
    <div class="rail-panel__body">
      ${data.notices.length ? data.notices.map(noticeRailItemHTML).join('') : `<div class="rail-empty">${active && project.isOwner ? '还没有通知，发布一条重要信息并置顶。' : '暂时没有置顶通知。'}</div>`}
    </div>
  </section>`;
}

function noticeRailItemHTML(notice) {
  const project = state.project.project;
  const active = project.status === 'active';
  const canDelete = active && (notice.author.id === state.user.id || project.isOwner);
  return `<div class="rail-notice">
    <span class="rail-notice__pin">${icon('pin', 12)}</span>
    <div class="rail-notice__main">
      <div class="rail-notice__title">${esc(notice.title)}</div>
      ${notice.content ? `<div class="rail-notice__content">${esc(notice.content)}</div>` : ''}
      <div class="rail-notice__meta">${esc(notice.author.displayName)} · ${esc(timeAgo(notice.createdAt))}</div>
    </div>
    ${canDelete ? `<button class="rail-notice__del" data-action="delete-notice" data-id="${esc(notice.id)}" aria-label="删除通知">${icon('close', 12)}</button>` : ''}
  </div>`;
}

function linksRailHTML() {
  const data = state.project;
  const active = data.project.status === 'active';
  return `<section class="rail-panel">
    <div class="rail-panel__head">
      <span class="rail-panel__title">${icon('link', 14)} 共享文档</span>
      ${active ? `<button class="rail-panel__action" data-action="open-link">${icon('plus', 11)} 添加</button>` : ''}
    </div>
    <div class="rail-panel__body">
      ${data.links.length ? data.links.map(linkRailItemHTML).join('') : `<div class="rail-empty">${active ? '把常用文档的链接放在这里，组员随时可以打开。' : '没有共享文档。'}</div>`}
    </div>
  </section>`;
}

function linkRailItemHTML(link) {
  const project = state.project.project;
  const active = project.status === 'active';
  const canDelete = active && (link.author.id === state.user.id || project.isOwner);
  return `<div class="rail-doc">
    <span class="rail-doc__ico">${icon('file-text', 14)}</span>
    <a class="rail-doc__main" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" title="${esc(link.title)}">
      <div class="rail-doc__title">${esc(link.title)}</div>
      <div class="rail-doc__domain">${icon('globe', 9)} ${esc(domainOf(link.url))}</div>
    </a>
    ${canDelete ? `<button class="rail-doc__del" data-action="delete-link" data-id="${esc(link.id)}" aria-label="删除文档">${icon('close', 12)}</button>` : ''}
  </div>`;
}

function teamRailHTML() {
  const data = state.project;
  return `<section class="rail-panel">
    <div class="rail-panel__head">
      <span class="rail-panel__title">${icon('users', 14)} 小组成员</span>
      <span class="badge badge--gray" style="font-size:9px">${data.members.length}</span>
    </div>
    <div class="rail-panel__body rail-team">
      ${data.members.map((member) => `<div class="rail-member">
        ${avatarHTML(member, 'sm')}
        <div class="rail-member__main">
          <div class="rail-member__name">${esc(member.displayName)}${member.id === state.user.id ? '<span class="you">我</span>' : ''}${member.role === 'owner' ? `<span class="badge badge--violet" style="min-height:16px;font-size:8px;padding:0 4px">发起者</span>` : ''}</div>
          <div class="rail-member__role">${data.project.phase === 'work' ? esc(member.statusLabel) : memberRoleLabel(member)}</div>
        </div>
        ${data.project.phase === 'work' ? `<span class="rail-member__status">${statusDotHTML(member.workStatus)}</span>` : ''}
      </div>`).join('')}
    </div>
  </section>`;
}

/* =========================================================
   Work stage
   ========================================================= */
function workPaneHTML() {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  const isOwner = project.isOwner;
  const tasks = data.tasks;
  const stats = data.stats;
  const hasTasks = tasks.length > 0;
  const movingMembers = data.members.filter((m) => ['focus', 'research', 'review'].includes(m.workStatus)).length;
  const blockedMembers = data.members.filter((m) => m.workStatus === 'blocked').length;
  return `<div class="work-pane">
    ${project.status === 'ended' ? projectEndedBannerHTML() : ''}
    <div class="work-header">
      <div class="work-header__left">
        <span class="eyebrow eyebrow--blue">STAGE 02 · 正式协作</span>
        <h2>${hasTasks ? '每一步，都看得见。' : '先分工，再一起开工。'}</h2>
        <p>${hasTasks ? `${data.members.length} 位成员正在协作 · ${stats.doingTasks} 项进行中 · ${stats.doneTasks} 项已完成` : '明确每个人的职责，让工作从第一分钟开始就有迹可循。'}</p>
      </div>
      <div class="work-header__actions">
        ${active && isOwner ? `<button class="btn btn--primary" data-action="open-assign">${icon('shuffle', 14)} ${hasTasks ? '调整分工' : '成员分工'}</button>` : ''}
        ${active && isOwner ? `<button class="btn" data-action="open-notice">${icon('bell', 14)} 发布通知</button>` : ''}
        <button class="btn" data-action="refresh-project">${icon('refresh', 14)} 同步</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-card__label">${icon('users', 13)} 团队成员</div>
        <div class="stat-card__value">${data.members.length}<span>人</span></div>
        <div class="stat-card__foot">${movingMembers} 人正在推进${blockedMembers ? ` · ${blockedMembers} 人受阻` : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${icon('activity', 13)} 进行中的任务</div>
        <div class="stat-card__value">${stats.doingTasks}<span>项</span></div>
        <div class="stat-card__foot">${stats.todoTasks} 项等待开始</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${icon('check-circle', 13)} 已完成</div>
        <div class="stat-card__value">${stats.doneTasks}<span>/ ${stats.totalTasks} 项</span></div>
        <div class="stat-card__foot">${stats.totalTasks ? `${Math.round(stats.doneTasks / stats.totalTasks * 100)}% 的任务已完成` : '分工后开始记录进度'}</div>
      </div>
      <div class="stat-card stat-card--progress">
        <div class="stat-card__label">${icon('trending-up', 13)} 整体进度</div>
        <div class="stat-card__value">${stats.overallProgress}<span>%</span></div>
        <div class="stat-card__foot">${stats.overallProgress >= 100 ? '全部任务已完成，准备交付' : stats.overallProgress >= 60 ? '稳步推进中' : '刚刚开始，保持节奏'}</div>
        <span class="stat-card__spark"><span class="mini-ring" style="--v:${stats.overallProgress}"></span></span>
      </div>
    </div>

    <div class="work-blocks">
      <div class="notice-doc-grid">
        ${noticesWorkPanelHTML()}
        ${linksWorkPanelHTML()}
      </div>
    </div>

    <section class="member-section">
      <div class="section-head">
        <div class="section-head__left">
          <h2 class="section-title">成员工作台</h2>
          <p>点击成员卡片，查看详细职责、进度记录和组员留言。</p>
        </div>
        ${active && isOwner ? `<button class="linkish" data-action="open-assign">${icon('shuffle', 13)} 分工与任务</button>` : ''}
      </div>
      <div class="member-grid">
        ${data.members.map(memberCardHTML).join('')}
      </div>
    </section>

    <div class="work-lower">
      <section class="task-section" style="margin-top:0;min-width:0">
        <div class="section-head">
          <div class="section-head__left">
            <h2 class="section-title">任务看板</h2>
            <p>${hasTasks ? '点击任务查看详情，负责人可实时更新工作进度。' : '分工之后，任务会在这里按进度自动排列。'}</p>
          </div>
          <div class="task-toolbar">
            <span class="badge badge--gray">${stats.totalTasks} 项任务</span>
            ${active && isOwner ? `<button class="btn btn--sm" data-action="open-assign" data-mode="manual">${icon('plus', 12)} 添加任务</button>` : ''}
          </div>
        </div>
        ${hasTasks ? kanbanHTML() : kanbanEmptyHTML()}
      </section>
      <aside class="activity-panel">
        <div class="rail-panel__head">
          <span class="rail-panel__title">${icon('activity', 14)} 实时动态</span>
          <span class="live-pill pill" style="min-height:21px;font-size:9px">${icon('activity', 9)} LIVE</span>
        </div>
        <div class="activity-list">
          ${data.activities.length ? data.activities.map(activityItemHTML).join('') : '<div class="activity-empty">还没有动态。开始分工或更新进度后，这里会记录每一步。</div>'}
        </div>
      </aside>
    </div>
  </div>`;
}

function memberCardHTML(member) {
  const meta = WORK_STATUS[member.workStatus] || WORK_STATUS.idle;
  const isSelf = member.id === state.user.id;
  const taskTitles = member.taskTitles || [];
  const extraTasks = Math.max(0, member.taskCount - taskTitles.length);
  return `<button class="member-card${isSelf ? ' member-card--self' : ''}" data-action="open-member" data-id="${esc(member.id)}" aria-label="打开 ${esc(member.displayName)} 的成员工作台">
    <div class="member-card__top">
      <span class="member-card__avatar">
        ${avatarHTML(member, 'sm')}
        <span class="member-card__online ${meta.online || ''}"></span>
      </span>
      <span class="member-card__name">
        <strong>${esc(member.displayName)}${isSelf ? '<span class="you">我</span>' : ''}${member.role === 'owner' ? `<span class="badge badge--violet" style="min-height:16px;font-size:8px;padding:0 4px;margin-left:2px">发起者</span>` : ''}</strong>
        <span class="member-card__role">${member.role === 'owner' ? '负责项目推进' : '小组成员'}</span>
      </span>
      <span class="member-card__arrow">${icon('chevron-right', 15)}</span>
    </div>
    <div class="member-card__status">
      ${statusDotHTML(member.workStatus)}
      <span class="member-card__status-main">
        <span class="member-card__status-label">${esc(meta.label)}</span>
        <span class="member-card__activity">${esc(member.activity || (member.statusUpdatedAt ? '状态刚刚更新' : '还没有更新当前状态'))}</span>
      </span>
    </div>
    <div class="member-card__resp">
      <div class="member-card__resp-label">负责事项</div>
      ${taskTitles.length ? `<div class="member-card__tasks">${taskTitles.map((title) => `<span class="resp-chip">${esc(title)}</span>`).join('')}${extraTasks ? `<span class="resp-chip resp-chip--more">+${extraTasks}</span>` : ''}</div>` : `<div class="member-card__resp-empty">${state.project.project.isOwner && state.project.project.status === 'active' ? '还没有分配任务，点击“成员分工”开始。' : '暂时没有分配任务。'}</div>`}
    </div>
    <div class="member-card__bottom">
      <div class="member-card__figures">
        <span class="member-figure">${icon('check-square', 12)}<strong>${member.doneCount}</strong>/${member.taskCount} 任务</span>
        <span class="member-figure">${icon('message', 12)}<strong>${member.commentCount}</strong></span>
      </div>
      <div class="member-progress">
        <span class="member-progress__ring" style="--v:${member.progress};--ring:${safeColor(member.avatarColor)}"></span>
        <span>${member.progress}%</span>
      </div>
    </div>
  </button>`;
}

function noticesWorkPanelHTML() {
  const data = state.project;
  const project = data.project;
  const active = project.status === 'active';
  return `<section class="rail-panel notice-panel">
    <div class="rail-panel__head">
      <span class="rail-panel__title">${icon('pin', 14)} 置顶通知</span>
      ${active && project.isOwner ? `<button class="rail-panel__action" data-action="open-notice">${icon('plus', 11)} 发布通知</button>` : `<span class="badge badge--gray" style="font-size:8.5px">${data.notices.length}</span>`}
    </div>
    ${data.notices.length ? `<div class="notice-list">${data.notices.map(noticeWorkItemHTML).join('')}</div>` : `<div class="rail-empty" style="padding:28px 18px">${active && project.isOwner ? '置顶一条重要通知，让所有成员第一时间看到。' : '暂时没有置顶通知。'}</div>`}
  </section>`;
}

function noticeWorkItemHTML(notice) {
  const project = state.project.project;
  const active = project.status === 'active';
  const canDelete = active && (notice.author.id === state.user.id || project.isOwner);
  return `<div class="notice-item">
    <span class="notice-item__pin">${icon('pin', 14)}</span>
    <div class="notice-item__main">
      <div class="notice-item__title">${esc(notice.title)}</div>
      ${notice.content ? `<div class="notice-item__content">${esc(notice.content)}</div>` : ''}
      <div class="notice-item__meta">${esc(notice.author.displayName)} · ${esc(fmtTime(notice.createdAt))}</div>
    </div>
    ${canDelete ? `<button class="notice-item__del" data-action="delete-notice" data-id="${esc(notice.id)}" aria-label="删除通知">${icon('close', 13)}</button>` : ''}
  </div>`;
}

function linksWorkPanelHTML() {
  const data = state.project;
  const active = data.project.status === 'active';
  return `<section class="rail-panel notice-panel">
    <div class="rail-panel__head">
      <span class="rail-panel__title">${icon('link', 14)} 置顶共享文档</span>
      ${active ? `<button class="rail-panel__action" data-action="open-link">${icon('plus', 11)} 添加链接</button>` : `<span class="badge badge--gray" style="font-size:8.5px">${data.links.length}</span>`}
    </div>
    ${data.links.length ? `<div class="doc-grid">${data.links.map(linkTileHTML).join('')}</div>` : `<div class="rail-empty" style="padding:24px 18px">${active ? '把在线文档、云盘或参考资料链接固定在这里。' : '没有共享文档。'}</div>`}
  </section>`;
}

function linkTileHTML(link) {
  const project = state.project.project;
  const active = project.status === 'active';
  const canDelete = active && (link.author.id === state.user.id || project.isOwner);
  return `<div class="doc-tile">
    <a class="doc-tile__link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" title="${esc(link.description || link.title)}">
      <span class="doc-tile__ico">${icon('file-text', 14)}</span>
      <span class="doc-tile__main">
        <span class="doc-tile__title">${esc(link.title)}</span>
        <span class="doc-tile__domain">${esc(domainOf(link.url))}</span>
      </span>
    </a>
    ${canDelete ? `<button class="doc-tile__del" data-action="delete-link" data-id="${esc(link.id)}" aria-label="删除文档">${icon('close', 10)}</button>` : ''}
  </div>`;
}

function kanbanHTML() {
  const sortedTasks = state.project.tasks;
  const columns = [
    { key: 'todo', label: '待开始' },
    { key: 'doing', label: '进行中' },
    { key: 'review', label: '待评审' },
    { key: 'done', label: '已完成' },
  ];
  return `<div class="kanban">
    ${columns.map((column) => {
      const items = sortedTasks.filter((task) => task.status === column.key);
      return `<div class="kanban-col kanban-col--${column.key}">
        <div class="kanban-col__head"><span class="kanban-col__dot"></span>${column.label}<span class="kanban-col__count">${items.length}</span></div>
        <div class="kanban-col__body">
          ${items.length ? items.map(taskCardHTML).join('') : `<div class="kanban-empty">${icon(column.key === 'done' ? 'check-circle' : 'circle', 16)}${column.key === 'done' ? '完成的任务会出现在这里' : '暂无任务'}</div>`}
          ${state.project.project.isOwner && state.project.project.status === 'active' && column.key === 'todo' ? `<button class="kanban-add" data-action="open-assign" data-mode="manual">${icon('plus', 11)} 添加任务</button>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function taskCardHTML(task) {
  const assignee = task.assignee || memberLookup(task.assigneeId) || {};
  const due = dueText(task.dueDate);
  return `<button class="task-card${task.status === 'done' ? ' task-card--done' : ''}" data-action="open-task" data-id="${esc(task.id)}">
    <span class="task-card__top">
      <span class="task-card__flag${task.priority === 'high' ? ' task-card__flag--high' : task.priority === 'low' ? ' task-card__flag--low' : ''}"></span>
      <span class="task-card__title">${esc(task.title)}</span>
    </span>
    <span class="task-card__meta">
      ${avatarHTML(assignee, 'xxs')}
      <span class="task-card__meta-name">${esc(assignee.displayName || '未分配')}</span>
      ${due ? `<span class="task-card__due">${icon('calendar', 8)} ${esc(due.label)}</span>` : ''}
    </span>
    <span class="task-card__progress">
      <span class="progress-track"><i style="width:${task.progress}%;${task.status === 'done' ? 'background:var(--green)' : ''}"></i></span>
      <span>${task.progress}%</span>
    </span>
  </button>`;
}

function kanbanEmptyHTML() {
  const isOwner = state.project.project.isOwner;
  const active = state.project.project.status === 'active';
  return `<div class="panel" style="padding:34px 24px">
    <div class="empty" style="padding:0">
      <div class="empty__icon" style="background:var(--blue-soft);color:var(--blue);width:54px;height:54px;border-radius:18px">${icon('shuffle', 24)}</div>
      <strong style="font-size:14px">先把工作分到每个人手上</strong>
      <p>发起者可以选择随机抽取任务，或主动将职责分配给指定成员。分配完成后，这里会自动生成任务看板。</p>
      ${active && isOwner ? `<button class="btn btn--primary btn--sm" style="margin-top:6px" data-action="open-assign">${icon('shuffle', 13)} 开始分工</button>` : ''}
    </div>
  </div>`;
}

function activityItemHTML(activity) {
  return `<div class="activity-item">
    ${activity.user ? avatarHTML(activity.user, 'xs') : `<span class="avatar avatar--xs" style="--av:#8A909C">·</span>`}
    <div class="activity-item__main">${activity.user ? `<strong>${esc(activity.user.displayName)}</strong> ` : ''}${esc(activity.message)}<span class="activity-item__time">${esc(timeAgo(activity.createdAt))}</span></div>
  </div>`;
}

/* =========================================================
   Live updates
   ========================================================= */
function isTypingInPage() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function startProjectLive(projectId) {
  stopProjectLive();
  if (typeof EventSource !== 'undefined') {
    try {
      state.liveSource = new EventSource(`/api/projects/${encodeURIComponent(projectId)}/events`);
      state.liveSource.addEventListener('ready', () => {
        state.lastSynced = Date.now();
      });
      state.liveSource.addEventListener('update', () => {
        state.hasStaleUpdate = true;
        scheduleLiveRefresh();
      });
      state.liveSource.onerror = () => {
        // EventSource reconnects automatically. Polling below is the safety net.
      };
    } catch {
      state.liveSource = null;
    }
  }
  state.livePoll = setInterval(() => {
    if (document.visibilityState !== 'visible' || state.modalOpen || isTypingInPage()) return;
    if (state.currentProjectId === projectId) refreshProjectLive();
  }, 30_000);
}

function stopProjectLive() {
  if (state.liveSource) {
    try { state.liveSource.close(); } catch { /* ignore */ }
    state.liveSource = null;
  }
  if (state.livePoll) {
    clearInterval(state.livePoll);
    state.livePoll = null;
  }
  if (state.liveRefreshTimer) {
    clearTimeout(state.liveRefreshTimer);
    state.liveRefreshTimer = null;
  }
  state.hasStaleUpdate = false;
}

function scheduleLiveRefresh() {
  if (state.modalOpen || isTypingInPage()) return;
  if (state.liveRefreshTimer) clearTimeout(state.liveRefreshTimer);
  state.liveRefreshTimer = setTimeout(() => {
    state.liveRefreshTimer = null;
    refreshProjectLive();
  }, 900);
}

async function refreshProjectLive() {
  const id = state.currentProjectId;
  if (!id || state.modalOpen || isTypingInPage()) {
    state.hasStaleUpdate = true;
    return;
  }
  try {
    const data = await api(`/api/projects/${encodeURIComponent(id)}`);
    if (state.currentProjectId !== id || state.route !== 'project') return;
    state.project = data;
    state.lastSynced = Date.now();
    state.hasStaleUpdate = false;
    if (state.tab === 'work' && data.project.phase !== 'work') state.tab = 'prep';
    renderProjectPage({ preserveScroll: true });
  } catch {
    // Silent: live updates should never interrupt the current task.
  }
}

async function forceRefreshProject({ rerender = true } = {}) {
  const id = state.currentProjectId;
  if (!id) return;
  const data = await api(`/api/projects/${encodeURIComponent(id)}`);
  if (state.currentProjectId !== id) return;
  state.project = data;
  state.lastSynced = Date.now();
  state.hasStaleUpdate = false;
  if (state.tab === 'work' && data.project.phase !== 'work') state.tab = 'prep';
  if (rerender) renderProjectPage({ preserveScroll: true });
}


/* =========================================================
   Modals
   ========================================================= */
function openCreateProjectModal() {
  openModal({
    title: '新建项目',
    eyebrow: 'NEW PROJECT',
    subtitle: '先给这次小组作业一个清晰的名字，并设置加入项目的密码。',
    wide: true,
    body: `<form class="modal-form" id="create-project-form" data-form="create-project" novalidate>
      <div class="form-error" role="alert"></div>
      <div class="field">
        <label class="field__label" for="project-name">项目名称</label>
        <input class="input" id="project-name" name="name" maxlength="60" placeholder="例如：品牌焕新计划 · 第 3 组" required autofocus />
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field__label" for="project-course">课程 / 场景 <span class="field__hint">选填</span></label>
          <input class="input" id="project-course" name="course" maxlength="40" placeholder="例如：市场营销" />
        </div>
        <div class="field">
          <label class="field__label" for="project-deadline">截止日期 <span class="field__hint">选填</span></label>
          <input class="input" id="project-deadline" name="deadline" type="date" />
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="project-password-create">项目密码</label>
        <div class="input-wrap">${icon('key', 16)}<input class="input input--with-action" id="project-password-create" name="password" type="password" minlength="4" maxlength="64" placeholder="4–64 位，组员凭此密码加入" autocomplete="new-password" required />
          <button class="input-action" type="button" data-action="toggle-password" data-target="project-password-create" aria-label="显示密码">${icon('eye', 16)}</button>
        </div>
        <span class="field__hint" style="margin-top:0">创建后会生成专属链接。请把「链接 + 密码」一起发给组员。</span>
      </div>
      <div class="field">
        <label class="field__label" for="project-desc">项目描述 <span class="field__hint">选填</span></label>
        <textarea class="textarea" id="project-desc" name="description" maxlength="400" rows="3" placeholder="简单说明这次小组作业的目标或背景…"></textarea>
      </div>
    </form>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="submit" form="create-project-form">${icon('plus', 14)} 创建项目</button>`,
  });
}

function openShareModal(secret = null) {
  const data = state.project;
  if (!data?.project) return;
  const project = data.project;
  const link = projectLink(project);
  const knownPassword = typeof secret === 'object' && secret ? secret.password : (typeof secret === 'string' ? secret : '');
  const inviteText = `加入我的同频小组项目「${project.name}」\n项目链接：${link}${knownPassword ? `\n项目密码：${knownPassword}` : ''}\n打开链接，先登录同频，再输入项目密码即可加入。`;
  openModal({
    title: knownPassword ? '项目已创建' : '分享项目',
    eyebrow: knownPassword ? 'READY TO INVITE' : 'INVITE YOUR TEAM',
    subtitle: knownPassword ? '接下来，把链接和密码发给你的小组成员。' : '任何拥有链接和项目密码的人，都可以加入这个项目。',
    body: `<div class="share-card">
      <div class="share-card__label">PROJECT INVITATION</div>
      <div class="share-card__title">${esc(project.name)}</div>
      <div class="share-card__sub">${project.course ? `${esc(project.course)} · ` : ''}${data.members.length} 位成员 · ${project.phase === 'work' ? '正式协作' : '前期准备'}</div>
      <div class="share-link-row">
        <input class="input code-text" id="share-link-input" value="${esc(link)}" readonly aria-label="项目链接" />
        <button class="btn btn--primary" data-action="copy-text" data-copy="${esc(encodeURIComponent(link))}" data-copied="项目链接已复制">${icon('copy', 13)} 复制链接</button>
      </div>
      ${knownPassword ? `<div class="share-password-note" style="color:#42648f">${icon('key', 12)}<span>项目密码：<strong class="code-text" style="color:#234d87;font-size:11px">${esc(knownPassword)}</strong> · 请通过私聊发送，不要发在公开群里。</span></div>` : `<div class="share-password-note">${icon('shield', 12)}<span>项目密码由你在创建时设置，服务端只保存加密结果、无法查看。如果忘记，可以在项目设置中重设。</span></div>`}
    </div>
    <div class="share-steps">
      <div class="share-step"><span class="share-step__num">1</span><span>把项目链接和项目密码一起发给小组成员。</span></div>
      <div class="share-step"><span class="share-step__num">2</span><span>组员打开链接，登录或注册同频账号。</span></div>
      <div class="share-step"><span class="share-step__num">3</span><span>输入项目密码，即可进入讨论区与成员工作台。</span></div>
    </div>
    ${project.isOwner && project.status === 'active' ? `<div class="settings-section" style="padding-bottom:0">
      <div class="settings-section__desc" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:0">
        <span>需要更换密码或分享链接？</span>
        <button class="linkish" data-action="open-settings">前往项目设置 ${icon('arrow-right', 12)}</button>
      </div>
    </div>` : ''}`,
    footer: `<button class="btn" data-action="close-modal">完成</button>
      <button class="btn btn--primary" data-action="copy-text" data-copy="${esc(encodeURIComponent(inviteText))}" data-copied="邀请文案已复制">${icon('share', 14)} 复制邀请文案</button>`,
  });
}

function openSettingsModal() {
  const data = state.project;
  if (!data?.project) return;
  const project = data.project;
  if (!project.isOwner) {
    toast('只有项目发起者可以修改设置。', 'info');
    return;
  }
  const link = projectLink(project);
  openModal({
    title: '项目设置',
    eyebrow: 'PROJECT SETTINGS',
    subtitle: '管理项目信息、分享链接与项目状态。',
    wide: true,
    body: `<form class="modal-form" id="project-settings-form" data-form="update-project-settings" novalidate>
      <div class="form-error" role="alert"></div>
      <div class="field">
        <label class="field__label" for="settings-name">项目名称</label>
        <input class="input" id="settings-name" name="name" maxlength="60" value="${esc(project.name)}" required />
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field__label" for="settings-course">课程 / 场景</label>
          <input class="input" id="settings-course" name="course" maxlength="40" value="${esc(project.course || '')}" />
        </div>
        <div class="field">
          <label class="field__label" for="settings-deadline">截止日期</label>
          <input class="input" id="settings-deadline" name="deadline" type="date" value="${esc(project.deadline || '')}" />
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="settings-desc">项目描述</label>
        <textarea class="textarea" id="settings-desc" name="description" maxlength="400" rows="3">${esc(project.description || '')}</textarea>
      </div>
      <div class="field">
        <label class="field__label" for="settings-password">修改项目密码 <span class="field__hint">留空则不修改</span></label>
        <input class="input" id="settings-password" name="password" type="password" minlength="4" maxlength="64" placeholder="输入新的项目密码（选填）" autocomplete="new-password" />
      </div>
    </form>
    <div class="settings-section">
      <div class="settings-section__title">项目分享链接</div>
      <div class="copy-field"><span class="code-text">${esc(link)}</span><button data-action="copy-text" data-copy="${esc(encodeURIComponent(link))}" data-copied="项目链接已复制">${icon('copy', 11)} 复制</button></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:9px">
        <span class="settings-section__desc" style="margin:0">重置后旧链接立即失效，需要重新分享。</span>
        <button class="btn btn--sm" data-action="rotate-link">${icon('refresh', 12)} 重置链接</button>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section__title">协作状态</div>
      <div class="danger-row">
        <div class="danger-row__main"><strong>结束并归档项目</strong><span>结束后项目变为只读，成员仍可回看资料和进度，但不能继续编辑或加入。</span></div>
        <button class="btn btn--sm btn--danger-soft" data-action="end-project">结束项目</button>
      </div>
    </div>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="submit" form="project-settings-form">保存设置</button>`,
  });
}

function openStartModal() {
  const data = state.project;
  if (!data?.project) return;
  if (!data.project.isOwner) {
    toast('只有项目发起者可以开启正式协作。', 'info');
    return;
  }
  if (data.project.phase === 'work') {
    toast('正式协作已经开启。', 'info');
    return;
  }
  openModal({
    title: '开启正式协作',
    eyebrow: 'STAGE TRANSITION',
    subtitle: '这是项目从讨论走向执行的时刻。',
    body: `<div class="share-card" style="background:linear-gradient(130deg,#f8faff,#eef5ff);margin-bottom:16px">
      <div class="share-card__label">WHAT HAPPENS NEXT</div>
      <div class="share-card__title" style="font-size:18px">从「讨论」进入「工作台」</div>
      <div class="share-card__sub" style="font-size:11px;line-height:1.7;margin-top:7px">正式协作开启后，项目会新增成员分工、任务看板、实时工作状态与成员专属工作台。前期讨论与文件会完整保留。</div>
    </div>
    <div class="share-steps" style="margin:0">
      <div class="share-step"><span class="share-step__num">${icon('shuffle', 9)}</span><span><strong style="color:var(--ink)">成员分工</strong>：随机抽取任务，或主动分配给指定成员。</span></div>
      <div class="share-step"><span class="share-step__num">${icon('activity', 9)}</span><span><strong style="color:var(--ink)">实时进度</strong>：每个人更新状态、进度和职责，团队随时可见。</span></div>
      <div class="share-step"><span class="share-step__num">${icon('message', 9)}</span><span><strong style="color:var(--ink)">成员模块</strong>：每位成员拥有专属页面，组员可以留言协作。</span></div>
      <div class="share-step"><span class="share-step__num">${icon('check', 9)}</span><span><strong style="color:var(--ink)">保留讨论</strong>：前期资料和评论区不会消失，仍可随时回看。</span></div>
    </div>
    <div class="assign-info" style="margin-top:16px">${icon('alert', 14)}<span>正式协作开启后，项目阶段不能退回。请确认小组已经完成讨论，并准备好开始分工。</span></div>
    <form id="start-project-form" data-form="start-project" novalidate></form>`,
    footer: `<button class="btn" data-action="close-modal">再准备一下</button>
      <button class="btn btn--primary" type="submit" form="start-project-form">${icon('bolt', 14)} 开启正式协作</button>`,
  });
}

function openAssignModal(mode = null) {
  const data = state.project;
  if (!data?.project) return;
  if (!data.project.isOwner) {
    toast('只有项目发起者可以进行分工。', 'info');
    return;
  }
  if (!projectIsActive()) {
    toast('项目已结束，无法继续分工。', 'info');
    return;
  }
  state.assignMode = mode === 'manual' ? 'manual' : mode === 'random' ? 'random' : state.assignMode || 'random';
  const currentMode = state.assignMode;
  const members = data.members;
  const suggestions = ['选题与框架', '资料收集', '数据分析', '视觉设计', '文档整合', '汇报演练'];
  const randomBody = `<form class="modal-form" id="random-assign-form" data-form="random-assign" novalidate>
    <div class="form-error" role="alert"></div>
    <div class="assign-info">
      ${icon('shuffle', 15)}
      <span>系统会把任务尽可能均匀地随机分配给 ${members.length} 位成员，避免有人负担过重。</span>
      <span class="assign-preview-people">${members.slice(0, 5).map((m) => avatarHTML(m, 'xxs')).join('')}</span>
    </div>
    <div class="field">
      <label class="field__label" for="assign-titles">任务清单 <span class="field__hint">每行一个任务</span></label>
      <textarea class="textarea" id="assign-titles" name="taskTitles" rows="6" placeholder="例如：&#10;收集消费者洞察资料&#10;竞品视觉分析&#10;搭建方案框架" required autofocus></textarea>
      <div class="suggest-chips">${suggestions.map((s) => `<button class="suggest-chip" type="button" data-action="add-suggestion" data-title="${esc(s)}">${esc(s)} +</button>`).join('')}</div>
    </div>
    <p class="modal-sub">任务将在随机抽签后立刻出现在任务看板上，且不会重复分配给同一成员，直到所有成员都被分配过一轮。</p>
  </form>`;
  const manualBody = `<form class="modal-form" id="manual-task-form" data-form="create-task" novalidate>
    <div class="form-error" role="alert"></div>
    <div class="assign-info">${icon('user', 14)}<span>把一项具体职责直接分配给成员。对方可以在自己的成员工作台更新进度。</span></div>
    <div class="field">
      <label class="field__label" for="task-title">任务名称</label>
      <input class="input" id="task-title" name="title" maxlength="100" placeholder="例如：整合消费者洞察报告" required autofocus />
    </div>
    <div class="field">
      <label class="field__label" for="task-assignee">负责人</label>
      <select class="select" id="task-assignee" name="assigneeId" required>
        ${members.map((m) => `<option value="${esc(m.id)}"${m.id === state.user.id ? ' selected' : ''}>${esc(m.displayName)}${m.role === 'owner' ? '（发起者）' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="field">
        <label class="field__label" for="task-due">截止日期</label>
        <input class="input" id="task-due" name="dueDate" type="date" />
      </div>
      <div class="field">
        <label class="field__label" for="task-priority">优先级</label>
        <select class="select" id="task-priority" name="priority">
          <option value="medium" selected>普通</option>
          <option value="high">重要</option>
          <option value="low">较低</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label class="field__label" for="task-desc">职责说明 <span class="field__hint">选填</span></label>
      <textarea class="textarea" id="task-desc" name="description" maxlength="1000" rows="3" placeholder="需要交付什么、有什么要求…"></textarea>
    </div>
  </form>`;
  openModal({
    title: '成员分工',
    eyebrow: 'DIVISION OF WORK',
    subtitle: '随机抽取带来一点惊喜，主动分配更贴近每个人的擅长。',
    wide: true,
    body: `<div class="assign-tabs">
      <div class="segmented" role="tablist" aria-label="分工方式">
        <button type="button" class="${currentMode === 'random' ? 'is-active' : ''}" data-action="open-assign" data-mode="random">${icon('shuffle', 13)} 随机抽取</button>
        <button type="button" class="${currentMode === 'manual' ? 'is-active' : ''}" data-action="open-assign" data-mode="manual">${icon('user', 13)} 主动分配</button>
      </div>
    </div>
    ${currentMode === 'random' ? randomBody : manualBody}`,
    footer: currentMode === 'random'
      ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn--primary" type="submit" form="random-assign-form">${icon('shuffle', 14)} 随机抽取并分配</button>`
      : `<button class="btn" data-action="close-modal">取消</button><button class="btn btn--primary" type="submit" form="manual-task-form">${icon('plus', 14)} 添加任务</button>`,
  });
}

function openAssignResultModal(assignments) {
  const rows = assignments.map((item) => {
    const member = memberLookup(item.assigneeId);
    return `<div class="assignment-result__row">
      ${avatarHTML(member, 'xxs')}
      <span>${esc(item.title)}</span>
      <em>→ ${esc(item.assigneeName)}</em>
    </div>`;
  }).join('');
  openModal({
    title: '分工完成',
    eyebrow: 'ASSIGNED',
    subtitle: `已经把 ${assignments.length} 项任务随机分给成员。`,
    small: true,
    body: `<div class="share-card" style="text-align:center;padding:22px 18px">
      <div style="width:46px;height:46px;border-radius:50%;background:var(--green-soft);color:var(--green);display:grid;place-items:center;margin:0 auto 10px">${icon('check', 23)}</div>
      <div class="share-card__title" style="font-size:17px">每个人都收到自己的任务了</div>
      <div class="share-card__sub" style="font-size:10.5px">任务已进入工作台，负责人可以开始更新进度。</div>
    </div>
    <div class="assignment-result">${rows}</div>`,
    footer: `<button class="btn btn--primary btn--full" data-action="close-modal">回到工作台</button>`,
  });
}

function openNoticeModal() {
  const data = state.project;
  if (!data?.project?.isOwner) return;
  openModal({
    title: '发布置顶通知',
    eyebrow: 'PINNED NOTICE',
    subtitle: '所有成员都会在项目工作台和讨论区看到这条通知。',
    body: `<form class="modal-form" id="notice-form" data-form="create-notice" novalidate>
      <div class="form-error" role="alert"></div>
      <div class="field">
        <label class="field__label" for="notice-title">通知标题</label>
        <input class="input" id="notice-title" name="title" maxlength="80" placeholder="例如：周三 20:00 前提交初稿" required autofocus />
      </div>
      <div class="field">
        <label class="field__label" for="notice-content">通知内容 <span class="field__hint">选填</span></label>
        <textarea class="textarea textarea--tall" id="notice-content" name="content" maxlength="1000" placeholder="补充时间、要求或需要大家注意的事项…"></textarea>
      </div>
    </form>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="submit" form="notice-form">${icon('pin', 14)} 置顶发布</button>`,
  });
}

function openLinkModal() {
  const data = state.project;
  if (!data?.project) return;
  openModal({
    title: '添加共享文档',
    eyebrow: 'SHARED DOCUMENT',
    subtitle: '粘贴在线文档、云盘或参考资料链接，所有成员都能直接打开。',
    body: `<form class="modal-form" id="link-form" data-form="create-link" novalidate>
      <div class="form-error" role="alert"></div>
      <div class="field">
        <label class="field__label" for="link-title">文档名称</label>
        <input class="input" id="link-title" name="title" maxlength="80" placeholder="例如：消费者洞察调研（腾讯文档）" required autofocus />
      </div>
      <div class="field">
        <label class="field__label" for="link-url">文档链接</label>
        <div class="input-wrap">${icon('link', 16)}<input class="input" id="link-url" name="url" type="url" maxlength="500" placeholder="https://…" inputmode="url" required /></div>
      </div>
      <div class="field">
        <label class="field__label" for="link-desc">备注 <span class="field__hint">选填</span></label>
        <textarea class="textarea" id="link-desc" name="description" maxlength="300" rows="2" placeholder="这份文档里有什么，组员需要关注哪里…"></textarea>
      </div>
    </form>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="submit" form="link-form">${icon('link', 14)} 置顶共享</button>`,
  });
}

function openAccountModal() {
  const user = state.user;
  if (!user) return;
  const colors = ['#0A66FF', '#12B76A', '#7A5AF8', '#F79009', '#EE4E8B', '#00A6A6', '#F04438', '#4E5BA6'];
  openModal({
    title: '个人账户',
    eyebrow: 'YOUR ACCOUNT',
    subtitle: '这些信息会展示给你的协作伙伴。',
    body: `<div style="display:flex;align-items:center;gap:15px;padding:4px 0 20px;border-bottom:1px solid var(--line);margin-bottom:18px">
      <span id="account-avatar-preview">${avatarHTML(user, 'xl')}</span>
      <div style="min-width:0;flex:1">
        <div style="font-size:19px;font-weight:720;letter-spacing:-.03em">${esc(user.displayName)}</div>
        <div class="subtle" style="font-size:11px;margin-top:2px">@${esc(user.username)} · 加入于 ${esc(fmtDate(user.createdAt, { year: true }))}</div>
      </div>
    </div>
    <form class="modal-form" id="profile-form" data-form="edit-profile" novalidate>
      <div class="form-error" role="alert"></div>
      <div class="field">
        <label class="field__label" for="profile-name">昵称</label>
        <input class="input" id="profile-name" name="displayName" maxlength="24" value="${esc(user.displayName)}" required />
      </div>
      <div class="field">
        <label class="field__label" for="profile-bio">个人简介 <span class="field__hint">最多 160 字</span></label>
        <textarea class="textarea" id="profile-bio" name="bio" maxlength="160" rows="2" placeholder="写一句自我介绍，或你擅长的事…">${esc(user.bio || '')}</textarea>
      </div>
      <div class="field">
        <label class="field__label">头像颜色</label>
        <div class="color-picker">
          ${colors.map((color) => `<label class="color-option" style="--c:${color}" title="${color}">
            <input type="radio" name="avatarColor" value="${color}" ${user.avatarColor === color ? 'checked' : ''} />
            <span>${user.avatarColor === color ? icon('check', 11) : ''}</span>
          </label>`).join('')}
        </div>
      </div>
    </form>
    <div class="settings-section" style="margin-top:8px">
      <div class="danger-row" style="border-color:var(--line);background:var(--surface-muted)">
        <div class="danger-row__main"><strong style="color:var(--ink-2)">退出当前账号</strong><span>下次需要重新输入用户名和密码。</span></div>
        <button class="btn btn--sm" data-action="logout">${icon('logout', 13)} 退出登录</button>
      </div>
    </div>`,
    footer: `<button class="btn" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="submit" form="profile-form">保存资料</button>`,
  });
}

/* ---------- Member workspace drawer ---------- */
async function openMemberDrawer(memberId) {
  const data = state.project;
  if (!data?.project) return;
  openModal({
    title: '成员工作台',
    eyebrow: 'MEMBER WORKSPACE',
    subtitle: data.project.name,
    drawer: true,
    flush: true,
    body: `<div style="padding:40px 24px;display:grid;place-items:center;gap:12px;color:var(--ink-3);font-size:11px"><div class="skeleton" style="width:42px;height:42px;border-radius:50%"></div><span>正在打开成员工作台…</span></div>`,
  });
  try {
    const detail = await api(`/api/projects/${encodeURIComponent(data.project.id)}/members/${encodeURIComponent(memberId)}`);
    if (!state.modalOpen) return;
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = `${detail.member.displayName} 的工作台`;
    replaceModalBody(memberDetailHTML(detail));
  } catch (error) {
    replaceModalBody(`<div style="padding:36px 24px">${emptyState({ iconName: 'alert', title: '无法打开成员工作台', text: error.message, action: '' })}</div>`);
  }
}

function memberDetailHTML(detail) {
  const data = state.project;
  const member = detail.member;
  const project = data.project;
  const active = project.status === 'active';
  const isSelf = member.isSelf;
  const canComment = active;
  const canDeleteComment = active;
  const meta = WORK_STATUS[member.workStatus] || WORK_STATUS.idle;
  const canUpdateTask = active && (isSelf || project.isOwner);
  return `<div class="drawer-content">
    <section class="member-hero">
      <div class="member-hero__top">
        <div class="member-hero__avatar">${avatarHTML(member, 'xl')}</div>
        <div class="member-hero__main">
          <div class="member-hero__name">${esc(member.displayName)}${isSelf ? '<span class="member-hero__badge">我</span>' : ''}${member.role === 'owner' ? '<span class="member-hero__badge" style="background:var(--violet-soft);color:#5c42d5">项目发起者</span>' : ''}</div>
          <div class="member-hero__handle">@${esc(member.username)} · ${esc(memberRoleLabel(member))}</div>
          <div class="member-hero__bio">${member.bio ? esc(member.bio) : '这位成员还没有写个人简介。'}</div>
        </div>
        ${isSelf && active ? `<button class="btn btn--sm member-hero__edit" data-action="toggle-status-editor">${icon('edit', 12)} 更新状态</button>` : ''}
      </div>
      <div class="member-hero__status">
        ${statusDotHTML(member.workStatus)}
        <div class="member-hero__status-main">
          <div class="member-hero__status-label">${esc(meta.label)} ${member.statusUpdatedAt ? `<span>· ${esc(timeAgo(member.statusUpdatedAt))}更新</span>` : ''}</div>
          <div class="member-hero__status-activity">${esc(member.activity || '还没有填写正在做的事。')}</div>
        </div>
      </div>
      ${isSelf && active ? `<form class="status-editor" id="status-editor" data-form="update-member-status" data-member-id="${esc(member.id)}" hidden>
        <div class="field">
          <label class="field__label" for="status-select">当前工作状态</label>
          <select class="select" id="status-select" name="workStatus">
            ${Object.entries(WORK_STATUS).map(([key, value]) => `<option value="${key}"${member.workStatus === key ? ' selected' : ''}>${value.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-row" style="grid-template-columns:1fr">
          <div class="field">
            <label class="field__label" for="status-activity">正在做什么 <span class="field__hint">最多 100 字</span></label>
            <input class="input" id="status-activity" name="activity" maxlength="100" value="${esc(member.activity || '')}" placeholder="例如：整理消费者访谈记录" />
          </div>
        </div>
        <div class="form-error" role="alert"></div>
        <div class="status-editor__actions">
          <button class="btn btn--ghost btn--sm" type="button" data-action="toggle-status-editor">取消</button>
          <button class="btn btn--primary btn--sm" type="submit">保存状态</button>
        </div>
      </form>` : ''}
      <div class="member-summary">
        <div class="member-summary__cell"><span>任务完成</span><strong>${member.doneCount}<em>/ ${member.taskCount}</em></strong></div>
        <div class="member-summary__cell"><span>平均进度</span><strong>${member.progress}<em>%</em></strong></div>
        <div class="member-summary__cell"><span>收到留言</span><strong>${detail.comments.length}<em>条</em></strong></div>
      </div>
    </section>

    <section class="member-detail-section">
      <div class="member-detail-section__head">
        <div class="member-detail-section__title">${icon('check-square', 14)} 职责与任务 <span class="count">${detail.tasks.length}</span></div>
      </div>
      ${detail.tasks.length ? `<div class="task-detail-list">${detail.tasks.map((task) => memberTaskRowHTML(task, canUpdateTask)).join('')}</div>` : `<div class="member-task-empty">${project.isOwner && active ? '还没有给这位成员分配任务。' : '暂时没有分配任务。'}</div>`}
    </section>

    <section class="member-detail-section">
      <div class="member-detail-section__head">
        <div class="member-detail-section__title">${icon('activity', 14)} 工作进展</div>
      </div>
      ${detail.updates.length ? `<div class="timeline">${detail.updates.map((update) => `<div class="timeline-item">
        <span class="timeline-dot"></span>
        <div class="timeline-item__main">
          <div class="timeline-item__text"><strong>${esc(update.user.displayName)}</strong> · ${esc(update.content)}</div>
          <div class="timeline-item__meta"><span class="badge badge--${TASK_STATUS[update.status]?.badge || 'gray'}" style="min-height:16px;font-size:8px;padding:0 4px">${esc(TASK_STATUS[update.status]?.label || update.status)}</span><span>${esc(update.taskTitle)}</span><span>·</span><span>${esc(timeAgo(update.createdAt))}</span></div>
        </div>
      </div>`).join('')}</div>` : `<div class="member-task-empty">还没有进度记录。任务负责人更新进度后，这里会留下时间线。</div>`}
    </section>

    <section class="member-detail-section">
      <div class="member-detail-section__head">
        <div class="member-detail-section__title">${icon('message', 14)} 组员留言 <span class="count">${detail.comments.length}</span></div>
        <span class="subtle" style="font-size:9px">在这里给 ${esc(member.displayName)} 留言</span>
      </div>
      <div class="member-comments">
        ${detail.comments.length ? detail.comments.map((comment) => {
          const canDel = canDeleteComment && (comment.user.id === state.user.id || project.isOwner);
          return `<div class="member-comment">
            ${avatarHTML(comment.user, 'xs')}
            <div class="member-comment__main">
              <div class="member-comment__head"><span class="member-comment__name">${esc(comment.user.displayName)}</span><span class="member-comment__time">${esc(timeAgo(comment.createdAt))}</span></div>
              <div class="member-comment__content">${esc(comment.content)}</div>
            </div>
            ${canDel ? `<button class="member-comment__del" data-action="delete-member-comment" data-id="${esc(comment.id)}" data-member-id="${esc(member.id)}" aria-label="删除留言">${icon('trash', 12)}</button>` : ''}
          </div>`;
        }).join('') : `<div class="member-task-empty">还没有留言。给这位成员一句鼓励或建议吧。</div>`}
      </div>
      ${canComment ? `<form class="member-comment-form" data-form="member-comment" data-member-id="${esc(member.id)}" novalidate>
        ${avatarHTML(state.user, 'xs')}
        <input class="input" name="content" maxlength="1000" placeholder="给 ${esc(member.displayName)} 留个言…" aria-label="留言内容" required />
        <button class="btn btn--primary btn--sm" type="submit">${icon('send', 12)} 发送</button>
      </form>` : ''}
    </section>
  </div>`;
}

function memberTaskRowHTML(task, canUpdate) {
  const meta = TASK_STATUS[task.status] || TASK_STATUS.todo;
  const due = dueText(task.dueDate);
  return `<div class="task-detail-row${task.status === 'done' ? ' task-detail-row--done' : ''}">
    <div class="task-detail-row__top">
      <div class="task-detail-row__title">${esc(task.title)}</div>
      <div class="task-detail-row__status">${taskBadge(task.status)}</div>
    </div>
    ${task.description ? `<div class="task-detail-row__desc">${esc(task.description)}</div>` : ''}
    <div class="task-detail-row__foot">
      <span class="progress-track"><i style="width:${task.progress}%;${task.status === 'done' ? 'background:var(--green)' : ''}"></i></span>
      <span>${task.progress}%</span>
      ${due ? `<span>·</span><span>${esc(due.label)}</span>` : ''}
      ${canUpdate ? `<button class="task-detail-row__update" data-action="open-task" data-id="${esc(task.id)}">更新进度</button>` : `<button class="task-detail-row__update" data-action="open-task" data-id="${esc(task.id)}">查看</button>`}
    </div>
  </div>`;
}

function openTaskModal(taskId) {
  const data = state.project;
  if (!data?.project) return;
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) {
    toast('任务信息已更新，请刷新后重试。', 'info');
    return;
  }
  const project = data.project;
  const active = project.status === 'active';
  const canEdit = active && (task.assigneeId === state.user.id || project.isOwner);
  const assignee = task.assignee || memberLookup(task.assigneeId) || {};
  const due = dueText(task.dueDate);
  const priorityLabel = task.priority === 'high' ? '重要' : task.priority === 'low' ? '较低' : '普通';
  openModal({
    title: '任务详情',
    eyebrow: 'TASK',
    subtitle: project.name,
    body: `<div class="task-modal">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px">
        <div style="flex:1;min-width:0">
          <h4 style="font-size:19px;line-height:1.35;font-weight:720;letter-spacing:-.03em">${esc(task.title)}</h4>
          <div style="margin-top:8px">${taskBadge(task.status)}</div>
        </div>
        <span class="badge badge--${task.priority === 'high' ? 'red' : task.priority === 'low' ? 'gray' : 'amber'}">${icon('flag', 10)} ${priorityLabel}</span>
      </div>
      <div class="task-modal-meta">
        <span class="task-modal-meta__item">${avatarHTML(assignee, 'xxs')} 负责人 ${esc(assignee.displayName || '未分配')}</span>
        ${task.dueDate ? `<span class="task-modal-meta__item">${icon('calendar', 12)} ${esc(due?.label || fmtDate(task.dueDate))}</span>` : ''}
        <span class="task-modal-meta__item">${icon('clock', 12)} 更新于 ${esc(timeAgo(task.updatedAt))}</span>
      </div>
      <div class="task-modal-desc">${task.description ? esc(task.description) : '这项任务还没有补充说明。'}</div>
      ${canEdit ? `<form id="task-update-form" data-form="update-task" data-id="${esc(task.id)}" novalidate>
        <div class="task-update-box">
          <div class="task-update-box__title">${icon('activity', 14)} 更新工作进度</div>
          <div class="form-error" role="alert" style="margin-bottom:10px"></div>
          <div class="form-row">
            <div class="field">
              <label class="field__label" for="task-status">任务状态</label>
              <select class="select" id="task-status" name="status">
                ${Object.entries(TASK_STATUS).map(([key, value]) => `<option value="${key}"${task.status === key ? ' selected' : ''}>${value.label}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="task-progress">完成进度</label>
              <div class="range-wrap" style="min-height:46px">
                <input id="task-progress" name="progress" type="range" min="0" max="100" step="5" value="${task.progress}" data-range-output="task-progress-value" />
                <span class="range-value" id="task-progress-value">${task.progress}%</span>
              </div>
            </div>
          </div>
          <div class="field" style="margin-top:10px">
            <label class="field__label" for="task-note">进度备注 <span class="field__hint">选填，会记录在进展时间线</span></label>
            <textarea class="textarea" id="task-note" name="note" maxlength="500" rows="2" placeholder="例如：已完成访谈整理，正在撰写结论…"></textarea>
          </div>
        </div>
      </form>` : `<div class="assign-info">${icon('lock', 13)}<span>${active ? '只有任务负责人或项目发起者可以更新进度。' : '项目已归档，任务进度为只读。'}</span></div>`}
      ${project.isOwner && active ? `<div class="task-delete" style="display:flex;justify-content:flex-end"><button class="linkish" style="color:var(--red)" data-action="delete-task" data-id="${esc(task.id)}">${icon('trash', 12)} 删除这项任务</button></div>` : ''}
    </div>`,
    footer: `<button class="btn" data-action="close-modal">关闭</button>${canEdit ? `<button class="btn btn--primary" type="submit" form="task-update-form">保存进度</button>` : ''}`,
  });
}

function openImageLightbox(src) {
  const existing = document.querySelector('.image-lightbox');
  if (existing) existing.remove();
  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-label', '图片预览');
  lightbox.innerHTML = `<button class="image-lightbox__close" type="button" aria-label="关闭预览">${icon('close', 18)}</button><img src="${esc(src)}" alt="图片预览" />`;
  document.body.appendChild(lightbox);
  const close = () => lightbox.remove();
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('.image-lightbox__close')) close();
  });
}


/* =========================================================
   Navigation & routing
   ========================================================= */
function safeNext(value) {
  const raw = String(value || '').trim();
  if (!raw) return '/home';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return '/home';
  return raw;
}

async function navigateImpl(path, { replace = false } = {}) {
  if (typeof path !== 'string') return;
  let target;
  try {
    target = new URL(path, location.origin);
  } catch {
    return;
  }
  if (target.origin !== location.origin) {
    location.href = target.href;
    return;
  }
  const destination = `${target.pathname}${target.search}`;
  if (destination === `${location.pathname}${location.search}`) return;
  closeModal();
  document.querySelectorAll('.image-lightbox').forEach((el) => el.remove());
  stopProjectLive();
  state.currentProjectId = null;
  if (replace) history.replaceState({}, '', destination);
  else history.pushState({}, '', destination);
  await route();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function route() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(location.search);
  stopProjectLive();

  if (path === '/') {
    state.route = 'landing';
    if (state.user) {
      history.replaceState({}, '', '/home');
      return route();
    }
    renderLanding();
    return;
  }

  if (path === '/login') {
    state.route = 'auth';
    state.authMode = params.get('mode') === 'register' ? 'register' : 'login';
    state.authNext = safeNext(params.get('next'));
    if (state.user) {
      const next = state.authNext;
      state.authNext = '/home';
      return navigateImpl(next, { replace: true });
    }
    renderAuthPage();
    return;
  }

  if (path === '/home') {
    state.route = 'dashboard';
    if (!state.user) {
      return navigateImpl(`/login?next=${encodeURIComponent('/home')}`, { replace: true });
    }
    await loadDashboard();
    return;
  }

  const gateMatch = path.match(/^\/p\/([A-Za-z0-9_-]+)$/);
  if (gateMatch) {
    state.route = 'gate';
    await loadGate(gateMatch[1]);
    return;
  }

  const projectMatch = path.match(/^\/project\/([a-f0-9-]+)$/i);
  if (projectMatch) {
    state.route = 'project';
    if (!state.user) {
      return navigateImpl(`/login?next=${encodeURIComponent(path)}`, { replace: true });
    }
    await loadProjectPage(projectMatch[1], { tab: params.get('tab') });
    return;
  }

  state.route = 'not-found';
  renderNotFound();
}

async function loadDashboard({ quiet = false } = {}) {
  if (!state.user) return;
  if (!quiet) renderLoadingPage();
  try {
    const data = await api('/api/projects');
    state.dashboard = data;
    renderDashboard();
  } catch (error) {
    if (error.status === 401) {
      state.user = null;
      state.dashboard = null;
      return navigateImpl(`/login?next=${encodeURIComponent('/home')}`, { replace: true });
    }
    renderErrorPage({
      code: '出错了',
      title: '无法载入工作台',
      text: error.message || '请稍后重试。',
      action: '重新加载',
      path: '/home',
    });
  }
}

async function loadGate(slug) {
  renderGateSkeleton();
  try {
    const gate = await api(`/api/projects/by-slug/${encodeURIComponent(slug)}`);
    state.gate = { ...gate, slug };
    if (gate.isMember && state.user) {
      return navigateImpl(`/project/${gate.project.id}`, { replace: true });
    }
    renderProjectGate();
  } catch (error) {
    if (error.status === 404) {
      renderErrorPage({
        code: '404',
        title: '项目链接已失效',
        text: '这个项目链接不存在，可能已被发起者重置。请向发起者获取新的分享链接。',
        action: '返回工作台',
      });
    } else {
      renderErrorPage({
        code: '出错了',
        title: '暂时无法打开这个项目',
        text: error.message || '请稍后再试。',
        action: '返回首页',
      });
    }
  }
}

function renderGateSkeleton() {
  document.body.style.background = '#f5f7fa';
  appEl.innerHTML = `<div class="gate-page">
    <header class="gate-nav">${brandHTML({ href: '/' })}<span></span></header>
    <main class="gate-main"><div class="gate-card">
      <section class="gate-visual" style="gap:18px">
        <div class="skeleton" style="width:48px;height:48px;border-radius:15px;background:rgba(255,255,255,.14)"></div>
        <div class="skeleton" style="width:70%;height:30px;background:rgba(255,255,255,.14)"></div>
        <div class="skeleton" style="width:45%;height:14px;background:rgba(255,255,255,.1)"></div>
      </section>
      <section class="gate-form">
        <div class="skeleton" style="width:44px;height:44px;border-radius:13px"></div>
        <div class="skeleton" style="width:60%;height:22px;margin-top:16px"></div>
        <div class="skeleton" style="width:100%;height:46px;margin-top:24px"></div>
        <div class="skeleton" style="width:100%;height:46px"></div>
      </section>
    </div></main>
  </div>`;
}

/* =========================================================
   Actions
   ========================================================= */
async function handleAction(action, el, event) {
  switch (action) {
    case 'close-modal':
      closeModal();
      return;
    case 'run-confirm': {
      const fn = state.confirmAction;
      state.confirmAction = null;
      if (!fn) {
        closeModal();
        return;
      }
      closeModal();
      try {
        await fn();
      } catch (error) {
        toast(error.message || '操作失败，请稍后重试。', 'error');
      }
      return;
    }
    case 'switch-auth': {
      state.authMode = el.dataset.mode === 'register' ? 'register' : 'login';
      const params = new URLSearchParams();
      if (state.authMode === 'register') params.set('mode', 'register');
      if (state.authNext && state.authNext !== '/home') params.set('next', state.authNext);
      const qs = params.toString();
      history.replaceState({}, '', `/login${qs ? `?${qs}` : ''}`);
      renderAuthPage();
      return;
    }
    case 'toggle-password': {
      const input = document.getElementById(el.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      el.innerHTML = icon(show ? 'eye-off' : 'eye', 16);
      el.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
      return;
    }
    case 'logout':
      await api('/api/auth/logout', { method: 'POST' });
      state.user = null;
      state.dashboard = null;
      state.project = null;
      state.gate = null;
      state.currentProjectId = null;
      closeModal();
      toast('已退出登录', 'info');
      await navigateImpl('/');
      return;
    case 'open-account':
      openAccountModal();
      return;
    case 'open-create-project':
      if (!state.user) {
        await navigateImpl('/login?next=%2Fhome');
        return;
      }
      openCreateProjectModal();
      return;
    case 'open-share':
      openShareModal();
      return;
    case 'open-settings':
      if (!state.project) return;
      if (!state.project.project.isOwner) {
        toast('只有项目发起者可以修改设置。', 'info');
        return;
      }
      if (state.project.project.status !== 'active') {
        toast('项目已归档，设置不可修改。', 'info');
        return;
      }
      openSettingsModal();
      return;
    case 'open-start':
      openStartModal();
      return;
    case 'open-assign':
      openAssignModal(el.dataset.mode || 'random');
      return;
    case 'open-notice':
      if (!state.project?.project?.isOwner) return;
      if (!projectIsActive()) { toast('项目已归档，无法发布通知。', 'info'); return; }
      openNoticeModal();
      return;
    case 'open-link':
      if (!projectIsActive()) { toast('项目已归档，无法添加文档。', 'info'); return; }
      openLinkModal();
      return;
    case 'open-member':
      if (el.dataset.id) await openMemberDrawer(el.dataset.id);
      return;
    case 'open-task':
      if (el.dataset.id) openTaskModal(el.dataset.id);
      return;
    case 'delete-post':
      openConfirm({
        title: '删除这条内容？',
        message: '删除后，这条内容附带的文件与评论也会一并移除，且无法恢复。',
        confirmLabel: '删除内容',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          toast('内容已删除');
        },
      });
      return;
    case 'delete-comment':
      openConfirm({
        title: '删除这条评论？',
        message: '这条评论会从讨论中移除，且无法恢复。',
        confirmLabel: '删除评论',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          toast('评论已删除');
        },
      });
      return;
    case 'delete-member-comment': {
      const memberId = el.dataset.memberId;
      openConfirm({
        title: '删除这条留言？',
        message: '这条留言会从成员工作台中移除，且无法恢复。',
        confirmLabel: '删除留言',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          await openMemberDrawer(memberId);
          toast('留言已删除');
        },
      });
      return;
    }
    case 'delete-notice':
      openConfirm({
        title: '删除这条置顶通知？',
        message: '删除后，所有成员将不再看到这条通知。',
        confirmLabel: '删除通知',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/notices/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          toast('通知已删除');
        },
      });
      return;
    case 'delete-link':
      openConfirm({
        title: '移除这份共享文档？',
        message: '只会移除项目中的链接，不会删除原文档。',
        confirmLabel: '移除链接',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/links/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          toast('文档链接已移除');
        },
      });
      return;
    case 'delete-task':
      openConfirm({
        title: '删除这项任务？',
        message: '任务、进度记录都会从项目中移除，且无法恢复。',
        confirmLabel: '删除任务',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' });
          await forceRefreshProject();
          toast('任务已删除');
        },
      });
      return;
    case 'rotate-link':
      openConfirm({
        title: '重置项目分享链接？',
        message: '旧链接会立即失效，任何拿到旧链接的人都无法再加入。已经加入的成员不受影响。',
        confirmLabel: '重置链接',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/rotate-link`, { method: 'POST' });
          await forceRefreshProject();
          openShareModal();
          toast('项目链接已重置');
        },
      });
      return;
    case 'end-project':
      openConfirm({
        title: '结束并归档项目？',
        message: '项目会变为只读状态，成员仍可查看所有讨论、文件和工作记录，但不能继续编辑、分工或加入新成员。此操作无法撤销。',
        confirmLabel: '结束项目',
        onConfirm: async () => {
          const projectId = state.project?.project?.id;
          await api(`/api/projects/${encodeURIComponent(projectId)}/end`, { method: 'POST' });
          await forceRefreshProject();
          toast('项目已结束并归档');
        },
      });
      return;
    case 'toggle-status-editor': {
      const editor = document.getElementById('status-editor');
      if (!editor) return;
      editor.hidden = !editor.hidden;
      if (!editor.hidden) {
        const select = editor.querySelector('select');
        if (select) select.focus();
        setTimeout(() => editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
      }
      return;
    }
    case 'copy-text': {
      let value = el.dataset.copy || '';
      try { value = decodeURIComponent(value); } catch { /* keep raw */ }
      await copyText(value, el.dataset.copied || '已复制');
      return;
    }
    case 'preview-image':
      openImageLightbox(el.dataset.src || el.getAttribute('src'));
      return;
    case 'refresh-project':
      try {
        await forceRefreshProject();
        toast('已同步最新协作动态', 'info');
      } catch (error) {
        toast(error.message || '同步失败，请稍后重试。', 'error');
      }
      return;
    case 'switch-project-tab': {
      const tab = el.dataset.tab;
      if (!state.project?.project) return;
      if (tab === 'work' && state.project.project.phase !== 'work') return;
      if (!['prep', 'work'].includes(tab)) return;
      if (tab === state.tab) return;
      state.tab = tab;
      document.querySelectorAll('.project-tab[data-tab]').forEach((button) => {
        const active = button.dataset.tab === tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
      });
      const pane = document.getElementById('project-pane');
      if (pane) {
        pane.innerHTML = tab === 'work' ? workPaneHTML() : prepPaneHTML();
        pane.classList.remove('project-pane');
        void pane.offsetWidth;
        pane.classList.add('project-pane');
      }
      history.replaceState({}, '', `/project/${state.project.project.id}${tab === 'work' ? '?tab=work' : ''}`);
      const tabs = document.querySelector('.project-tabs');
      if (tabs) {
        const top = tabs.getBoundingClientRect().top + window.scrollY - 60;
        if (window.scrollY > top + 2) window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }
    case 'add-suggestion': {
      const textarea = document.getElementById('assign-titles');
      if (!textarea) return;
      const title = el.dataset.title || '';
      const lines = textarea.value.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.includes(title)) lines.push(title);
      textarea.value = lines.join('\n');
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      return;
    }
    case 'focus-join': {
      const section = document.getElementById('quick-join');
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => section.querySelector('input')?.focus({ preventScroll: true }), 380);
      return;
    }
    case 'clear-post-file': {
      const input = document.getElementById('post-file');
      if (input) input.value = '';
      const preview = document.getElementById('composer-file');
      if (preview) {
        preview.innerHTML = '';
        preview.classList.remove('is-visible');
      }
      return;
    }
    default:
      return;
  }
}

/* =========================================================
   Form submissions
   ========================================================= */
async function handleFormSubmission(kind, form) {
  switch (kind) {
    case 'login':
    case 'register': {
      const payload = formToObject(form);
      if (!payload.username?.trim() || !payload.password) {
        formError(form, '请输入用户名和密码。');
        return;
      }
      if (kind === 'register' && !payload.displayName?.trim()) {
        formError(form, '请填写你的昵称。');
        return;
      }
      if (kind === 'register' && payload.password.length < 6) {
        formError(form, '密码至少需要 6 位。');
        return;
      }
      const result = await api(`/api/auth/${kind}`, { method: 'POST', data: payload });
      state.user = result.user;
      state.dashboard = null;
      state.project = null;
      state.gate = null;
      const next = safeNext(state.authNext);
      state.authNext = '/home';
      toast(kind === 'register' ? `欢迎加入同频，${result.user.displayName}` : `欢迎回来，${result.user.displayName}`);
      await navigateImpl(next, { replace: true });
      return;
    }
    case 'create-project': {
      const payload = formToObject(form);
      if (!payload.name?.trim()) {
        formError(form, '请填写项目名称。');
        return;
      }
      if (!payload.password || payload.password.length < 4) {
        formError(form, '项目密码至少需要 4 位。');
        return;
      }
      const result = await api('/api/projects', { method: 'POST', data: payload });
      state.pendingShare = { password: payload.password };
      state.dashboard = null;
      closeModal();
      await navigateImpl(`/project/${result.project.id}`);
      return;
    }
    case 'update-project-settings': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      if (!payload.name?.trim()) {
        formError(form, '项目名称不能为空。');
        return;
      }
      if (payload.password && payload.password.length < 4) {
        formError(form, '新的项目密码至少需要 4 位。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/settings`, { method: 'PATCH', data: payload });
      closeModal();
      await forceRefreshProject();
      toast('项目设置已更新');
      return;
    }
    case 'start-project': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      await api(`/api/projects/${encodeURIComponent(projectId)}/start`, { method: 'POST' });
      closeModal();
      await forceRefreshProject({ rerender: false });
      state.tab = 'work';
      renderProjectPage({ preserveScroll: true });
      toast('正式协作已开启，去完成成员分工吧');
      return;
    }
    case 'random-assign': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      const titles = String(payload.taskTitles || '').split('\n').map((line) => line.trim()).filter(Boolean);
      if (!titles.length) {
        formError(form, '请至少填写一个任务名称。');
        return;
      }
      if (titles.length > 30) {
        formError(form, '一次最多随机分配 30 项任务。');
        return;
      }
      const result = await api(`/api/projects/${encodeURIComponent(projectId)}/assign/random`, {
        method: 'POST',
        data: { tasks: titles },
      });
      await forceRefreshProject();
      state.tab = 'work';
      openAssignResultModal(result.assignments);
      return;
    }
    case 'create-task': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      if (!payload.title?.trim()) {
        formError(form, '请填写任务名称。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/tasks`, { method: 'POST', data: payload });
      closeModal();
      await forceRefreshProject();
      toast('任务已添加，负责人可以开始更新进度');
      return;
    }
    case 'create-notice': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      if (!payload.title?.trim()) {
        formError(form, '请填写通知标题。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/notices`, { method: 'POST', data: payload });
      closeModal();
      await forceRefreshProject();
      toast('通知已置顶发布');
      return;
    }
    case 'create-link': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      if (!payload.title?.trim()) {
        formError(form, '请填写文档名称。');
        return;
      }
      if (!/^https?:\/\//i.test(String(payload.url || ''))) {
        formError(form, '请填写以 http:// 或 https:// 开头的有效链接。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/links`, { method: 'POST', data: payload });
      closeModal();
      await forceRefreshProject();
      toast('共享文档已添加');
      return;
    }
    case 'create-post': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const fd = new FormData(form);
      const file = fd.get('file');
      if (file instanceof File && file.size === 0) fd.delete('file');
      const title = String(fd.get('title') || '').trim();
      const content = String(fd.get('content') || '').trim();
      const hasFile = file instanceof File && file.size > 0;
      if (!title && !content && !hasFile) {
        formError(form, '写一点想法，或上传一份资料再发布。');
        return;
      }
      if (hasFile && file.size > 50 * 1024 * 1024) {
        formError(form, '文件不能超过 50MB。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/posts`, { method: 'POST', form: fd });
      await forceRefreshProject();
      toast('已发布到讨论区');
      return;
    }
    case 'post-comment': {
      const projectId = state.project?.project?.id;
      const postId = form.dataset.postId;
      if (!projectId || !postId) return;
      const payload = formToObject(form);
      if (!payload.content?.trim()) return;
      await api(`/api/projects/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        data: { content: payload.content },
      });
      await forceRefreshProject();
      return;
    }
    case 'member-comment': {
      const projectId = state.project?.project?.id;
      const memberId = form.dataset.memberId;
      if (!projectId || !memberId) return;
      const payload = formToObject(form);
      if (!payload.content?.trim()) {
        formError(form, '留言不能为空。');
        return;
      }
      await api(`/api/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}/comments`, {
        method: 'POST',
        data: { content: payload.content },
      });
      await forceRefreshProject({ rerender: false });
      const detail = await api(`/api/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`);
      if (state.modalOpen) {
        replaceModalBody(memberDetailHTML(detail));
        const body = document.getElementById('modal-body');
        if (body) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
      }
      toast('留言已发送');
      return;
    }
    case 'update-task': {
      const projectId = state.project?.project?.id;
      const taskId = form.dataset.id;
      if (!projectId || !taskId) return;
      const payload = formToObject(form);
      await api(`/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        data: { status: payload.status, progress: Number(payload.progress), note: payload.note || '' },
      });
      closeModal();
      await forceRefreshProject();
      toast('任务进度已更新');
      return;
    }
    case 'update-member-status': {
      const projectId = state.project?.project?.id;
      if (!projectId) return;
      const payload = formToObject(form);
      await api(`/api/projects/${encodeURIComponent(projectId)}/status`, {
        method: 'POST',
        data: { workStatus: payload.workStatus, activity: payload.activity || '' },
      });
      closeModal();
      await forceRefreshProject();
      toast('工作状态已同步给团队');
      return;
    }
    case 'edit-profile': {
      const payload = formToObject(form);
      if (!payload.displayName?.trim()) {
        formError(form, '昵称不能为空。');
        return;
      }
      const result = await api('/api/me', { method: 'PATCH', data: payload });
      state.user = result.user;
      closeModal();
      if (state.route === 'dashboard') await loadDashboard({ quiet: true });
      else if (state.route === 'project') await forceRefreshProject();
      else if (state.route === 'landing') renderLanding();
      toast('个人资料已更新');
      return;
    }
    case 'unlock-project': {
      const slug = form.dataset.slug;
      if (!slug) return;
      const payload = formToObject(form);
      if (!payload.password) {
        formError(form, '请输入项目密码。');
        return;
      }
      const result = await api(`/api/projects/by-slug/${encodeURIComponent(slug)}/unlock`, {
        method: 'POST',
        data: { password: payload.password },
      });
      state.dashboard = null;
      state.gate = null;
      toast('已加入项目');
      await navigateImpl(`/project/${result.projectId}`, { replace: true });
      return;
    }
    case 'quick-join': {
      const payload = formToObject(form);
      const slug = parseProjectLink(payload.link);
      if (!slug) {
        toast('请粘贴有效的项目链接，例如 …/p/AbC123', 'error');
        return;
      }
      await navigateImpl(`/p/${encodeURIComponent(slug)}`);
      return;
    }
    default:
      return;
  }
}

/* =========================================================
   Rich input helpers
   ========================================================= */
function updateFilePreview(file) {
  const preview = document.getElementById('composer-file');
  if (!preview) return;
  if (!file) {
    preview.innerHTML = '';
    preview.classList.remove('is-visible');
    return;
  }
  const kind = fileKind(file.name);
  preview.innerHTML = `<span class="file-ico file-ico--${kind.cls}">${kind.label}</span>
    <span class="composer__file-name">${esc(file.name)}</span>
    <span class="composer__file-size">${esc(formatSize(file.size))}</span>
    <button class="composer__file-remove" type="button" data-action="clear-post-file" aria-label="移除文件">${icon('close', 13)}</button>`;
  preview.classList.add('is-visible');
}

function validateSelectedFile(file) {
  if (!file) return true;
  if (file.size > 50 * 1024 * 1024) {
    toast('文件不能超过 50MB。', 'error');
    return false;
  }
  const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'zip', 'rar', '7z'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    toast('暂不支持该文件类型，请上传文档、表格、演示文稿、图片或压缩包。', 'error');
    return false;
  }
  return true;
}

function updateColorPreview(event) {
  const color = event.target.value;
  const preview = document.getElementById('account-avatar-preview');
  const nameInput = document.getElementById('profile-name');
  if (preview) {
    preview.innerHTML = avatarHTML({
      displayName: nameInput?.value || state.user?.displayName || '?',
      avatarColor: color,
    }, 'xl');
  }
  const picker = event.target.closest('.color-picker');
  if (picker) {
    picker.querySelectorAll('.color-option').forEach((label) => {
      const input = label.querySelector('input');
      const mark = label.querySelector('span');
      if (mark) mark.innerHTML = input.checked ? icon('check', 11) : '';
    });
  }
}

/* =========================================================
   Global events
   ========================================================= */
document.addEventListener('click', async (event) => {
  const actionEl = event.target.closest('[data-action]');
  if (actionEl && !actionEl.disabled) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await handleAction(actionEl.dataset.action, actionEl, event);
    } catch (error) {
      if (error?.network) toast(error.message, 'error');
      else toast(error?.message || '操作失败，请稍后重试。', 'error');
    }
    return;
  }

  const navEl = event.target.closest('[data-nav]');
  if (navEl) {
    event.preventDefault();
    await navigateImpl(navEl.dataset.nav);
    return;
  }

  if (event.target.matches('[data-modal-backdrop]')) {
    closeModal();
    return;
  }

  if (event.target.closest('.image-lightbox__close')) {
    document.querySelector('.image-lightbox')?.remove();
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.submitting === '1') return;
  const kind = form.dataset.form;
  const submitter = event.submitter || form.querySelector('button[type="submit"]');
  clearFormError(form);
  form.dataset.submitting = '1';
  setLoading(submitter, true);
  try {
    await handleFormSubmission(kind, form);
  } catch (error) {
    if (error?.network) formError(form, error.message);
    else formError(form, error?.message || '提交失败，请稍后重试。');
  } finally {
    delete form.dataset.submitting;
    setLoading(submitter, false);
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'post-file') {
    const file = target.files?.[0];
    if (file && !validateSelectedFile(file)) {
      target.value = '';
      updateFilePreview(null);
      return;
    }
    updateFilePreview(file || null);
    return;
  }
  if (target.name === 'avatarColor' && target.closest('#profile-form')) {
    updateColorPreview(event);
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (target.matches('input[type="range"][data-range-output]')) {
    const output = document.getElementById(target.dataset.rangeOutput);
    if (output) output.textContent = `${target.value}%`;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const lightbox = document.querySelector('.image-lightbox');
    if (lightbox) {
      lightbox.remove();
      return;
    }
    if (state.modalOpen) closeModal();
    return;
  }
  trapFocus(event);
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    const form = event.target.closest('form[data-form]');
    if (form && ['create-post', 'post-comment', 'member-comment'].includes(form.dataset.form)) {
      event.preventDefault();
      form.requestSubmit();
    }
  }
});

/* Drag & drop for uploads */
document.addEventListener('dragover', (event) => {
  const composer = event.target.closest('.composer');
  if (!composer) return;
  event.preventDefault();
  composer.classList.add('is-dragover');
});

document.addEventListener('dragleave', (event) => {
  const composer = event.target.closest('.composer');
  if (!composer) return;
  if (!composer.contains(event.relatedTarget)) composer.classList.remove('is-dragover');
});

document.addEventListener('drop', (event) => {
  const composer = event.target.closest('.composer');
  if (!composer) return;
  event.preventDefault();
  composer.classList.remove('is-dragover');
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  const file = files[0];
  if (!validateSelectedFile(file)) return;
  const input = document.getElementById('post-file');
  if (!input) return;
  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    updateFilePreview(file);
  } catch {
    toast('无法读取拖入的文件，请点击「添加文件」上传。', 'error');
  }
});

window.addEventListener('popstate', async () => {
  closeModal();
  document.querySelectorAll('.image-lightbox').forEach((el) => el.remove());
  state.currentProjectId = null;
  await route();
  window.scrollTo({ top: 0, behavior: 'auto' });
});

/* =========================================================
   Boot
   ========================================================= */
setNavigator(navigateImpl);

async function boot() {
  try {
    const me = await api('/api/me');
    state.user = me.user;
  } catch (error) {
    renderErrorPage({
      code: '无法连接',
      title: '暂时无法连接同频',
      text: error.message || '请检查网络后刷新页面。',
      action: '重新加载',
      path: '/',
    });
    return;
  }
  await route();
}

boot();


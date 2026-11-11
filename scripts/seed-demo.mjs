// Seed a realistic demo workspace. Safe to run on an empty database.
// Accounts: linche / suyu / chenmo / zhouye — password: tongpin2026
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const here = path.dirname(fileURLToPath(import.meta.url));
const DEMO_ASSETS = path.join(here, 'demo-assets');
const DB_PATH = path.join(here, '..', 'data', 'tongpin.db');
const PASSWORD = 'tongpin2026';
const PROJECT_PASSWORD = 'team2026';

class Client {
  constructor() { this.cookie = ''; }
  async req(route, { method = 'GET', data, form } = {}) {
    const headers = {};
    if (this.cookie) headers.cookie = this.cookie;
    let body;
    if (form) body = form;
    else if (data !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(data);
    }
    const res = await fetch(base + route, { method, headers, body });
    const sc = res.headers.getSetCookie?.() || [];
    if (sc.length) this.cookie = sc.map((c) => c.split(';')[0]).join('; ');
    let payload = null;
    try { payload = await res.json(); } catch { /* ignore */ }
    if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${JSON.stringify(payload)}`);
    return payload;
  }
  async auth(user) {
    try {
      await this.req('/api/auth/register', { method: 'POST', data: { ...user, password: PASSWORD } });
    } catch (error) {
      if (!String(error.message).includes('409')) throw error;
      await this.req('/api/auth/login', { method: 'POST', data: { username: user.username, password: PASSWORD } });
    }
  }
}

const people = [
  { key: 'owner', username: 'linche', displayName: '林澈', bio: '把复杂的事，拆成每个人都能往前走的一小步。' },
  { key: 'suyu', username: 'suyu', displayName: '苏雨', bio: '视觉与内容方向。喜欢有呼吸感的品牌表达。' },
  { key: 'chenmo', username: 'chenmo', displayName: '陈默', bio: '策略与结构。负责把想法落成可执行的方案。' },
  { key: 'zhouye', username: 'zhouye', displayName: '周野', bio: '用户研究爱好者，正在练习把访谈问题问得更具体。' },
];
const clients = {};
for (const person of people) {
  const client = new Client();
  await client.auth(person);
  await client.req('/api/me', { method: 'PATCH', data: { displayName: person.displayName, bio: person.bio } });
  clients[person.key] = client;
}

const owner = clients.owner;
const projectResult = await owner.req('/api/projects', {
  method: 'POST',
  data: {
    name: '品牌焕新计划',
    course: '市场营销 · 品牌管理',
    description: '为进入中国市场五年的生活方式品牌，重新梳理核心人群与品牌表达，完成一套可落地的焕新提案。',
    password: PROJECT_PASSWORD,
    deadline: isoDate(12),
  },
});
const project = projectResult.project;
for (const person of people.slice(1)) {
  await clients[person.key].req(`/api/projects/by-slug/${project.joinSlug}/unlock`, {
    method: 'POST',
    data: { password: PROJECT_PASSWORD },
  });
}

// uploads are performed with a specific member's session
async function postAs(client, { title, content, fileName, filePath, mime }) {
  const form = new FormData();
  form.append('title', title);
  form.append('content', content);
  if (filePath) form.append('file', new Blob([fs.readFileSync(filePath)], { type: mime }), fileName);
  return client.req(`/api/projects/${project.id}/posts`, { method: 'POST', form });
}

const p1 = await postAs(owner, {
  title: '先对齐一个问题：我们到底在焕新什么？',
  content: '我整理了第一轮桌面研究，发现真正的问题可能不是「品牌变老了」，而是品牌表达和核心人群的生活方式脱节。\n\n建议大家从三个方向补充资料：\n1. 竞品最近半年的视觉与内容变化\n2. 目标人群对「真实感」的具体描述\n3. 我们能延续和必须放弃的品牌资产\n\n周三 20:00 前把资料发在下面，我们做一次线上对齐。',
});
const p2 = await postAs(clients.suyu, {
  title: '消费者洞察摘要：不是更年轻，而是更真实',
  content: '把 12 份访谈和 4 个竞品的公开内容做了一轮粗整理。给我最强烈的感受是：大家不是拒绝精致，而是拒绝「不真实的精致」。\n\n这页可以先作为周五讨论的起点，数据口径我还在补。',
  fileName: '消费者洞察-第一轮摘要.png',
  filePath: path.join(DEMO_ASSETS, 'consumer-insight.png'),
  mime: 'image/png',
});
const p3 = await postAs(clients.chenmo, {
  title: '创意 Brief v1.0：范围与时间节点',
  content: '先搭了一个 brief 框架，把交付范围和关键节点放进去。\n\n目前最有分歧的是「品牌语气」：是更克制专业，还是更日常亲近？我倾向两者并不冲突，但需要在视觉上找到平衡。大家可以直接在文档里批注。',
  fileName: '品牌焕新项目-创意Brief-v1.0.docx',
  filePath: path.join(DEMO_ASSETS, 'brand-refresh-brief.docx'),
  mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});
const p4 = await postAs(clients.zhouye, {
  title: '访谈里被反复提到的一个词：松弛感',
  content: '今天补了 3 个用户访谈，发现「松弛感」出现了 11 次。\n\n有意思的是，用户描述的不是视觉上的留白，而是「不用被推销」的沟通感觉。下一轮访谈我想继续追问：什么样的品牌行为会让你觉得被尊重？',
});

async function comment(client, postId, content) {
  await client.req(`/api/projects/${project.id}/posts/${postId}/comments`, { method: 'POST', data: { content } });
}
await comment(clients.suyu, p1.id, '认同。竞品部分我今晚整理 4 个品牌的视觉变化，明早放上来。');
await comment(clients.chenmo, p1.id, '「能延续和必须放弃的资产」这个提法很好，我把它放进 brief 的结构里。');
await comment(clients.zhouye, p1.id, '用户端我来补充，明天能再约到两位访谈对象。');
await comment(owner, p2.id, '这个「不真实的精致」很准确。下一轮可以把它拆成具体的视觉语言。');
await comment(clients.chenmo, p2.id, '图表很清楚，建议再加一页人群差异，方便后面做传播分层。');
await comment(owner, p3.id, '收到。品牌语气那里，我先倾向「专业但不端着」，我们周五投票决定。');
await comment(clients.suyu, p4.id, '「不用被推销」这个点可以直接变成内容原则，很有启发。');

await owner.req(`/api/projects/${project.id}/notices`, {
  method: 'POST',
  data: { title: '周三 20:00 前完成第一轮资料汇总', content: '请每位成员在周三晚上 8 点前，把自己的资料和初步结论补充到对应讨论下。我们会用 30 分钟快速对齐，然后进入正式分工。' },
});
await owner.req(`/api/projects/${project.id}/notices`, {
  method: 'POST',
  data: { title: '周五 19:30 · 品牌方向内部评审', content: '第一次方向评审安排在周五晚上，线上进行。每人准备 5 分钟，重点讲结论和依据，不用做完整提案。' },
});
await owner.req(`/api/projects/${project.id}/links`, {
  method: 'POST',
  data: { title: '消费者洞察 · 腾讯文档', url: 'https://docs.qq.com/doc/brand-insight', description: '访谈记录与洞察汇总' },
});
await clients.chenmo.req(`/api/projects/${project.id}/links`, {
  method: 'POST',
  data: { title: '品牌资产盘点 · 飞书文档', url: 'https://example.feishu.cn/docx/brand-assets', description: '现有品牌资产与竞品对照' },
});
await clients.suyu.req(`/api/projects/${project.id}/links`, {
  method: 'POST',
  data: { title: '视觉参考板 · Pinterest', url: 'https://www.pinterest.com/', description: '情绪板与视觉方向采样' },
});

await owner.req(`/api/projects/${project.id}/start`, { method: 'POST' });

async function addTask(assigneeId, title, description, priority, dueDate) {
  const res = await owner.req(`/api/projects/${project.id}/tasks`, {
    method: 'POST',
    data: { assigneeId, title, description, priority, dueDate },
  });
  return res.id;
}
const ownerId = (await owner.req('/api/me')).user.id;
const suyuId = (await clients.suyu.req('/api/me')).user.id;
const chenmoId = (await clients.chenmo.req('/api/me')).user.id;
const zhouyeId = (await clients.zhouye.req('/api/me')).user.id;

const t1 = await addTask(ownerId, '整合消费者洞察报告', '合并访谈、桌面研究与竞品信息，输出 8 页以内的洞察摘要，作为策略讨论的共同底稿。', 'high', isoDate(3));
const t2 = await addTask(ownerId, '制作品牌现状数据图表', '整理品牌认知、人群首选率与内容互动数据，形成最终提案中的数据页。', 'medium', isoDate(6));
const t3 = await addTask(ownerId, '品牌资产桌面研究', '梳理品牌现有视觉与内容资产，标注可延续、可优化、应放弃的部分。', 'medium', isoDate(1));
const t4 = await addTask(suyuId, '竞品视觉与内容分析', '选择 4 个直接竞品，分析近半年视觉语言、内容主题和社媒表现，输出视觉对照页。', 'high', isoDate(2));
const t5 = await addTask(suyuId, '社媒内容采样与标签整理', '采样目标人群的真实内容表达，提炼可复用的语气和视觉关键词。', 'medium', isoDate(5));
const t6 = await addTask(chenmoId, '方案主框架搭建', '把洞察、策略、创意与执行串成完整提案结构，并标出每一页的核心结论。', 'high', isoDate(4));
const t7 = await addTask(chenmoId, '设计评审材料准备', '整理周五内部评审需要的方向稿与讨论问题，控制在一页纸。', 'low', isoDate(7));
const t8 = await addTask(zhouyeId, '用户访谈提纲与执行', '补充 3 位目标用户的深访，重点验证「真实感」和「松弛感」的具体行为线索。', 'high', isoDate(2));
const t9 = await addTask(zhouyeId, '竞品用户评论采集', '从社媒与电商评论中采集 100 条有效反馈，按正负向和主题归类。', 'medium', isoDate(6));

const updates = [
  [t1, owner, { status: 'doing', progress: 72, note: '已合并 12 份访谈，结论部分正在重写。还差竞品洞察的最终整合。' }],
  [t2, owner, { status: 'doing', progress: 40, note: '数据清洗完成，正在调整图表叙事顺序。' }],
  [t3, owner, { status: 'done', progress: 100, note: '已完成 23 个品牌资产条目的盘点，结论已补进洞察文档。' }],
  [t4, clients.suyu, { status: 'review', progress: 90, note: '4 个竞品的视觉对照已完成，等待组内确认是否增加海外品牌。' }],
  [t5, clients.suyu, { status: 'doing', progress: 65, note: '内容采样完成，正在把 300 条标签压缩成 6 个关键词。' }],
  [t6, clients.chenmo, { status: 'doing', progress: 55, note: '提案结构完成 9 页，创意部分需要等周四方向确认后再落。' }],
  [t7, clients.chenmo, { status: 'todo', progress: 0, note: '' }],
  [t8, clients.zhouye, { status: 'doing', progress: 30, note: '已访谈 2 位用户，第 3 位改约到周四。访谈提纲已迭代到 v3。' }],
  [t9, clients.zhouye, { status: 'todo', progress: 0, note: '' }],
];
for (const [taskId, client, payload] of updates) {
  if (!payload.note) continue;
  await client.req(`/api/projects/${project.id}/tasks/${taskId}`, { method: 'PATCH', data: payload });
}

await owner.req(`/api/projects/${project.id}/status`, { method: 'POST', data: { workStatus: 'focus', activity: '重写洞察结论，整合竞品分析' } });
await clients.suyu.req(`/api/projects/${project.id}/status`, { method: 'POST', data: { workStatus: 'review', activity: '等待组内确认竞品对照范围' } });
await clients.chenmo.req(`/api/projects/${project.id}/status`, { method: 'POST', data: { workStatus: 'focus', activity: '搭建提案框架与创意推演' } });
await clients.zhouye.req(`/api/projects/${project.id}/status`, { method: 'POST', data: { workStatus: 'blocked', activity: '第 3 位访谈对象时间待确认' } });

await commentToMember(owner, suyuId, '竞品视觉分析已经很有方向了。海外品牌可以先放 1 个，避免信息过载。');
await commentToMember(clients.zhouye, chenmoId, '框架第 4 页的「真实感」定义，我可以补两条访谈原话给你。');
await commentToMember(clients.chenmo, ownerId, '洞察整合需要我帮忙收口吗？我今晚可以一起看结论部分。');
await commentToMember(clients.suyu, zhouyeId, '访谈样本不要着急，质量比数量重要。第 3 位可以约到周末。');

async function commentToMember(client, memberId, content) {
  await client.req(`/api/projects/${project.id}/members/${memberId}/comments`, { method: 'POST', data: { content } });
}

// Use the blue theme for the seeded example when running against a local instance.
if (/^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/.test(base)) {
  try {
    const db = new DatabaseSync(DB_PATH);
    db.prepare('UPDATE projects SET color = 0 WHERE id = ?').run(project.id);
    db.close();
  } catch (error) {
    console.warn('Could not set project theme:', error.message);
  }
}

console.log(JSON.stringify({
  projectId: project.id,
  link: `${base}/p/${project.joinSlug}`,
  projectPassword: PROJECT_PASSWORD,
  login: people.map((p) => ({ username: p.username, displayName: p.displayName })),
  password: PASSWORD,
}, null, 2));

function isoDate(daysFromNow) {
  const d = new Date(Date.now() + daysFromNow * 86400_000);
  return d.toISOString().slice(0, 10);
}

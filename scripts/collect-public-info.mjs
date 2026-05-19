import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(rootDir, 'public/data/public-info.json');
const projectKeywords = [
  '项目',
  '公示',
  '公告',
  '招标',
  '采购',
  '中标',
  '批前',
  '划拨',
  '征收',
  '收回',
  '规划',
  '城市更新',
  '老旧小区',
  '城中村',
  '背街小巷',
  '改造',
  '更新',
  '基础设施',
  '配套设施',
  '停车',
  '一圈两场三改',
  '会议',
  '推进会',
  '调研',
];
const policyKeywords = [
  '政策',
  '通知',
  '办法',
  '意见',
  '方案',
  '规划',
  '会议',
  '推进会',
  '专题会',
  '调研',
  '新闻发布',
  '城市更新',
  '老旧小区',
  '城中村',
  '住建',
  '城镇化',
  '公共服务',
];

function compactText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeId(prefix, text) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `${prefix}-${hash.toString(16)}`;
}

function absoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function extractLinks(html, baseUrl, keywords) {
  const links = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) && links.length < 12) {
    const title = compactText(match[2]);
    if (title.length < 8 || title.length > 120) continue;
    if (!keywords.some((keyword) => title.includes(keyword))) continue;

    links.push({
      title,
      url: absoluteUrl(baseUrl, match[1]),
    });
  }

  return links;
}

async function fetchSource(source, keywords) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 public-info-collector/1.0',
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    return extractLinks(html, source.url, keywords).map((link) => ({
      ...link,
      sourceName: source.name,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function uniqueByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}|${item.sourceUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function projectFromLink(link) {
  return {
    id: makeId('project', `${link.title}${link.url}`),
    title: link.title,
    sourceName: link.sourceName,
    sourceUrl: link.url,
    city: '待识别',
    district: '待识别',
    projectType: '公示线索',
    disclosureDate: new Date().toISOString().slice(0, 10),
    ownerUnit: '待从详情页解析',
    address: '待从详情页解析',
    currentStatus: '每日抓取',
    landUse: '待从详情页解析',
    renewalScope: '待从详情页解析',
    summary: '每日自动抓取到的项目公示线索，已保留原文链接，待详情解析或人工复核。',
    details: [
      { label: '来源页面', value: link.sourceName },
      { label: '采集日期', value: new Date().toISOString().slice(0, 10) },
      { label: '资料状态', value: '已抓取标题和链接，待解析详情页字段' },
    ],
  };
}

function policyFromLink(link) {
  return {
    id: makeId('policy', `${link.title}${link.url}`),
    title: link.title,
    sourceName: link.sourceName,
    sourceUrl: link.url,
    publishDate: new Date().toISOString().slice(0, 10),
    issuingBody: link.sourceName,
    policyLevel: '待识别',
    topic: '政策线索',
    summary: '每日自动抓取到的政策信息，已保留原文链接，待详情解析或人工复核。',
    keyPoints: [
      '已抓取标题和链接。',
      '后续可解析正文提取发布单位、政策主题和适用范围。',
      '可与项目公示类型进行关键词匹配。',
    ],
  };
}

async function main() {
  const seed = JSON.parse(await readFile(dataPath, 'utf8'));
  const projectLinks = (
    await Promise.all(seed.projectSources.map((source) => fetchSource(source, projectKeywords)))
  ).flat();
  const policyLinks = (
    await Promise.all(seed.policySources.map((source) => fetchSource(source, policyKeywords)))
  ).flat();

  const nextInfo = {
    ...seed,
    lastUpdated: new Date().toISOString(),
    projects: uniqueByTitle([
      ...projectLinks.map(projectFromLink),
      ...seed.projects,
    ]).slice(0, 40),
    policies: uniqueByTitle([
      ...policyLinks.map(policyFromLink),
      ...seed.policies,
    ]).slice(0, 40),
  };

  await writeFile(dataPath, `${JSON.stringify(nextInfo, null, 2)}\n`, 'utf8');
  console.log(`Collected ${projectLinks.length} project links and ${policyLinks.length} policy links.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

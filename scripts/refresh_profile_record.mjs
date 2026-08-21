import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const username = argument('--username', process.env.PROFILE_USERNAME || '');
const profileRepo = argument('--profile-repo', process.env.PROFILE_REPOSITORY || '');
const readmePath = argument('--readme', 'README.md');
const visitorPageId = argument('--visitor-page-id', `${username}.${username}`);
const visitorHistoryPath = argument('--visitor-history', 'data/visitor-activity.json');
const visitorHeatmapPath = argument('--visitor-heatmap', 'assets/visitor-activity-heatmap.svg');
const token = process.env.GITHUB_TOKEN;

if (!username || !profileRepo) {
  throw new Error('Pass --username and --profile-repo, or set PROFILE_USERNAME and PROFILE_REPOSITORY.');
}

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function request(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API request failed (${response.status}) for ${path}`);
  return response.json();
}

function replaceRecord(readme, replacement) {
  const marker = /<!-- PROFILE_RECORD:START -->[\s\S]*?<!-- PROFILE_RECORD:END -->/;
  if (!marker.test(readme)) throw new Error(`Missing PROFILE_RECORD markers in ${readmePath}.`);
  return readme.replace(marker, replacement);
}

function countLanguages(repositories) {
  return repositories.reduce((counts, repository) => {
    if (!repository.language) return counts;
    counts.set(repository.language, (counts.get(repository.language) || 0) + 1);
    return counts;
  }, new Map());
}

function leadingLanguage(languageCounts) {
  const [language, count] = [...languageCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || ['—', 0];
  return { language, count };
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function readVisitorHistory(path) {
  if (!existsSync(path)) {
    return {
      schemaVersion: 1,
      source: 'https://visitor-badge.laobi.icu/',
      samples: [],
    };
  }
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return {
    schemaVersion: 1,
    source: data.source || 'https://visitor-badge.laobi.icu/',
    samples: Array.isArray(data.samples) ? data.samples : [],
  };
}

async function readVisitorCounter(pageId) {
  const url = `https://visitor-badge.laobi.icu/badge?page_id=${encodeURIComponent(pageId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Visitor counter request failed (${response.status}).`);
  const svg = await response.text();
  const values = [...svg.matchAll(/<text[^>]*>(\d+)<\/text>/g)].map((match) => Number(match[1]));
  if (!values.length) throw new Error('Visitor counter total was not found in the SVG response.');
  return Math.max(...values);
}

function updateVisitorHistory(history, total, date) {
  const samples = history.samples.filter((sample) => sample && /^\d{4}-\d{2}-\d{2}$/.test(sample.date) && Number.isFinite(sample.total));
  const existingIndex = samples.findIndex((sample) => sample.date === date);
  const earlier = samples.filter((sample) => sample.date < date).sort((a, b) => a.date.localeCompare(b.date));
  const previous = earlier.at(-1);
  const sample = {
    date,
    total,
    daily: previous ? Math.max(total - previous.total, 0) : null,
  };
  if (existingIndex >= 0) samples[existingIndex] = sample;
  else samples.push(sample);
  return {
    ...history,
    samples: samples.sort((a, b) => a.date.localeCompare(b.date)).slice(-180),
  };
}

function heatmapDates(endDate, count = 56) {
  const end = new Date(`${endDate}T00:00:00.000Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (count - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

function heatmapColor(sample) {
  if (!sample) return '#161B22';
  if (sample.daily === null) return '#30363D';
  if (sample.daily === 0) return '#0B1120';
  if (sample.daily === 1) return '#1F3A4C';
  if (sample.daily <= 3) return '#2F5E78';
  return '#64C8FF';
}

function renderVisitorHeatmap(history, endDate) {
  const byDate = new Map(history.samples.map((sample) => [sample.date, sample]));
  const cells = heatmapDates(endDate).map((date, index) => {
    const sample = byDate.get(date);
    const weeklyColumn = Math.floor(index / 7);
    const weekdayRow = index % 7;
    const x = 92 + weeklyColumn * 13;
    const y = 36 + weekdayRow * 13;
    const label = !sample
      ? `${date}: waiting for a daily visitor sample`
      : sample.daily === null
        ? `${date}: initial total ${sample.total}; no prior day available`
        : `${date}: ${sample.daily} visits since the prior observed day (total ${sample.total})`;
    return `<rect x="${x}" y="${y}" width="9" height="9" rx="2" fill="${heatmapColor(sample)}"><title>${label}</title></rect>`;
  }).join('');
  const observed = history.samples.length;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="142" viewBox="0 0 220 142" role="img" aria-labelledby="title desc">',
    '<title id="title">Visitor activity heatmap</title>',
    '<desc id="desc">Daily visitor-counter samples collected after the heatmap is activated. Empty cells have not yet been sampled.</desc>',
    '<rect width="220" height="142" rx="10" fill="#0B1120"/>',
    '<rect x="0.5" y="0.5" width="219" height="141" rx="9.5" fill="none" stroke="#30363D"/>',
    '<text x="14" y="21" fill="#E6EDF3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="700">VISITOR ACTIVITY / DAILY SAMPLES</text>',
    `<text x="14" y="130" fill="#8B949E" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="8">OBSERVED DAYS ${observed} · HISTORY STARTS ON ACTIVATION</text>`,
    '<text x="14" y="42" fill="#8B949E" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="7">LOW</text>',
    '<text x="14" y="55" fill="#8B949E" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="7">···</text>',
    '<text x="14" y="120" fill="#64C8FF" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="7">HIGH</text>',
    cells,
    '</svg>',
  ].join('');
}

const account = await request(`/users/${encodeURIComponent(username)}`);
const repositories = await request(`/users/${encodeURIComponent(username)}/repos?type=owner&per_page=100&sort=updated`);
const publicStars = repositories.reduce((total, repository) => total + (repository.stargazers_count || 0), 0);
const language = leadingLanguage(countLanguages(repositories));
const refreshedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
const sampleDate = new Date().toISOString().slice(0, 10);
let visitorHistory = readVisitorHistory(visitorHistoryPath);
try {
  visitorHistory = updateVisitorHistory(visitorHistory, await readVisitorCounter(visitorPageId), sampleDate);
} catch (error) {
  console.warn(`Visitor sample unavailable: ${error.message}`);
}
ensureParent(visitorHistoryPath);
ensureParent(visitorHeatmapPath);
writeFileSync(visitorHistoryPath, `${JSON.stringify(visitorHistory, null, 2)}\n`);
writeFileSync(visitorHeatmapPath, renderVisitorHeatmap(visitorHistory, sampleDate));

const record = [
  '<!-- PROFILE_RECORD:START -->',
  '| `PUBLIC SIGNAL` | `CURRENT RECORD` |',
  '|---|---:|',
  `| Repositories | [\`${account.public_repos}\`](https://github.com/${username}?tab=repositories) |`,
  `| Stars across public repositories | \`${publicStars}\` |`,
  `| Followers / following | \`${account.followers} / ${account.following}\` |`,
  `| Leading repository language | \`${language.language} · ${language.count} projects\` |`,
  `| Visitor days observed | \`${visitorHistory.samples.length}\` · starts from activation |`,
  `| Account established | \`${account.created_at.slice(0, 10)}\` |`,
  `| Last record refresh | \`${refreshedAt} UTC\` |`,
  '<!-- PROFILE_RECORD:END -->',
].join('\n');

const readme = readFileSync(readmePath, 'utf8');
writeFileSync(readmePath, replaceRecord(readme, record));
console.log(`Refreshed bounded profile record in ${readmePath} for @${username}.`);

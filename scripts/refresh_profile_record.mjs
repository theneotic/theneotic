import { readFileSync, writeFileSync } from 'node:fs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const username = argument('--username', process.env.PROFILE_USERNAME || '');
const profileRepo = argument('--profile-repo', process.env.PROFILE_REPOSITORY || '');
const readmePath = argument('--readme', 'README.md');
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

const account = await request(`/users/${encodeURIComponent(username)}`);
const repositories = await request(`/users/${encodeURIComponent(username)}/repos?type=owner&per_page=100&sort=updated`);
const publicStars = repositories.reduce((total, repository) => total + (repository.stargazers_count || 0), 0);
const language = leadingLanguage(countLanguages(repositories));
const refreshedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

const record = [
  '<!-- PROFILE_RECORD:START -->',
  '| `PUBLIC SIGNAL` | `CURRENT RECORD` |',
  '|---|---:|',
  `| Repositories | [\`${account.public_repos}\`](https://github.com/${username}?tab=repositories) |`,
  `| Stars across public repositories | \`${publicStars}\` |`,
  `| Followers / following | \`${account.followers} / ${account.following}\` |`,
  `| Leading repository language | \`${language.language} · ${language.count} projects\` |`,
  `| Account established | \`${account.created_at.slice(0, 10)}\` |`,
  `| Last record refresh | \`${refreshedAt} UTC\` |`,
  '<!-- PROFILE_RECORD:END -->',
].join('\n');

const readme = readFileSync(readmePath, 'utf8');
writeFileSync(readmePath, replaceRecord(readme, record));
console.log(`Refreshed bounded profile record in ${readmePath} for @${username}.`);

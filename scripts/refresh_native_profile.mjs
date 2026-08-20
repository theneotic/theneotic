import { execFileSync } from 'node:child_process';
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

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const clean = (value) => String(value).replace(/[|\r\n]/g, ' ').replace(/`/g, '\\`').trim();
const apiHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...apiHeaders, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json();
}

function replaceSection(content, name, replacement) {
  const marker = new RegExp(`<!-- ${name}:START -->[\\s\\S]*?<!-- ${name}:END -->`);
  if (!marker.test(content)) throw new Error(`Missing ${name} markers in ${readmePath}.`);
  return content.replace(marker, replacement);
}

function sourceCommit() {
  const refreshSubject = 'chore: refresh native profile record';
  const commits = git(['log', '--format=%H%x1f%s%x1f%cI']).split('\n').filter(Boolean).map((line) => {
    const [hash, subject, timestamp] = line.split('\x1f');
    return { hash, subject: clean(subject), timestamp };
  });
  const source = commits.find((commit) => commit.subject !== refreshSubject) || commits[0];
  return { ...source, count: commits.filter((commit) => commit.subject !== refreshSubject).length };
}

function renderStatus() {
  const source = sourceCommit();
  const shortHash = source.hash.slice(0, 7);
  return [
    '<!-- PROFILE_STATUS:START -->',
    '> **State:** `BUILDING IN PUBLIC`  ',
    '> **Mode:** `NATIVE / LINKED / COMMIT-REFRESHED`  ',
    `> **Profile source commits:** \`${source.count}\`  `,
    `> **Latest source change:** [\`${shortHash}\`](https://github.com/${profileRepo}/commit/${shortHash}) — ${source.subject}  `,
    `> **Source change recorded at:** \`${source.timestamp}\`  `,
    `> **Refreshed from:** [main](https://github.com/${profileRepo}/commits/main)`,
    '<!-- PROFILE_STATUS:END -->',
  ].join('\n');
}

function eventLabel(event) {
  const labels = {
    CreateEvent: 'Created repository or branch',
    DeleteEvent: 'Deleted branch or tag',
    ForkEvent: 'Forked repository',
    IssuesEvent: 'Worked on issue',
    IssueCommentEvent: 'Added issue discussion',
    PullRequestEvent: 'Worked on pull request',
    PushEvent: 'Pushed code',
    ReleaseEvent: 'Published release',
    WatchEvent: 'Starred repository',
  };
  return labels[event.type] || clean(event.type.replace(/Event$/, ' activity'));
}

async function renderActivity() {
  let events = [];
  try {
    events = await request(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`);
  } catch (error) {
    console.warn(`Recent activity unavailable: ${error.message}`);
  }
  const refreshSubject = 'chore: refresh native profile record';
  const relevantEvents = events.filter((event) => {
    const messages = event.payload?.commits?.map((commit) => commit.message) || [];
    const isManagedProfileRefresh = event.type === 'PushEvent'
      && event.repo?.name === profileRepo
      && messages.length > 0
      && messages.every((message) => message === refreshSubject);
    return !isManagedProfileRefresh;
  });
  const rows = relevantEvents.slice(0, 5).map((event) => {
    const date = new Date(event.created_at).toISOString().slice(0, 10);
    const repo = clean(event.repo?.name || 'public repository');
    return `| ${date} | ${eventLabel(event)} | [${repo}](https://github.com/${repo}) |`;
  });
  if (!rows.length) rows.push('| — | No public event available yet | — |');
  return [
    '<!-- PROFILE_ACTIVITY:START -->',
    '| When (UTC) | Event | Repository |',
    '|---|---|---|',
    ...rows,
    '<!-- PROFILE_ACTIVITY:END -->',
  ].join('\n');
}

function calculateRuns(days) {
  let current = 0;
  for (let index = days.length - 1; index >= 0 && days[index].contributionCount > 0; index -= 1) current += 1;
  let longest = 0;
  let active = 0;
  for (const day of days) {
    active = day.contributionCount > 0 ? active + 1 : 0;
    longest = Math.max(longest, active);
  }
  const lastActive = [...days].reverse().find((day) => day.contributionCount > 0)?.date || '—';
  return { current, longest, lastActive };
}

async function renderStreak() {
  if (!token) {
    return [
      '<!-- PROFILE_STREAK:START -->',
      '> **Current public day run:** `Unavailable until GITHUB_TOKEN is provided`  ',
      '> **Longest public day run:** `Unavailable`  ',
      '> **Last active day:** `Unavailable`',
      '<!-- PROFILE_STREAK:END -->',
    ].join('\n');
  }
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 364);
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`;
  try {
    const response = await request('https://api.github.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }),
    });
    if (response.errors?.length) throw new Error(response.errors[0].message);
    const days = response.data.user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays);
    const { current, longest, lastActive } = calculateRuns(days);
    return [
      '<!-- PROFILE_STREAK:START -->',
      `> **Current public day run:** \`${current} days\`  `,
      `> **Longest public day run (last 365 days):** \`${longest} days\`  `,
      `> **Last active day:** \`${lastActive}\``,
      '<!-- PROFILE_STREAK:END -->',
    ].join('\n');
  } catch (error) {
    console.warn(`Public contribution tempo unavailable: ${error.message}`);
    return [
      '<!-- PROFILE_STREAK:START -->',
      '> **Current public day run:** `Temporarily unavailable`  ',
      '> **Longest public day run:** `Temporarily unavailable`  ',
      '> **Last active day:** `Temporarily unavailable`',
      '<!-- PROFILE_STREAK:END -->',
    ].join('\n');
  }
}

let readme = readFileSync(readmePath, 'utf8');
readme = replaceSection(readme, 'PROFILE_STATUS', renderStatus());
readme = replaceSection(readme, 'PROFILE_ACTIVITY', await renderActivity());
readme = replaceSection(readme, 'PROFILE_STREAK', await renderStreak());
writeFileSync(readmePath, readme);
console.log(`Refreshed ${readmePath} for @${username}.`);

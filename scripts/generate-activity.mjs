import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const username = process.env.PROFILE_USERNAME || "theneotic";
const token = process.env.GITHUB_TOKEN;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(scriptDirectory, "..", "assets", "daily-activity.svg");

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

function eventLabel(event) {
  const labels = {
    CreateEvent: "Created a repository or branch",
    DeleteEvent: "Removed a repository branch or tag",
    ForkEvent: "Forked a repository",
    IssuesEvent: "Worked on an issue",
    IssueCommentEvent: "Added an issue discussion",
    PullRequestEvent: "Worked on a pull request",
    PushEvent: "Pushed code",
    ReleaseEvent: "Published a release",
    WatchEvent: "Starred a repository",
  };
  return labels[event.type] || event.type.replace(/Event$/, " activity");
}

function renderPanel({ profile, events, generatedAt }) {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const eventsToday = events.filter((event) => Date.parse(event.created_at) >= oneDayAgo).length;
  const eventsWeek = events.filter((event) => Date.parse(event.created_at) >= oneWeekAgo).length;
  const recentEvent = events[0];
  const latestAction = recentEvent
    ? `${eventLabel(recentEvent)} · ${recentEvent.repo?.name || "public repository"}`
    : "No public event available yet";
  const publicRepos = profile.public_repos ?? 0;
  const followers = profile.followers ?? 0;
  const chartBars = Array.from({ length: 14 }, (_, index) => {
    const dayStart = Date.now() - (13 - index) * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = events.filter((event) => {
      const time = Date.parse(event.created_at);
      return time >= dayStart && time < dayEnd;
    }).length;
    const height = Math.max(8, Math.min(52, count * 12));
    const x = 700 + index * 26;
    return `<rect x="${x}" y="${157 - height}" width="14" height="${height}" rx="7" fill="${count > 0 ? "#9ed3ff" : "#405174"}" opacity="${count > 0 ? "0.95" : "0.45"}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="210" viewBox="0 0 1200 210" role="img" aria-labelledby="title"><title id="title">${escapeXml(username)} daily GitHub activity</title><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0a0d15"/><stop offset="1" stop-color="#14203b"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="1200" height="210" rx="20" fill="url(#bg)"/><rect x="1" y="1" width="1198" height="208" rx="19" fill="none" stroke="#405174"/><text x="54" y="48" fill="#9ed3ff" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="3">OWNED DAILY PANEL / REFRESHED FROM PUBLIC GITHUB DATA</text><text x="54" y="92" fill="#f2f5ff" font-family="Georgia,serif" font-size="25" font-weight="700">${escapeXml(latestAction)}</text><text x="54" y="124" fill="#b5c2e3" font-family="Arial,sans-serif" font-size="15">${escapeXml(username)} · ${publicRepos} public repositories · ${followers} followers</text><text x="54" y="158" fill="#cbb6ff" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">${eventsToday} PUBLIC EVENTS / 24H</text><line x1="650" y1="158" x2="1084" y2="158" stroke="#405174"/><g filter="url(#g)">${chartBars}</g><text x="700" y="186" fill="#8ca0ca" font-family="Arial,sans-serif" font-size="11" letter-spacing="1">${eventsWeek} EVENTS / LAST 7 DAYS</text><text x="1050" y="186" fill="#8ca0ca" font-family="Arial,sans-serif" font-size="11">${escapeXml(generatedAt)}</text></svg>`;
}

try {
  const [profile, events] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`),
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`),
  ]);
  const generatedAt = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date()).toUpperCase();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderPanel({ profile, events, generatedAt }), "utf8");
  console.log(`Updated ${path.relative(process.cwd(), outputPath)} for @${username}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

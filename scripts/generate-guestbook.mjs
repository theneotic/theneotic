import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.argv[2] ?? "assets/guestbook/recent-signatures.svg";
const repository = process.env.GITHUB_REPOSITORY ?? "theneotic/theneotic";
const token = process.env.GITHUB_TOKEN;

const escapeXml = (value = "") => value.replace(/[<>&'\"]/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;",
}[character]));

const field = (body = "", heading) => {
  const expression = new RegExp(`### ${heading}\\n\\n([\\s\\S]*?)(?=\\n### |$)`, "i");
  const match = body.match(expression);
  return match?.[1]?.trim().replace(/\n+/g, " ") ?? "";
};

let issues = [];
try {
  const response = await fetch(`https://api.github.com/repos/${repository}/issues?state=open&labels=guestbook-approved&per_page=3&sort=created&direction=desc`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.ok) issues = await response.json();
} catch {
  issues = [];
}

const entries = issues.slice(0, 3).map((issue, index) => {
  const name = escapeXml(field(issue.body, "Display name") || issue.user?.login || "Guest").slice(0, 42);
  const location = escapeXml(field(issue.body, "Location or role")).slice(0, 52);
  const note = escapeXml(field(issue.body, "Leave a note")).slice(0, 112);
  const y = 92 + index * 64;
  return `<g transform="translate(0 ${y})"><circle cx="42" cy="0" r="5" fill="#fb8b7a"/><text x="60" y="-5" fill="#e9efff" font-family="Georgia,serif" font-size="18" font-weight="700">${name}</text><text x="60" y="16" fill="#8ea3d4" font-family="ui-monospace,monospace" font-size="10" letter-spacing="1">${location || "GUESTBOOK ENTRY"}</text><text x="60" y="38" fill="#cbd5e1" font-family="ui-sans-serif,system-ui" font-size="13">${note}</text><line x1="32" y1="54" x2="928" y2="54" stroke="#233150"/></g>`;
}).join("");

const body = entries || `<g transform="translate(0 118)"><circle cx="42" cy="0" r="5" fill="#a78bfa"/><text x="60" y="-4" fill="#e9efff" font-family="Georgia,serif" font-size="19" font-weight="700">The ledger is open.</text><text x="60" y="22" fill="#a8b8e8" font-family="ui-sans-serif,system-ui" font-size="14">Be the first approved signature in the midnight guestbook.</text></g>`;
const height = entries ? 300 : 210;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" role="img" aria-labelledby="title desc"><title id="title">Recent approved guestbook signatures</title><desc id="desc">A midnight-gothic guestbook panel generated from approved public GitHub issues.</desc><defs><linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#070b14"/><stop offset="1" stop-color="#111b31"/></linearGradient></defs><rect width="960" height="${height}" rx="22" fill="url(#ink)"/><rect x="1" y="1" width="958" height="${height - 2}" rx="21" fill="none" stroke="#334155"/><path d="M0 48 C130 18 218 80 342 48 S600 17 960 44" fill="none" stroke="#5967aa" stroke-opacity=".38"/><text x="32" y="42" fill="#e9efff" font-family="Georgia,serif" font-size="23" font-weight="700" letter-spacing="2">RECENT SIGNATURES</text><text x="770" y="41" fill="#8ea3d4" font-family="ui-monospace,monospace" font-size="10" letter-spacing="2">APPROVED LEDGER</text>${body}</svg>`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg, "utf8");

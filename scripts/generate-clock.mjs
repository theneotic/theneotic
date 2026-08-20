import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.argv[2] ?? "assets/instruments/ist-clock.svg";
const timeZone = "Asia/Kolkata";
const now = new Date();

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
}).formatToParts(now).reduce((all, part) => ({ ...all, [part.type]: part.value }), {});

const hour = Number(parts.hour);
const minute = Number(parts.minute);
const second = Number(parts.second);
const hand = (angle, length, width, color) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  const x = 176 + Math.cos(radians) * length;
  const y = 160 + Math.sin(radians) * length;
  return `<line x1="176" y1="160" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;
};

const title = "THE / NEOTIC";
const date = `${parts.weekday.toUpperCase()} · ${parts.day} ${parts.month.toUpperCase()} ${parts.year}`;
const time = `${parts.hour}:${parts.minute}:${parts.second}`;
const hourAngle = (hour % 12) * 30 + minute * 0.5;
const minuteAngle = minute * 6 + second * 0.1;
const secondAngle = second * 6;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="320" viewBox="0 0 960 320" role="img" aria-labelledby="title desc">
  <title id="title">${title} — Indian Standard Time</title>
  <desc id="desc">A midnight gothic instrument clock refreshed from the profile repository.</desc>
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#070b14"/><stop offset="1" stop-color="#10182a"/></linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3f6ff"/><stop offset=".45" stop-color="#a8b8e8"/><stop offset="1" stop-color="#7b6cae"/></linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="960" height="320" rx="24" fill="url(#ink)"/>
  <rect x="1" y="1" width="958" height="318" rx="23" fill="none" stroke="#334155"/>
  <path d="M0 72 C115 46 180 100 276 74 S438 46 528 75 S704 101 960 54" fill="none" stroke="#314b95" stroke-opacity=".38"/>
  <path d="M0 262 C125 232 196 285 310 254 S502 232 610 260 S808 278 960 232" fill="none" stroke="#a78bfa" stroke-opacity=".34"/>
  <circle cx="176" cy="160" r="116" fill="#0b1120" stroke="url(#silver)" stroke-width="2"/>
  <circle cx="176" cy="160" r="98" fill="none" stroke="#53659b" stroke-opacity=".55"/>
  <circle cx="176" cy="160" r="76" fill="none" stroke="#334155" stroke-dasharray="2 10"/>
  <g stroke="#dbeafe" stroke-opacity=".7">${Array.from({ length: 12 }, (_, index) => { const angle = ((index * 30 - 90) * Math.PI) / 180; const x1 = 176 + Math.cos(angle) * 92; const y1 = 160 + Math.sin(angle) * 92; const x2 = 176 + Math.cos(angle) * 82; const y2 = 160 + Math.sin(angle) * 82; return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke-width="${index % 3 === 0 ? 2 : 1}" />`; }).join("")}</g>
  ${hand(hourAngle, 48, 6, "#dbeafe")}
  ${hand(minuteAngle, 68, 4, "#a78bfa")}
  ${hand(secondAngle, 80, 2, "#fb8b7a")}
  <circle cx="176" cy="160" r="8" fill="#fb8b7a"/><circle cx="176" cy="160" r="3" fill="#070b14"/>
  <text x="342" y="96" fill="url(#silver)" font-size="31" font-family="Georgia, 'Times New Roman', serif" font-weight="700" letter-spacing="7">${title}</text>
  <text x="344" y="130" fill="#93c5fd" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" letter-spacing="3">MIDNIGHT INSTRUMENT / IST</text>
  <text x="342" y="205" fill="#f4f7ff" font-size="62" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" letter-spacing="4">${time}</text>
  <text x="346" y="239" fill="#a8b8e8" font-size="13" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" letter-spacing="2">${date}</text>
  <circle cx="856" cy="83" r="6" fill="#fb8b7a" filter="url(#soft)"/><circle cx="856" cy="83" r="3" fill="#fb8b7a"/>
  <text x="770" y="271" fill="#64748b" font-size="10" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" letter-spacing="2">REFRESHES EVERY 15 MIN</text>
</svg>`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg, "utf8");

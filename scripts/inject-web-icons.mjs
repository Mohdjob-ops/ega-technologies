import { readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../dist/index.html", import.meta.url);
const marker = '<link rel="icon" href="/favicon.ico" />';
const iconLinks = `${marker}
<link rel="manifest" href="/manifest.json?v=20260825" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=20260825" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Elmi Guray Academy" />`;

const original = await readFile(indexPath, "utf8");

if (!original.includes(marker)) {
  throw new Error("Could not find the generated favicon link in dist/index.html");
}

const updated = original.replace(marker, iconLinks);
await writeFile(indexPath, updated);

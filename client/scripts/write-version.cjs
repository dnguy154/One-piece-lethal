const fs = require("fs");
const path = require("path");

const version =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  `local-${Date.now()}`;

const shortVersion = version.slice(0, 12);

const publicDir = path.join(process.cwd(), "public");
const srcGeneratedDir = path.join(process.cwd(), "src", "generated");

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(srcGeneratedDir, { recursive: true });

fs.writeFileSync(
  path.join(publicDir, "app-version.json"),
  JSON.stringify({ version: shortVersion }, null, 2)
);

fs.writeFileSync(
  path.join(srcGeneratedDir, "appVersion.js"),
  `export const CURRENT_APP_VERSION = "${shortVersion}";\n`
);

console.log(`App version written: ${shortVersion}`);
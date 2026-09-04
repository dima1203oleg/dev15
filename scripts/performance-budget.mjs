import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const assetsDirectory = join(process.cwd(), 'dist', 'assets');
const assets = readdirSync(assetsDirectory);
const mainJavaScript = assets
  .filter((name) => /^index-[^/]+\.js$/.test(name))
  .map((name) => ({ name, bytes: statSync(join(assetsDirectory, name)).size }));

if (mainJavaScript.length !== 1) {
  throw new Error(`Expected exactly one main JavaScript asset, found ${mainJavaScript.length}.`);
}

const budgets = [
  { label: 'main JavaScript', bytes: mainJavaScript[0].bytes, limit: 450 * 1024 },
  {
    label: 'main CSS',
    bytes: assets.filter((name) => /^index-[^/]+\.css$/.test(name)).reduce((total, name) => total + statSync(join(assetsDirectory, name)).size, 0),
    limit: 200 * 1024,
  },
];

for (const budget of budgets) {
  const status = budget.bytes <= budget.limit ? 'PASS' : 'FAIL';
  console.log(`${status} ${budget.label}: ${(budget.bytes / 1024).toFixed(1)} KiB / ${(budget.limit / 1024).toFixed(0)} KiB`);
  if (status === 'FAIL') process.exitCode = 1;
}

/**
 * Copy MapLibre's worker bundle into public/ so the tracking map can load it
 * from our own origin.
 *
 * maplibre-gl ships a single entry (dist/maplibre-gl.js) whose worker is
 * created as `new Worker(config.WORKER_URL)`, with WORKER_URL empty until
 * `setWorkerUrl()` is called. Left unset, the browser resolves "" to the
 * current document and tries to run the page's own HTML as a script — the map
 * then renders an empty canvas, never fires `load`, and never requests a tile.
 *
 * Bundling the worker through webpack instead is the other option, and the one
 * that produced that failure. Serving a copied file is boring and version-safe:
 * this runs before `dev` and before `build`, so the served worker is always the
 * one from the installed package. The copy is generated, not committed.
 */

import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const source = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', 'maplibre-gl-csp-worker.js');
const targetDir = join(root, 'public', 'vendor');
const target = join(targetDir, 'maplibre-gl-worker.js');

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);

const { version } = require('maplibre-gl/package.json');
console.log(`[maplibre] worker ${version} → public/vendor/maplibre-gl-worker.js`);

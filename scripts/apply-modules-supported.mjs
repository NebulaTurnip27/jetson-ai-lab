/**
 * One-off: add supported_inference_engines[].modules_supported from minimum_jetson.
 * Skips nemotron-3-nano-30b-a3b.md (uses serving.entries with hand-tuned lists).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '..', 'src', 'content', 'models');

const ALL = ['thor_t5000', 'thor_t4000', 'orin_agx_64', 'orin_nx_16', 'orin_nano_8'];
const NX_UP = ['thor_t5000', 'thor_t4000', 'orin_agx_64', 'orin_nx_16'];
const AGX_UP = ['thor_t5000', 'thor_t4000', 'orin_agx_64'];
const THOR_ONLY = ['thor_t5000', 'thor_t4000'];

function modulesForMinimumJetson(mj) {
	const s = (mj || '').trim().toLowerCase();
	if (s.includes('nano')) return ALL;
	if (s.includes('nx')) return NX_UP;
	if (s === 'thor' || (s.includes('thor') && !s.includes('orin'))) return THOR_ONLY;
	if (s.includes('agx')) return AGX_UP;
	if (s.includes('jetson orin')) return ALL;
	return ALL;
}

function yamlList(ids) {
	const lines = ids.map((id) => `      - ${id}`);
	return `    modules_supported:\n${lines.join('\n')}`;
}

const COMMENT =
	'# Optional: gray tabs via matrix_modules_disabled. Per-engine allowlists: supported_inference_engines[].modules_supported (from minimum_jetson).';

function processFile(filePath) {
	const base = path.basename(filePath);
	if (base === 'nemotron-3-nano-30b-a3b.md') return { skipped: true, reason: 'serving.entries hand-tuned' };

	let text = fs.readFileSync(filePath, 'utf8');
	if (!text.includes('supported_inference_engines:')) return { skipped: true, reason: 'no supported_inference_engines' };
	if (text.includes('modules_supported:')) return { skipped: true, reason: 'already has modules_supported' };

	const mjMatch = text.match(/^minimum_jetson:\s*"([^"]*)"/m);
	if (!mjMatch) return { skipped: true, reason: 'no minimum_jetson' };
	const ids = modulesForMinimumJetson(mjMatch[1]);
	const inject = yamlList(ids);

	// Comment after minimum_jetson line (once)
	if (!text.includes('supported_inference_engines[].modules_supported')) {
		text = text.replace(/^(minimum_jetson:\s*"[^"]*")\s*$/m, `$1\n${COMMENT}`);
	}

	// Split engine list: blocks start with "  - engine:"
	const m = text.match(/supported_inference_engines:\r?\n/);
	if (!m || m.index === undefined) return { skipped: true, reason: 'parse error' };
	const i = m.index;
	const markerLen = m[0].length;
	const before = text.slice(0, i + markerLen);
	let body = text.slice(i + markerLen);
	const endM = body.match(/\r?\n---\r?\n/);
	const endBody = endM && endM.index !== undefined ? endM.index : -1;
	const rest = endBody === -1 ? '' : body.slice(endBody);
	if (endBody !== -1) body = body.slice(0, endBody);

	const blocks = body.split(/(?=^  - engine:)/m);
	const outBlocks = blocks.map((block) => {
		if (!block.trim()) return block;
		if (block.includes('modules_supported:')) return block;
		return block.replace(/^(    type:\s*[^\n]+\n)/m, `$1${inject}\n`);
	});

	const newText = before + outBlocks.join('') + rest;
	fs.writeFileSync(filePath, newText, 'utf8');
	return { skipped: false, ids: ids.length };
}

const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.md'));
const results = [];
for (const f of files) {
	const r = processFile(path.join(modelsDir, f));
	results.push({ f, ...r });
}
console.log(results.map((x) => `${x.f}: ${x.skipped ? `skip (${x.reason})` : `ok (${x.ids} modules)`}`).join('\n'));

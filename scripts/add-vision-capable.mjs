/**
 * One-off: insert vision_capable after type: in each model front matter.
 * Re-run only if you reset files; skips when vision_capable already present.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '..', 'src', 'content', 'models');

/** Explicit per slug (authoritative). */
const VISION_BY_SLUG = {
	'cosmos-reason1-7b': true,
	'cosmos-reason2-2b': true,
	'cosmos-reason2-8b': true,
	'functiongemma': false,
	'gemma3-12b': true,
	'gemma3-1b': true,
	'gemma3-270m': false,
	'gemma3-27b': true,
	'gemma3-4b': true,
	'gpt-oss-120b': false,
	'gpt-oss-20b': false,
	'llama3-1-70b': false,
	'llama3-1-8b': false,
	'llama3-2-3b': false,
	'ministral3-14b-instruct': true,
	'ministral3-14b-reasoning': true,
	'ministral3-3b-instruct': true,
	'ministral3-3b-reasoning': true,
	'ministral3-8b-instruct': true,
	'ministral3-8b-reasoning': true,
	'nemotron-3-nano-30b-a3b': false,
	'nemotron-nano-12b-vl': true,
	'nemotron-nano-9b-v2': false,
	'nemotron3-nano-4b': false,
	'qwen3-30b-a3b': false,
	'qwen3-32b': false,
	'qwen3-4b': false,
	'qwen3-5-0-8b': true,
	'qwen3-5-27b': false,
	'qwen3-5-35b-a3b': false,
	'qwen3-5-4b': true,
	'qwen3-5-9b': true,
	'qwen3-8b': false,
	'qwen3-vl-4b': true,
	'qwen3-vl-8b': true,
};

function processFile(filePath) {
	const slug = path.basename(filePath, '.md');
	const value = VISION_BY_SLUG[slug];
	if (value === undefined) {
		throw new Error(`Missing vision_capable mapping for ${slug}`);
	}
	let text = fs.readFileSync(filePath, 'utf8');
	if (/^vision_capable:\s/m.test(text.split('---')[1] || '')) {
		return { slug, skipped: true };
	}
	const replaced = text.replace(
		/^type:\s*"[^"]+"\s*$/m,
		(m) => `${m}\nvision_capable: ${value}`,
	);
	if (replaced === text) {
		throw new Error(`No type: line to anchor vision_capable in ${slug}`);
	}
	fs.writeFileSync(filePath, replaced, 'utf8');
	return { slug, skipped: false };
}

const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.md'));
for (const f of files) {
	console.log(processFile(path.join(modelsDir, f)));
}

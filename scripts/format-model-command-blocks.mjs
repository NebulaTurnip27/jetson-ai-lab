/**
 * Convert quoted run_command_*, run_command, install_command to YAML |+ blocks
 * with shell-style continuations (matches nemotron / ministral 14b instruct style).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '..', 'src', 'content', 'models');

const KEYS = new Set([
	'serve_command_orin',
	'serve_command_thor',
	'run_command_orin',
	'run_command_thor',
	'run_command',
	'install_command',
]);

/** Extract "..." value after `key: "` handling \" escapes */
function parseDoubleQuotedScalar(line, keyMatchEnd) {
	let i = keyMatchEnd;
	let val = '';
	let escaped = false;
	for (; i < line.length; i++) {
		const c = line[i];
		if (escaped) {
			val += c;
			escaped = false;
			continue;
		}
		if (c === '\\') {
			escaped = true;
			continue;
		}
		if (c === '"') return { value: val, restStart: i + 1 };
		val += c;
	}
	return null;
}

function finishVolumesImageTail(lines, rest) {
	const volRe = /^(-v\s+\S+:\S+(?::ro)?)\s+/;
	let r = rest;
	let m;
	while ((m = r.match(volRe))) {
		lines.push(`  ${m[1]} \\`);
		r = r.slice(m[0].length);
	}
	const markers = [
		{ idx: r.indexOf(' vllm serve '), word: 'vllm serve ' },
		{ idx: r.indexOf(' llama-server '), word: 'llama-server ' },
		{ idx: r.indexOf(' bash -c '), word: 'bash -c ' },
	];
	let best = -1;
	let word = '';
	for (const { idx, word: w } of markers) {
		if (idx >= 0 && (best < 0 || idx < best)) {
			best = idx;
			word = w;
		}
	}
	if (best < 0) return null;
	const image = r.slice(0, best).trim();
	const tail = r.slice(best).trimStart();
	lines.push(`  ${image} \\`);
	lines.push(...formatCommandTail(tail));
	return lines.join('\n');
}

function formatCommandTail(tail) {
	if (tail.length <= 130) return [`  ${tail}`];
	const vllm = tail.match(/^(vllm serve\s+\S+)\s+(.+)$/);
	if (vllm) {
		const [, head, args] = vllm;
		if (args.length < 50) return [`  ${tail}`];
		const chunks = args.split(/\s+(?=--)/).map((c) => c.trim()).filter(Boolean);
		if (chunks.length <= 1) return [`  ${tail}`];
		const out = [`  ${head} \\`];
		for (let i = 0; i < chunks.length; i++) {
			const cont = i < chunks.length - 1 ? ' \\' : '';
			out.push(`    ${chunks[i]}${cont}`);
		}
		return out;
	}
	const llama = tail.match(/^llama-server\s+(.+)$/);
	if (llama) {
		const args = llama[1];
		if (args.length < 80) return [`  ${tail}`];
		const chunks = args.split(/\s+(?=--)/).map((c) => c.trim()).filter(Boolean);
		if (chunks.length <= 1) return [`  ${tail}`];
		const out = [`  llama-server \\`];
		for (let i = 0; i < chunks.length; i++) {
			const cont = i < chunks.length - 1 ? ' \\' : '';
			out.push(`    ${chunks[i]}${cont}`);
		}
		return out;
	}
	return [`  ${tail}`];
}

function formatDockerCommand(cmd) {
	const t = cmd.trim();
	let lines = [];
	let rest;

	const pullP = 'sudo docker run -it --rm --pull always --runtime=nvidia --network host ';
	if (t.startsWith(pullP)) {
		lines.push('sudo docker run -it --rm --pull always \\');
		lines.push('  --runtime=nvidia --network host \\');
		rest = t.slice(pullP.length);
		return finishVolumesImageTail(lines, rest);
	}

	const noPullP = 'sudo docker run -it --rm --runtime=nvidia --network host ';
	if (t.startsWith(noPullP)) {
		lines.push('sudo docker run -it --rm \\');
		lines.push('  --runtime=nvidia --network host \\');
		rest = t.slice(noPullP.length);
		return finishVolumesImageTail(lines, rest);
	}

	return null;
}

function formatScalarToBlock(key, rawValue) {
	const v = rawValue.trim();
	if (v.startsWith('sudo docker run')) {
		const d = formatDockerCommand(v);
		if (d) return d;
	}
	// Short commands: ollama, curl, ngc, plain text
	return v;
}

function processLine(line, lineIndex, lines) {
	const keyM = line.match(/^(\s*)([a-z_]+):\s*"/);
	if (!keyM || !KEYS.has(keyM[2])) return line;

	const key = keyM[2];
	const indent = keyM[1];
	const parsed = parseDoubleQuotedScalar(line, keyM[0].length);
	if (!parsed) return line;

	const after = line.slice(parsed.restStart).trim();
	if (after !== '' && after !== '#') return line;

	const blockBody = formatScalarToBlock(key, parsed.value);
	const contentIndent = indent + '  ';
	const blockLines = blockBody.split('\n').map((l) => contentIndent + l);

	return `${indent}${key}: |-\n${blockLines.join('\n')}`;
}

function processFile(filePath) {
	let text = fs.readFileSync(filePath, 'utf8');
	const lines = text.split(/\r?\n/);
	let changed = false;
	const out = lines.map((line, i) => {
		if (line.includes('|-')) return line;
		if (!line.includes(': "')) return line;
		const keyM = line.match(/^(\s*)([a-z_]+):\s*"/);
		if (!keyM || !KEYS.has(keyM[2])) return line;
		const nl = processLine(line, i, lines);
		if (nl !== line) changed = true;
		return nl;
	});
	if (changed) fs.writeFileSync(filePath, out.join('\n') + (text.endsWith('\n') ? '\n' : ''), 'utf8');
	return changed;
}

const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.md'));
let n = 0;
for (const f of files) {
	if (processFile(path.join(modelsDir, f))) {
		console.log(f);
		n++;
	}
}
console.log(`Updated ${n} files`);

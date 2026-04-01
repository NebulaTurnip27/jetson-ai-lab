import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '..', 'src', 'content', 'models');

const block = `  modules_supported:
    - thor_t5000
    - thor_t4000
    - orin_agx_64
    - orin_nx_16
    - orin_nano_8
`;

for (const f of fs.readdirSync(modelsDir)) {
	if (!f.endsWith('.md')) continue;
	const p = path.join(modelsDir, f);
	let t = fs.readFileSync(p, 'utf8');
	if (!t.includes('one_shot_inference:')) continue;
	if (t.includes('one_shot_inference:\n  modules_supported:')) continue;
	const re = /one_shot_inference:\r?\n/;
	if (!re.test(t)) continue;
	t = t.replace(re, `one_shot_inference:\n${block}`);
	fs.writeFileSync(p, t);
	console.log(f);
}

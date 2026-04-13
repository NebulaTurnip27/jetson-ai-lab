/**
 * Python: must not run string/regex passes after injecting &lt;span&gt; tags, or `"` inside
 * attributes is treated as a string literal and breaks the DOM (e.g. "text-purple-400">from).
 */
function highlightPythonLine(line: string): string {
	const trimmed = line.trim();
	if (trimmed.startsWith('#')) {
		return `<span class="text-slate-500">${escapeHtml(line)}</span>`;
	}
	const escaped = escapeHtml(line);
	const chunks: string[] = [];
	// Double- and single-quoted strings with backslash escapes (common in client examples)
	const withoutStrings = escaped.replace(
		/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
		(m) => {
			chunks.push(`<span class="text-emerald-400">${m}</span>`);
			return `\uE000${chunks.length - 1}\uE001`;
		},
	);
	const keywords =
		/\b(import|from|def|class|return|if|else|elif|try|except|finally|for|while|in|is|not|and|or|as|with|pass|break|continue|lambda|yield|async|await|True|False|None)\b/g;
	const builtins =
		/\b(print|len|str|int|dict|list|tuple|set|open|requests|json|super|self|cls|OpenAI)\b/g;
	let out = withoutStrings
		.replace(keywords, '<span class="text-purple-400">$1</span>')
		.replace(builtins, '<span class="text-cyan-400">$1</span>');
	for (let i = 0; i < chunks.length; i++) {
		out = out.replace(`\uE000${i}\uE001`, chunks[i]!);
	}
	return out;
}

/**
 * Client-safe shell/python/yaml highlighting (matches Run modal in Layout.astro).
 */
export function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

export function highlightSyntax(txt: string, lang: string): string {
	if (lang === 'shell' || lang === 'bash') {
		return txt
			.split('\n')
			.map((line) => {
				if (line.trim().startsWith('#')) {
					return `<span class="text-slate-500">${escapeHtml(line)}</span>`;
				}
				const highlighted = escapeHtml(line)
					.replace(
						/^(sudo|docker|ollama|vllm|python|curl|git|bash|wget|chmod|chown|cd|mkdir|rm|cp|mv|cat|echo|export|source|pip|npm|jetson-containers|trtllm-run|riva_start)(\s)/g,
						'<span class="text-cyan-400">$1</span>$2',
					)
					.replace(/(\s)(--?[\w-]+)/g, '$1<span class="text-emerald-400">$2</span>')
					.replace(/(https?:\/\/[^\s]+)/g, '<span class="text-amber-400">$1</span>')
					.replace(/(\$\w+|\$\{[^}]+\})/g, '<span class="text-purple-400">$1</span>');
				return highlighted;
			})
			.join('\n');
	}
	if (lang === 'python') {
		return txt
			.split('\n')
			.map((line) => highlightPythonLine(line))
			.join('\n');
	}
	if (lang === 'yaml') {
		return txt
			.split('\n')
			.map((line) => {
				if (line.trim().startsWith('#')) {
					return `<span class="text-slate-500">${escapeHtml(line)}</span>`;
				}
				return escapeHtml(line)
					.replace(/^(\s*)([\w_-]+)(:)/gm, '$1<span class="text-cyan-400">$2</span>$3')
					.replace(/(["'][^"']*["'])/g, '<span class="text-emerald-400">$1</span>');
			})
			.join('\n');
	}
	return escapeHtml(txt);
}

/** Display text + clipboard text for shell (continuation lines), same as Run modal. */
export function shellDisplayAndCopy(cmd: string): { display: string; copy: string } {
	const copy = cmd.replace(/(\\)\n\s+/g, '$1\n');
	const display =
		cmd.indexOf('\\\n') !== -1
			? cmd.indexOf('\\\n  ') !== -1
				? cmd
				: cmd.replace(/(\\)\n/g, '$1\n  ')
			: cmd;
	return { display, copy };
}

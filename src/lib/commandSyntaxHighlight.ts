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
			.map((line) => {
				if (line.trim().startsWith('#')) {
					return `<span class="text-slate-500">${escapeHtml(line)}</span>`;
				}
				return escapeHtml(line)
					.replace(
						/\b(import|from|def|class|return|if|else|elif|try|except|for|while|in|as|with|True|False|None)\b/g,
						'<span class="text-purple-400">$1</span>',
					)
					.replace(/\b(print|requests|json)\b/g, '<span class="text-cyan-400">$1</span>')
					.replace(/(["'][^"']*["'])/g, '<span class="text-emerald-400">$1</span>');
			})
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

/** Browser-safe helpers shared by model page panel and Run modal (mirrors Layout.astro). */

export interface VllmOverrideState {
	vllmPort?: string;
	vllmMaxModelLen?: string;
	vllmGpuMem?: string;
}

export function applyHfTokenToCommand(cmd: string, hfToken: string): string {
	if (!cmd || !hfToken) return cmd;
	let out = cmd;
	out = out.replace(/\\\$HF_TOKEN/g, hfToken);
	out = out.replace(/\$\{HF_TOKEN\}/g, hfToken);
	out = out.replace(/\$HF_TOKEN/g, hfToken);
	return out;
}

export function applyVllmOverridesToCommand(cmd: string, st: VllmOverrideState): string {
	if (!cmd || !cmd.includes('vllm serve')) return cmd;
	const flags: { key: keyof VllmOverrideState; flag: string; defaultVal: string | null }[] = [
		{ key: 'vllmPort', flag: '--port', defaultVal: null },
		{ key: 'vllmMaxModelLen', flag: '--max-model-len', defaultVal: null },
		{ key: 'vllmGpuMem', flag: '--gpu-memory-utilization', defaultVal: '0.8' },
	];
	let result = cmd;
	for (const { key, flag, defaultVal } of flags) {
		const val = st[key] || defaultVal;
		if (!val) continue;
		const esc = flag.replace(/-/g, '[-]');
		const regex = new RegExp(esc + '\\s+\\S+');
		if (regex.test(result)) {
			if (!result.match(new RegExp(esc + '\\s+\\$'))) {
				result = result.replace(regex, flag + ' ' + val);
			}
		} else {
			const serveIdx = result.indexOf('vllm serve');
			let afterServe = result.indexOf(' ', serveIdx + 'vllm serve '.length);
			if (afterServe === -1) afterServe = result.length;
			result = result.slice(0, afterServe) + ' ' + flag + ' ' + val + result.slice(afterServe);
		}
	}
	return result;
}

export function escapeHtml(text: string): string {
	const div = typeof document !== 'undefined' ? document.createElement('div') : null;
	if (div) {
		div.textContent = text;
		return div.innerHTML;
	}
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

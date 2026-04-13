/** Shared browser persistence for inference UI (serve matrix, run modal, one-shot). */

export const INFERENCE_BROWSER_PREFS_KEY = 'jetson-ai-lab:inference-prefs';

export type InferenceBrowserPrefs = {
	vllmPort?: string;
	vllmMaxModelLen?: string;
	vllmGpuMem?: string;
	/** Jetson matrix module id — shared across model pages */
	matrixModuleId?: string;
	/** Engine label as in matrix rail, e.g. vLLM / Ollama */
	matrixEngineId?: string;
};

function safeParse(raw: string | null): InferenceBrowserPrefs {
	if (!raw) return {};
	try {
		const o = JSON.parse(raw) as unknown;
		if (!o || typeof o !== 'object') return {};
		return o as InferenceBrowserPrefs;
	} catch {
		return {};
	}
}

export function readInferenceBrowserPrefs(): InferenceBrowserPrefs {
	if (typeof localStorage === 'undefined') return {};
	return safeParse(localStorage.getItem(INFERENCE_BROWSER_PREFS_KEY));
}

export function writeInferenceBrowserPrefsPatch(patch: Partial<InferenceBrowserPrefs>): void {
	if (typeof localStorage === 'undefined') return;
	const cur = readInferenceBrowserPrefs();
	for (const k of Object.keys(patch) as (keyof InferenceBrowserPrefs)[]) {
		const v = patch[k];
		if (v === undefined || v === '') {
			delete cur[k];
		} else {
			(cur as Record<string, string>)[k] = v;
		}
	}
	try {
		localStorage.setItem(INFERENCE_BROWSER_PREFS_KEY, JSON.stringify(cur));
	} catch {
		/* quota / private mode */
	}
}

/** Clears only vLLM advanced fields (used with Reset vLLM fields). */
export function clearVllmFieldsInInferenceBrowserPrefs(): void {
	writeInferenceBrowserPrefsPatch({
		vllmPort: undefined,
		vllmMaxModelLen: undefined,
		vllmGpuMem: undefined,
	});
}

export function normalizeInferenceEngineKey(name: string): string {
	return String(name || '')
		.trim()
		.toLowerCase()
		.replace(/[.\-_]/g, '');
}

import { enginesForCategory, type InferenceCategory } from './engines';
import type { InferenceEngine } from './engines';

/** Mirrors model frontmatter `supported_inference_engines` entries */
export interface SupportedEngineEntry {
	engine: string;
	type?: string;
	install_command?: string;
	run_command?: string;
	install_command_orin?: string;
	run_command_orin?: string;
	install_command_thor?: string;
	run_command_thor?: string;
}

export type PlatformKey = 'orin' | 'thor';

/** Jetson hardware row in the matrix UI (icons: set `iconSrc` when Figma assets land). */
export interface JetsonModuleSpec {
	/** Canonical id for front matter / analytics, e.g. `thor_t5000`, `orin_nano_4` */
	id: string;
	/** Accessible name, e.g. for tooltips */
	label: string;
	/** Short text next to the icon in the matrix tab */
	shortLabel: string;
	/** Matrix tab first line — small type (e.g. “Jetson”) */
	tabKicker: string;
	/** Matrix tab second line — bold (e.g. “T5000 module”) */
	tabTitleBold: string;
	/** Matrix tab third line — muted gray (e.g. developer kit name), if any */
	tabSubtitleGray?: string;
	platformKey: PlatformKey;
	/** Optional path under `public/` e.g. `/images/modules/thor-t5000.png` */
	iconSrc?: string;
	/** When true, tab is shown but not selectable (e.g. coming soon). */
	disabled?: boolean;
	/**
	 * When false, id is valid for front matter and `moduleById`, but no Serve/Run matrix tab is shown.
	 * Commands still resolve via `platformKey` (orin vs thor).
	 */
	showInMatrixUi?: boolean;
}

/**
 * Canonical Jetson module ids (front matter, analytics). Thor / Orin command strings still map by `platformKey`.
 *
 * Matrix tabs: by default only modules with `showInMatrixUi !== false` appear in Serve + Run modal
 * (`thor_t5000`, `thor_t4000`, `orin_agx_64`, `orin_nx_16`, `orin_nano_8`). Others are data-only.
 */
export const JETSON_MATRIX_MODULES: readonly JetsonModuleSpec[] = [
	{
		id: 'thor_t5000',
		label: 'Jetson AGX Thor Developer Kit / T5000 module',
		shortLabel: 'T5000',
		tabKicker: 'Jetson',
		tabTitleBold: 'T5000 module',
		tabSubtitleGray: 'Jetson AGX Thor Developer Kit',
		platformKey: 'thor',
	},
	{
		id: 'thor_t4000',
		label: 'T4000 module',
		shortLabel: 'T4000',
		tabKicker: 'Jetson',
		tabTitleBold: 'T4000 module',
		platformKey: 'thor',
	},
	{
		id: 'orin_agx_64',
		label: 'Jetson AGX Orin 64GB Developer Kit / AGX Orin 64GB module',
		shortLabel: 'AGX Orin 64GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'AGX Orin 64GB module',
		tabSubtitleGray: 'Jetson AGX Orin 64GB Developer Kit',
		platformKey: 'orin',
	},
	{
		id: 'orin_agx_32',
		label: 'Jetson AGX Orin 32GB Developer Kit / AGX Orin 32GB module',
		shortLabel: 'AGX Orin 32GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'AGX Orin 32GB module',
		tabSubtitleGray: 'Jetson AGX Orin 32GB Developer Kit',
		platformKey: 'orin',
		showInMatrixUi: false,
	},
	{
		id: 'orin_nx_16',
		label: 'Orin NX 16GB module',
		shortLabel: 'Orin NX 16GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'Orin NX 16GB module',
		platformKey: 'orin',
	},
	{
		id: 'orin_nx_8',
		label: 'Orin NX 8GB module',
		shortLabel: 'Orin NX 8GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'Orin NX 8GB module',
		platformKey: 'orin',
		showInMatrixUi: false,
	},
	{
		id: 'orin_nano_8',
		label: 'Jetson Orin Nano 8GB Developer Kit / Orin Nano 8GB module',
		shortLabel: 'Orin Nano 8GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'Orin Nano 8GB module',
		tabSubtitleGray: 'Jetson Orin Nano 8GB Developer Kit',
		platformKey: 'orin',
	},
	{
		id: 'orin_nano_4',
		label: 'Jetson Orin Nano 4GB Developer Kit / Orin Nano 4GB module',
		shortLabel: 'Orin Nano 4GB',
		tabKicker: 'Jetson',
		tabTitleBold: 'Orin Nano 4GB module',
		tabSubtitleGray: 'Jetson Orin Nano 4GB Developer Kit',
		platformKey: 'orin',
		showInMatrixUi: false,
	},
] as const;

/** Ids that appear as matrix tabs when the platform has commands (subset of {@link JETSON_MATRIX_MODULES}). */
export const JETSON_MATRIX_TAB_MODULE_IDS: readonly string[] = JETSON_MATRIX_MODULES.filter(
	(m) => m.showInMatrixUi !== false
).map((m) => m.id);

export function moduleById(id: string): JetsonModuleSpec | undefined {
	return JETSON_MATRIX_MODULES.find((m) => m.id === id);
}

function normalizedEngineKey(s: string): string {
	return s.toLowerCase().replace(/[.\-_]/g, '');
}

/** Install + run for one platform (same strings the model page and modal must show). */
export function combineInstallRunForPlatform(
	e: SupportedEngineEntry,
	platform: PlatformKey
): string {
	const install =
		platform === 'thor'
			? (e.install_command_thor ?? e.install_command)
			: (e.install_command_orin ?? e.install_command);
	const run =
		platform === 'thor'
			? (e.run_command_thor ?? e.run_command)
			: (e.run_command_orin ?? e.run_command);
	let combined = '';
	if (install) combined += `# Installation\n${install}`;
	if (run) {
		if (combined) combined += '\n\n';
		combined += `# Run Command\n${run}`;
	}
	return combined;
}

export function combineInstallRunForModule(
	e: SupportedEngineEntry,
	module: JetsonModuleSpec
): string {
	return combineInstallRunForPlatform(e, module.platformKey);
}

/** Matrix tabs only: Orin vs Thor availability, and {@link JetsonModuleSpec.showInMatrixUi} !== false. */
export function visibleModulesForEngines(engines: SupportedEngineEntry[]): JetsonModuleSpec[] {
	let hasOrin = false;
	let hasThor = false;
	for (const e of engines) {
		if (combineInstallRunForPlatform(e, 'orin')) hasOrin = true;
		if (combineInstallRunForPlatform(e, 'thor')) hasThor = true;
	}
	return JETSON_MATRIX_MODULES.filter(
		(m) =>
			m.showInMatrixUi !== false && (m.platformKey === 'thor' ? hasThor : hasOrin)
	);
}

/**
 * Clone matrix-visible modules and set `disabled` when id is listed in model front matter
 * `matrix_modules_disabled`, or when the catalog entry already had `disabled: true`.
 */
export function applyMatrixModuleDisabledFlags(
	modules: JetsonModuleSpec[],
	disabledIds?: readonly string[] | null
): JetsonModuleSpec[] {
	const set = new Set(
		(disabledIds ?? []).map((id) => id.trim()).filter(Boolean)
	);
	if (set.size === 0) return modules.map((m) => ({ ...m }));
	return modules.map((m) => ({
		...m,
		disabled: Boolean(m.disabled || set.has(m.id)),
	}));
}

/** Match UI engine id (e.g. vllm, llamacpp) to a content entry (e.g. vLLM, llama.cpp). */
export function matchSupportedEngine(
	supportedEngines: SupportedEngineEntry[],
	engineId: string
): SupportedEngineEntry | undefined {
	const normId = normalizedEngineKey(engineId);
	return supportedEngines.find((e) => {
		if (!e.engine) return false;
		const n = normalizedEngineKey(e.engine);
		return n === normId || e.engine.toLowerCase() === engineId.toLowerCase();
	});
}

/** Same filtering as RunCommand.astro for inference engine dropdowns. */
export function filterEnginesForModel(
	category: InferenceCategory,
	supportedEngines?: SupportedEngineEntry[]
): InferenceEngine[] {
	let engines = enginesForCategory(category);
	if (supportedEngines?.length) {
		const supportedIds = supportedEngines.map((e) => e.engine.toLowerCase());
		engines = engines.filter(
			(e) => supportedIds.includes(e.id) || supportedIds.includes(e.label.toLowerCase())
		);
		if (engines.length === 0) {
			const allEngines = enginesForCategory(category);
			engines = allEngines.filter((e) =>
				supportedIds.some((id) => id.includes(e.id) || e.id.includes(id))
			);
		}
	}
	return engines;
}

/**
 * Per UI engine id → combined bash for Orin and Thor (for modal data-meta + Layout).
 */
export function buildCommandMatrix(
	category: InferenceCategory,
	supportedEngines?: SupportedEngineEntry[]
): Record<string, { orin: string; thor: string }> {
	const matrix: Record<string, { orin: string; thor: string }> = {};
	if (!supportedEngines?.length) return matrix;
	const uiEngines = filterEnginesForModel(category, supportedEngines);
	for (const ui of uiEngines) {
		const entry = matchSupportedEngine(supportedEngines, ui.id);
		if (entry) {
			matrix[ui.id] = {
				orin: combineInstallRunForPlatform(entry, 'orin'),
				thor: combineInstallRunForPlatform(entry, 'thor'),
			};
		}
	}
	return matrix;
}

/** moduleId → { engineUiId → combined bash } for Run modal (matches model page matrix). */
export function buildModuleCommandMatrix(
	category: InferenceCategory,
	supportedEngines?: SupportedEngineEntry[]
): Record<string, Record<string, string>> {
	const out: Record<string, Record<string, string>> = {};
	if (!supportedEngines?.length) return out;
	const modules = visibleModulesForEngines(supportedEngines);
	const uiEngines = filterEnginesForModel(category, supportedEngines);
	for (const mod of modules) {
		out[mod.id] = {};
		for (const ui of uiEngines) {
			const entry = matchSupportedEngine(supportedEngines, ui.id);
			if (entry) {
				out[mod.id][ui.id] = combineInstallRunForModule(entry, mod);
			}
		}
	}
	return out;
}

export function moduleIdToPlatformMap(modules: JetsonModuleSpec[]): Record<string, PlatformKey> {
	const m: Record<string, PlatformKey> = {};
	for (const mod of modules) m[mod.id] = mod.platformKey;
	return m;
}

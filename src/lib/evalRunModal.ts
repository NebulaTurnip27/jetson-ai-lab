import { JETSON_MATRIX_MODULES, moduleById, type JetsonModuleSpec } from './inferenceCommands';

/** Subset of model `one_shot_inference` used by the catalog Run modal. */
export type OneShotForRunModal = {
	modules_supported?: string[];
	run_command_orin?: string;
	run_command_thor?: string;
	shell?: string;
	python?: string;
	intro?: string;
	shell_by_module?: Record<string, string>;
	python_by_module?: Record<string, string>;
};

export function oneShotHasRunModalContent(o?: OneShotForRunModal | null): boolean {
	if (!o) return false;
	if (o.run_command_orin?.trim() || o.run_command_thor?.trim()) return true;
	if (o.shell?.trim() || o.python?.trim()) return true;
	if (o.shell_by_module && Object.values(o.shell_by_module).some((s) => String(s).trim())) return true;
	if (o.python_by_module && Object.values(o.python_by_module).some((s) => String(s).trim())) return true;
	return false;
}

/**
 * Module tabs for eval modal: explicit `modules_supported` and/or keys in per-module maps;
 * otherwise all default matrix tabs (same snippet per tab unless `*_by_module` differs).
 */
export function evalMatrixModuleSpecs(o: OneShotForRunModal): JetsonModuleSpec[] {
	const tabOrder = JETSON_MATRIX_MODULES.filter((m) => m.showInMatrixUi !== false);
	const orderedIds = tabOrder.map((m) => m.id);
	const idSet = new Set<string>();
	const explicitModules = (o.modules_supported || []).map((id) => id.trim()).filter(Boolean);
	for (const id of explicitModules) {
		idSet.add(id);
	}
	for (const k of Object.keys(o.shell_by_module || {})) idSet.add(k);
	for (const k of Object.keys(o.python_by_module || {})) idSet.add(k);
	/** When no explicit module list, default to all matrix tabs for platform-mapped `run_command_*`. */
	if (explicitModules.length === 0 && (o.run_command_orin?.trim() || o.run_command_thor?.trim())) {
		for (const m of tabOrder) idSet.add(m.id);
	}
	if (idSet.size === 0) {
		return tabOrder;
	}
	const sorted = orderedIds.filter((id) => idSet.has(id));
	return sorted.map((id) => moduleById(id)).filter((m): m is JetsonModuleSpec => Boolean(m));
}

export type EvalSnippetRow = { shell: string; python: string };

export function evalSnippetByModule(
	o: OneShotForRunModal,
	moduleIds: string[]
): Record<string, EvalSnippetRow> {
	const gShell = (o.shell || '').trim();
	const gPy = (o.python || '').trim();
	const orinRun = (o.run_command_orin || '').trim();
	const thorRun = (o.run_command_thor || '').trim();
	const out: Record<string, EvalSnippetRow> = {};
	for (const id of moduleIds) {
		const mod = moduleById(id);
		const platformShell =
			mod?.platformKey === 'thor' ? thorRun : mod?.platformKey === 'orin' ? orinRun : '';
		const sh = (o.shell_by_module?.[id] ?? (platformShell || gShell)).trim();
		const py = (o.python_by_module?.[id] ?? gPy).trim();
		out[id] = { shell: sh, python: py };
	}
	return out;
}

export function evalModalShowsShell(snippetMap: Record<string, EvalSnippetRow>): boolean {
	return Object.values(snippetMap).some((r) => r.shell.length > 0);
}

export function evalModalShowsPython(snippetMap: Record<string, EvalSnippetRow>): boolean {
	return Object.values(snippetMap).some((r) => r.python.length > 0);
}

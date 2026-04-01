import { JETSON_MATRIX_MODULES, moduleById, type JetsonModuleSpec } from './inferenceCommands';

/** Subset of model `one_shot_inference` used by the catalog Run modal. */
export type OneShotForRunModal = {
	modules_supported?: string[];
	shell?: string;
	python?: string;
	intro?: string;
	shell_by_module?: Record<string, string>;
	python_by_module?: Record<string, string>;
};

export function oneShotHasRunModalContent(o?: OneShotForRunModal | null): boolean {
	if (!o) return false;
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
	for (const id of o.modules_supported || []) {
		if (id?.trim()) idSet.add(id.trim());
	}
	for (const k of Object.keys(o.shell_by_module || {})) idSet.add(k);
	for (const k of Object.keys(o.python_by_module || {})) idSet.add(k);
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
	const out: Record<string, EvalSnippetRow> = {};
	for (const id of moduleIds) {
		const sh = (o.shell_by_module?.[id] ?? gShell).trim();
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

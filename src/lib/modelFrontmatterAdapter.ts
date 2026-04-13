import type { SupportedEngineEntry } from './inferenceCommands';

/** Shape needed to resolve engines (matches model collection data; avoid importing content/config from lib). */
export interface ModelEnginesSource {
	supported_inference_engines?: SupportedEngineEntry[];
	serving?: {
		entries: ServingEntryInput[];
	};
}

export type ServingEntryInput = {
	engine: string;
	type?: string;
	modules_supported?: string[];
	install_command?: string;
	run_command?: string;
	serve_command_orin?: string;
	serve_command_thor?: string;
	run_command_orin?: string;
	run_command_thor?: string;
	run_commands_by_module?: Record<string, string>;
};

export function servingEntryToSupportedEngine(e: ServingEntryInput): SupportedEngineEntry {
	return {
		engine: e.engine,
		type: e.type ?? 'Container',
		install_command: e.install_command,
		run_command: e.run_command,
		serve_command_orin: e.serve_command_orin,
		serve_command_thor: e.serve_command_thor,
		run_command_orin: e.run_command_orin,
		run_command_thor: e.run_command_thor,
		install_command_orin: undefined,
		install_command_thor: undefined,
		modules_supported: e.modules_supported,
		run_commands_by_module: e.run_commands_by_module,
	};
}

/** Prefer new `serving.entries` when present; otherwise legacy `supported_inference_engines`. */
export function getSupportedInferenceEngines(data: ModelEnginesSource): SupportedEngineEntry[] {
	const n = data.serving?.entries?.length ?? 0;
	if (n > 0) {
		return data.serving!.entries.map(servingEntryToSupportedEngine);
	}
	return data.supported_inference_engines ?? [];
}

export function sortEnginesForUi(engines: SupportedEngineEntry[]): SupportedEngineEntry[] {
	return [...engines].sort((a, b) => {
		if (a.engine === 'vLLM') return -1;
		if (b.engine === 'vLLM') return 1;
		return a.engine.localeCompare(b.engine);
	});
}

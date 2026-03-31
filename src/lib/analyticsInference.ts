/**
 * GA4 (gtag) — custom event for inference command copies.
 * Register custom dimensions in GA4 for: source, model_id, module_id, module_label, inference_engine, jetson_device.
 */
export type CopyInferenceSource =
	| 'model_page'
	| 'run_modal'
	| 'model_page_client_call';

export interface CopyInferencePayload {
	source: CopyInferenceSource;
	/** Content model slug or id (e.g. from collection) */
	model_id: string;
	/** Matrix module id (e.g. jetson_thor_t5000) or synthetic id for legacy modal */
	module_id: string;
	/** Human-readable module / device label */
	module_label: string;
	/** Engine id: vllm, ollama, … */
	inference_engine: string;
	/** Legacy Run modal: Jetson Device dropdown value */
	jetson_device?: string;
}

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

export function trackCopyInferenceCommand(p: CopyInferencePayload): void {
	if (typeof window === 'undefined') return;
	const g = window.gtag;
	if (typeof g !== 'function') return;

	const params: Record<string, string> = {
		source: p.source,
		model_id: p.model_id || 'unknown',
		module_id: p.module_id || '',
		module_label: p.module_label || '',
		inference_engine: (p.inference_engine || '').toLowerCase(),
	};
	if (p.jetson_device) params.jetson_device = p.jetson_device;

	g('event', 'copy_inference_command', params);
}

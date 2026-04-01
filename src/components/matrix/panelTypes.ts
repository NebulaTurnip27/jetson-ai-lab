/** Shared shapes for Jetson serve / Run matrix UI (module tab strip + engine rail). */

export type MatrixModuleTabVariant = 'serve-panel' | 'run-modal' | 'one-shot';

export interface MatrixModuleTabItem {
	id: string;
	label: string;
	tabKicker: string;
	tabTitleBold: string;
	tabSubtitleGray?: string;
	iconSrc?: string;
	iconBadgeFamily?: string;
	iconBadgeMemory?: string;
	/** From matrix `disabled` — mirrored to data-*-global-disabled */
	globalDisabled?: boolean;
}

export type EngineRailVariant = 'serve-panel' | 'run-modal';

export interface EngineRailItem {
	/** `data-engine` (panel) or value for `data-run-engine-btn` (modal) */
	key: string;
	/** Primary label (engine name) */
	title: string;
	subtitle?: string;
}

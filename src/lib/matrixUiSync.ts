/**
 * Client-side class sync for Jetson serve matrix module tabs and engine rail
 * (embedded panel, Run modal, one-shot). Keeps Layout + ModelServeSection + ModelOneShot in sync.
 */

export type MatrixEngineRailUiVariant = 'run-modal' | 'serve-panel';

const MODULE_TAB_DISABLED_ADD = [
	'cursor-not-allowed',
	'bg-[#999999]',
	'text-nvidia-black',
	'border-b-transparent',
	'pointer-events-none',
] as const;

const MODULE_TAB_DISABLED_REMOVE = [
	'bg-nvidia-green/25',
	'border-b-nvidia-green',
	'!border-b-nvidia-green',
	'ring-1',
	'ring-inset',
	'ring-nvidia-green/30',
	'bg-white',
	'text-nvidia-gray-600',
	'hover:bg-nvidia-gray-50',
	'hover:text-nvidia-black',
	'hover:border-b-nvidia-gray-200',
] as const;

const MODULE_TAB_CLEAR_DISABLED_ONLY = [
	'cursor-not-allowed',
	'bg-[#999999]',
	'text-nvidia-black',
	'pointer-events-none',
] as const;

const ENGINE_RAIL_ON_BG: Record<MatrixEngineRailUiVariant, string> = {
	'run-modal': 'lg:bg-nvidia-gray-50/80',
	'serve-panel': 'lg:bg-white/80',
};

export function applyMatrixModuleTabDisabledVisual(btn: Element): void {
	const b = btn as HTMLButtonElement;
	b.setAttribute('aria-selected', 'false');
	b.classList.add(...MODULE_TAB_DISABLED_ADD);
	b.classList.remove(...MODULE_TAB_DISABLED_REMOVE);
}

export function clearMatrixModuleTabDisabledVisual(btn: Element): void {
	(btn as HTMLButtonElement).classList.remove(...MODULE_TAB_CLEAR_DISABLED_ONLY);
}

/**
 * Selection chrome for enabled module tabs (green band, ring, hover on inactive).
 * Disabled tabs: only `aria-selected="false"`.
 */
export function syncMatrixModuleTabSelection(
	buttons: Iterable<Element>,
	isSelected: (btn: Element) => boolean,
): void {
	for (const el of buttons) {
		const btn = el as HTMLButtonElement;
		if (btn.disabled) {
			btn.setAttribute('aria-selected', 'false');
			continue;
		}
		const on = isSelected(el);
		btn.setAttribute('aria-selected', on ? 'true' : 'false');
		btn.classList.toggle('bg-nvidia-green/25', on);
		btn.classList.toggle('text-nvidia-black', on);
		btn.classList.toggle('!border-b-nvidia-green', on);
		btn.classList.toggle('ring-1', on);
		btn.classList.toggle('ring-inset', on);
		btn.classList.toggle('ring-nvidia-green/30', on);
		btn.classList.toggle('bg-white', !on);
		btn.classList.toggle('text-nvidia-gray-600', !on);
		btn.classList.toggle('border-b-transparent', !on);
		btn.classList.toggle('hover:bg-nvidia-gray-50', !on);
		btn.classList.toggle('hover:text-nvidia-black', !on);
		btn.classList.toggle('hover:border-b-nvidia-gray-200', !on);
	}
}

export function syncMatrixEngineRailSelection(
	buttons: Iterable<HTMLElement>,
	isSelected: (btn: HTMLElement) => boolean,
	variant: MatrixEngineRailUiVariant,
): void {
	const onBg = ENGINE_RAIL_ON_BG[variant];
	for (const btn of buttons) {
		const on = !(btn as HTMLButtonElement).disabled && isSelected(btn);
		btn.setAttribute('aria-selected', on ? 'true' : 'false');
		btn.classList.toggle('!border-b-nvidia-green', on);
		btn.classList.toggle('lg:!border-l-nvidia-green', on);
		btn.classList.toggle('text-nvidia-green', on);
		btn.classList.toggle(onBg, on);
		btn.classList.toggle('border-b-transparent', !on);
		btn.classList.toggle('lg:border-l-transparent', !on);
		btn.classList.toggle('text-gray-500', !on);
		btn.classList.toggle('hover:text-nvidia-black', !on);
		btn.classList.toggle('hover:border-b-gray-300', !on);
		btn.classList.toggle('lg:hover:border-l-gray-300', !on);
	}
}

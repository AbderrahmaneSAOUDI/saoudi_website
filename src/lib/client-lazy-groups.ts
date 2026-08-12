export function startLazyGroupLoader(): void {
	if ((window as any).__lazyGroupLoaderStarted) return;
	(window as any).__lazyGroupLoaderStarted = true;

	const activateGroupImages = (section: HTMLElement): void => {
		section.setAttribute('data-group-section', 'expanded');
		if (typeof (window as any).__discoverDeferredImages === 'function') {
			(window as any).__discoverDeferredImages(section);
		}
	};

	const handler = (event: Event) => {
		const checkbox = event.target as HTMLInputElement;
		if (!checkbox || checkbox.type !== 'checkbox' || !checkbox.id.startsWith('toggle-')) return;
		const label = document.querySelector(`label[for="${checkbox.id}"]`);
		const section = label?.closest('section') as HTMLElement | null;
		if (!section) return;
		if (checkbox.checked) {
			activateGroupImages(section);
		} else {
			section.setAttribute('data-group-section', 'collapsed');
		}
	};

	document.addEventListener('change', handler, { capture: true, passive: true });

	document
		.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="toggle-"]:checked')
		.forEach((checkbox) => {
			const label = document.querySelector(`label[for="${checkbox.id}"]`);
			const section = label?.closest('section') as HTMLElement | null;
			if (section) section.setAttribute('data-group-section', 'expanded');
		});
}

export function startDeferredImageLoader(): void {
	if ((window as any).__deferredImageLoaderStarted) return;
	(window as any).__deferredImageLoaderStarted = true;

	const loadImage = (image: HTMLImageElement) => {
		const source = image.dataset.src;
		if (!source) return;
		if (image.dataset.srcset) image.srcset = image.dataset.srcset;
		image.src = source;
		delete image.dataset.src;
		delete image.dataset.srcset;
	};

	const intersectionObserver = new IntersectionObserver(
		entries => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				intersectionObserver.unobserve(entry.target);
				loadImage(entry.target as HTMLImageElement);
			}
		},
		{ rootMargin: '600px 0px' },
	);

	const isInsideCollapsedGroup = (image: HTMLImageElement): boolean => {
		const section = image.closest('section[data-group-section]');
		if (!section) return false;
		const status = section.getAttribute('data-group-section');
		if (status === 'expanded') return false;
		if (status === 'collapsed') return true;
		const checkbox = section.querySelector<HTMLInputElement>('input[type="checkbox"]');
		return checkbox ? !checkbox.checked : false;
	};

	const discover = (root: ParentNode) => {
		root.querySelectorAll<HTMLImageElement>('img[data-src]').forEach(image => {
			if (image.dataset.lazyObserved === 'true') return;
			if (isInsideCollapsedGroup(image)) return;
			image.dataset.lazyObserved = 'true';
			intersectionObserver.observe(image);
		});
	};

	(window as any).__discoverDeferredImages = discover;

	discover(document);
	const mutationObserver = new MutationObserver(records => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (node instanceof Element) {
					if (node.matches('img[data-src]')) discover(node.parentNode || document);
					else discover(node);
				}
			}
		}
	});
	mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
}

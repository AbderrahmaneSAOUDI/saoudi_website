/**
 * Client-side image processing and WebP compression utilities.
 */

export interface CompressionResult {
	webpDataUrl: string;
	oldKB: number;
	newKB: number;
	diffPercent: number;
}

/**
 * Compresses an image file client-side to WebP format targeting <50KB size.
 * Scales down dimensions if greater than 1200px and progressively reduces quality.
 */
export function compressImageToWebpUnder50KB(file: File, maxDim = 1200): Promise<CompressionResult> {
	return new Promise((resolve, reject) => {
		const oldKB = Math.round(file.size / 1024);
		const reader = new FileReader();

		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				if (width > maxDim || height > maxDim) {
					if (width > height) {
						height = Math.round((height * maxDim) / width);
						width = maxDim;
					} else {
						width = Math.round((width * maxDim) / height);
						height = maxDim;
					}
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) return reject(new Error('Canvas context error'));

				ctx.drawImage(img, 0, 0, width, height);

				let quality = 0.75;
				let dataUrl = canvas.toDataURL('image/webp', quality);

				// Target ~50KB (base64 length threshold around 68,000 chars)
				while (dataUrl.length > 68000 && quality > 0.1) {
					quality -= 0.1;
					dataUrl = canvas.toDataURL('image/webp', quality);
				}

				const approxBytes = Math.round((dataUrl.length * 3) / 4);
				const newKB = Math.round(approxBytes / 1024);
				const diffPercent = oldKB > 0 ? Math.round(((newKB - oldKB) / oldKB) * 100) : 0;

				resolve({ webpDataUrl: dataUrl, oldKB, newKB, diffPercent });
			};

			img.onerror = () => reject(new Error('Failed to load image element'));
			img.src = e.target?.result as string;
		};

		reader.onerror = () => reject(new Error('Failed to read input file'));
		reader.readAsDataURL(file);
	});
}

/**
 * Converts a Base64 Data URL to a native File object for upload handling.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
	const arr = dataUrl.split(',');
	const mimeMatch = arr[0].match(/:(.*?);/);
	const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, { type: mime });
}

/**
 * Resizes and converts an image File to a compressed WebP File.
 */
export function compressImageToWebp(file: File, maxDim = 1024, quality = 0.8): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);
		img.src = objectUrl;

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			let width = img.width;
			let height = img.height;

			if (width > maxDim || height > maxDim) {
				if (width > height) {
					height = Math.round((height * maxDim) / width);
					width = maxDim;
				} else {
					width = Math.round((width * maxDim) / height);
					height = maxDim;
				}
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
						const newFile = new File([blob], `${baseName}.webp`, {
							type: 'image/webp',
							lastModified: Date.now(),
						});
						resolve(newFile);
					} else {
						resolve(file);
					}
				},
				'image/webp',
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Failed to load image file for WebP compression.'));
		};
	});
}

/**
 * Resizes and converts an image File to a compressed WebP File that targets a size limit.
 */
export function compressImageToWebpUnderTargetKB(
	file: File,
	targetKB: number,
	maxDim = 400,
): Promise<File> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const img = new Image();
		img.src = objectUrl;

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			let width = img.width;
			let height = img.height;
			if (width > maxDim || height > maxDim) {
				if (width > height) {
					height = Math.round((height * maxDim) / width);
					width = maxDim;
				} else {
					width = Math.round((width * maxDim) / height);
					height = maxDim;
				}
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			const targetBytes = targetKB * 1024;
			let quality = 0.85;
			let dataUrl = canvas.toDataURL('image/webp', quality);

			while (dataUrlToByteLength(dataUrl) > targetBytes && quality > 0.1) {
				quality = Math.max(0.1, quality - 0.1);
				dataUrl = canvas.toDataURL('image/webp', quality);
			}

			if (dataUrlToByteLength(dataUrl) > targetBytes && (width > 96 || height > 96)) {
				const nextMaxDim = Math.max(96, Math.floor(Math.min(width, height) * 0.75));
				const resizedFile = dataUrlToFile(dataUrl, `${baseFileName(file)}.webp`);
				compressImageToWebpUnderTargetKB(resizedFile, targetKB, nextMaxDim)
					.then(resolve)
					.catch(reject);
				return;
			}

			resolve(dataUrlToFile(dataUrl, `${baseFileName(file)}.webp`));
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Failed to load image file for WebP compression.'));
		};
	});
}

function dataUrlToByteLength(dataUrl: string): number {
	return Math.round((dataUrl.length * 3) / 4);
}

function baseFileName(file: File): string {
	return file.name.includes('.') ? file.name.slice(0, file.name.lastIndexOf('.')) : file.name;
}

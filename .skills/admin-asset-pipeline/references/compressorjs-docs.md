# Compressor.js Quick Reference API Options

- `quality`: number (0 to 1). Set the quality of the output image. Default: 0.8.
- `maxWidth`: number. The max width of the output image.
- `mimeType`: string. Convert the image format. Force to 'image/webp'.
- `success(result)`: Callback function triggered when compression completes successfully, outputting a clean Blob.

import * as PImage from "pureimage";
import { Writable } from 'stream';
import DOMMatrix from "dommatrix";

if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = DOMMatrix as any;
}

export async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const data = new Uint8Array(pdfBuffer);

    // Load document
    const loadingTask = pdfjsLib.getDocument({
        data,
        disableFontFace: true, // Avoid font loading issues in pure JS env
        verbosity: 0
    });

    const pdfDocument = await loadingTask.promise;
    const images: Buffer[] = [];
    const numPages = pdfDocument.numPages;

    console.log(`PDF loaded. Pages: ${numPages}`);

    // Process each page
    for (let i = 1; i <= numPages; i++) {
        try {
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // 1.5x scale for decent readability

            // Create pureimage bitmap
            const bitmap = PImage.make(viewport.width, viewport.height);
            const context = bitmap.getContext('2d');

            // Render
            // Note: pdfjs render() expects a CanvasRenderingContext2D. 
            // PImage's context is close enough for basic rendering but might lack some features.
            await page.render({
                canvasContext: context as any,
                viewport: viewport
            } as any).promise;

            // Convert to PNG Buffer
            const pngBuffer = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                const stream = new Writable({
                    write(chunk, encoding, callback) {
                        chunks.push(Buffer.from(chunk));
                        callback();
                    }
                });

                stream.on('finish', () => {
                    resolve(Buffer.concat(chunks));
                });

                stream.on('error', (err) => {
                    reject(err);
                });

                PImage.encodePNGToStream(bitmap, stream).catch(reject);
            });

            images.push(pngBuffer);

            // Cleanup check?
            // Page cleanup happens automatically
        } catch (err: any) {
            console.error(`Error converting page ${i}:`, err);
            // Continue to next page?
        }
    }

    return images;
}

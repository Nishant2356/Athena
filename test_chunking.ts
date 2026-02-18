
// Improved Recursive Character Text Splitter (Copied from upload.ts for testing)
function recursiveTextSplitter(
    text: string,
    chunkSize: number,
    chunkOverlap: number
): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // Normalize text
    text = text.replace(/\r\n/g, "\n");

    // Helper to add a chunk
    const addChunk = (chunk: string) => {
        if (chunk.trim().length > 0) {
            chunks.push(chunk.trim());
        }
    };

    // First split by paragraphs
    const paragraphs = text.split("\n\n");

    for (const paragraph of paragraphs) {
        // If paragraph fits, add to current chunk or start new
        if ((currentChunk.length + paragraph.length + 2) <= chunkSize) {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        } else {
            // Paragraph itself needs splitting?
            if (paragraph.length > chunkSize) {
                // Push current chunk if exists
                if (currentChunk) {
                    addChunk(currentChunk);
                    currentChunk = "";
                }

                // Split this long paragraph recursively
                const subChunks = splitLongText(paragraph, chunkSize, chunkOverlap, ["\n", ".", " ", ""]);

                // Add all but the last subchunk (which might be growable)
                for (let i = 0; i < subChunks.length - 1; i++) {
                    addChunk(subChunks[i]);
                }
                currentChunk = subChunks[subChunks.length - 1];

            } else {
                // Paragraph fits in a new chunk
                addChunk(currentChunk);
                currentChunk = paragraph;
            }
        }
    }

    if (currentChunk) {
        addChunk(currentChunk);
    }

    return chunks;
}

function splitLongText(text: string, chunkSize: number, chunkOverlap: number, separators: string[]): string[] {
    const finalChunks: string[] = [];
    let separator = separators[0];
    let nextSeparators = separators.slice(1);

    if (separator === undefined) {
        // Base case: just slice by characters
        for (let i = 0; i < text.length; i += (chunkSize - chunkOverlap)) {
            finalChunks.push(text.slice(i, i + chunkSize));
        }
        return finalChunks;
    }

    const parts = text.split(separator);
    let current = "";

    for (const part of parts) {
        const proposed = current ? (current + separator + part) : part;
        if (proposed.length <= chunkSize) {
            current = proposed;
        } else {
            if (current) {
                finalChunks.push(current);
                current = "";
            }

            if (part.length > chunkSize && nextSeparators.length > 0) {
                // Recursively split the part
                const subChunks = splitLongText(part, chunkSize, chunkOverlap, nextSeparators);
                finalChunks.push(...subChunks);
            } else {
                if (part.length > chunkSize) {
                    // Force split if no more separators
                    const forcedRequest = splitLongText(part, chunkSize, chunkOverlap, []);
                    // Pass empty array to trigger base case
                    finalChunks.push(...forcedRequest);
                } else {
                    current = part;
                }
            }
        }
    }

    if (current) finalChunks.push(current);

    return finalChunks;
}

// Test Case
const sampleText = `Hello World. This is a test of the recursive chunking system.

It should respect paragraph boundaries like this one.
And it should also handle very long sentences that go on and on and on and need to be split in the middle because they exceed the chunk size limit which is set to a specific number of characters.

Here is another paragraph.`;

console.log("Testing Recursive Splitter...");
const chunks = recursiveTextSplitter(sampleText, 50, 10);
console.log(`Generated ${chunks.length} chunks.`);
chunks.forEach((c, i) => {
    console.log(`\n--- Chunk ${i} (${c.length} chars) ---`);
    console.log(c);
});

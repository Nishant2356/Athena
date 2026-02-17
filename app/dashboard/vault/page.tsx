"use client";

import { useState, useEffect } from "react";
import { uploadDocument } from "@/actions/upload";
import { supabase } from "@/lib/supabase";
import { UploadCloud, FileText, Trash2 } from "lucide-react";

interface DocumentInfo {
    filename: string;
    uploadedAt: string;
    chunkCount: number;
}

export default function VaultPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch documents on mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    async function fetchDocuments() {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("documents")
                .select("metadata");

            if (error) {
                console.error("Error fetching documents:", error);
                return;
            }

            // Group by filename and get metadata
            const docMap = new Map<string, DocumentInfo>();
            data?.forEach((row: any) => {
                const meta = row.metadata;
                const filename = meta.filename;

                if (!docMap.has(filename)) {
                    docMap.set(filename, {
                        filename,
                        uploadedAt: meta.uploadedAt,
                        chunkCount: meta.totalChunks || 0,
                    });
                }
            });

            setDocuments(Array.from(docMap.values()));
        } catch (err) {
            console.error("Failed to fetch documents:", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpload(formData: FormData) {
        setIsUploading(true);
        const result = await uploadDocument(formData);
        setIsUploading(false);

        if (result.success) {
            alert(`Document uploaded successfully! Processed ${result.chunks} chunks.`);
            // Refresh document list
            await fetchDocuments();
        } else {
            alert(`Upload failed: ${result.error}`);
        }
    }

    async function handleDelete(filename: string) {
        if (!confirm(`Delete "${filename}"? This will remove all chunks.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from("documents")
                .delete()
                .eq("metadata->>filename", filename);

            if (error) {
                alert(`Delete failed: ${error.message}`);
            } else {
                alert("Document deleted successfully!");
                await fetchDocuments();
            }
        } catch (err: any) {
            alert(`Delete failed: ${err.message}`);
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Knowledge Vault</h1>

            <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-blue-500 transition-colors bg-white/5">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-300 text-lg mb-4">
                    Drag and drop your syllabus or notes here
                </p>
                <form action={handleUpload}>
                    <input
                        type="file"
                        name="file"
                        accept=".pdf"
                        className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              cursor-pointer"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isUploading}
                        className="mt-6 px-6 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isUploading ? "Processing..." : "Upload to Brain"}
                    </button>
                </form>
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-semibold text-white mb-4">Your Library</h2>
                {isLoading ? (
                    <p className="text-gray-500 italic">Loading...</p>
                ) : documents.length === 0 ? (
                    <p className="text-gray-500 italic">No documents yet.</p>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.filename}
                                className="flex items-center justify-between bg-white/5 border border-gray-700 rounded-lg p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-white font-medium">{doc.filename}</p>
                                        <p className="text-gray-400 text-sm">
                                            {doc.chunkCount} chunks • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.filename)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                    title="Delete document"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

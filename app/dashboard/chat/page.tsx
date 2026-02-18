"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { PERSONAS } from "@/lib/personas";
import { clsx } from "clsx";

export default function ChatPage() {
    const { currentPersona, setPersona } = useChatStore();
    const [input, setInput] = useState("");

    // Configure useChat with api endpoint and persona
    const chatConfig: any = {
        api: "/api/chat",
        body: { personaId: currentPersona.id },
        onError: (err: any) => console.error("Chat Error:", err),
    };

    const { messages, sendMessage, status } = useChat(chatConfig) as any;

    const isLoading = status === "streaming" || status === "submitted";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        const userMessage = input;
        setInput(""); // Clear input immediately

        // Send message using sendMessage
        await sendMessage({
            text: userMessage,
        });
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-8rem)]">
            {/* Persona Switcher */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                {PERSONAS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
                            currentPersona.id === p.id
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-gray-700 text-gray-300 hover:bg-white/5"
                        )}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl p-4 border border-white/5 mb-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        Start chatting with {currentPersona.name}...
                    </div>
                )}

                {messages.map((m: any) => {
                    // Extract text from the parts array
                    const textContent = m.parts
                        ?.filter((part: any) => part.type === 'text')
                        .map((part: any) => part.text)
                        .join('') || '';

                    return (
                        <div
                            key={m.id}
                            className={clsx(
                                "max-w-[80%] rounded-xl p-3 whitespace-pre-wrap",
                                m.role === "user"
                                    ? "bg-blue-600 text-white ml-auto"
                                    : "bg-gray-800 text-gray-100 mr-auto"
                            )}
                        >
                            {textContent}
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="text-gray-500 text-sm animate-pulse ml-2">
                        {currentPersona.name} is thinking...
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask ${currentPersona.name} something...`}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input?.trim()}
                    className="bg-blue-600 px-6 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
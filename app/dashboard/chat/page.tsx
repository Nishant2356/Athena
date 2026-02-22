"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { clsx } from "clsx";
import { Edit, Send, Settings, Lightbulb, ThumbsUp, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { PERSONAS } from "@/lib/personas";

export default function ChatPage() {
    const { currentPersona, setPersona } = useChatStore();
    const [input, setInput] = useState("");
    const [showSwitcher, setShowSwitcher] = useState(false);

    const chatConfig: any = {
        api: "/api/chat",
        onError: (err: any) => console.error("Chat Error:", err),
    };

    const { messages, setMessages, stop, sendMessage, status } = useChat(chatConfig) as any;
    const isLoading = status === "streaming" || status === "submitted";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        const userMessage = input;
        setInput("");

        await sendMessage(
            { text: userMessage },
            {
                headers: { 'x-persona-id': currentPersona.id },
                body: { personaId: currentPersona.id }
            }
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-4 max-w-[1600px] mx-auto overflow-hidden relative">

            {/* Top Column on Mobile / Right Column on Desktop: Persona Details */}
            <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-2 md:gap-4 order-1 lg:order-2">
                <div className="bg-[#FAECCB] border border-[#D9C8AA] rounded-2xl p-3 md:p-4 shadow-sm lg:h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                        <h3 className="font-bold text-gray-900 tracking-tight text-sm md:text-base">Selected Persona & Reactions</h3>
                    </div>

                    <div className="flex items-center gap-3 mb-2 md:mb-6 relative">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white border border-[#D9C8AA] flex items-center justify-center text-lg md:text-2xl shadow-sm overflow-hidden relative">
                            {currentPersona.faceUrl || currentPersona.imageUrl ? (
                                <Image
                                    src={currentPersona.faceUrl || currentPersona.imageUrl || ""}
                                    alt={currentPersona.name}
                                    fill
                                    className="object-cover object-center"
                                />
                            ) : (
                                "🤓"
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm md:text-lg">{currentPersona.name}</div>
                            <div className="text-[10px] md:text-xs text-gray-600">{currentPersona.description.substring(0, 30)}...</div>
                        </div>

                        <div className="absolute right-0 top-1">
                            <button
                                onClick={() => setShowSwitcher(!showSwitcher)}
                                className="text-gray-400 hover:text-gray-600 bg-white/50 p-1.5 rounded-md border border-transparent hover:border-[#D9C8AA] transition-all"
                            >
                                <Edit size={14} className="md:w-4 md:h-4" />
                            </button>

                            {showSwitcher && (
                                <div className="absolute right-0 top-8 w-48 bg-white border border-[#D9C8AA] rounded-xl shadow-lg z-10 overflow-hidden">
                                    {PERSONAS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                stop();
                                                setMessages([]);
                                                setPersona(p.id);
                                                setShowSwitcher(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-2 text-sm hover:bg-[#FAECCB] transition-colors border-b border-gray-100 last:border-0",
                                                currentPersona.id === p.id ? "bg-[#FDF5E6] font-bold text-[#786134]" : "text-gray-700 font-medium"
                                            )}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Character Placeholder / Art */}
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[120px] sm:min-h-[160px] md:min-h-[250px] group">
                        {currentPersona.imageUrl ? (
                            <div className="w-24 h-32 sm:w-32 sm:h-44 md:w-48 md:h-64 relative mb-2 md:mb-4 rounded-xl overflow-hidden shadow-sm border-2 border-[#D9C8AA]">
                                <Image
                                    src={currentPersona.imageUrl}
                                    alt={currentPersona.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-24 h-32 sm:w-32 sm:h-44 md:w-48 md:h-64 bg-white/20 border-2 border-dashed border-[#C4A573]/40 rounded-xl flex items-center justify-center mb-2 md:mb-4 transition-all group-hover:bg-white/30">
                                <span className="text-[#C4A573] font-medium text-[10px] md:text-sm text-center px-2">Character Art</span>
                            </div>
                        )}
                        <button className="w-full py-1.5 md:py-2.5 bg-[#EEDBAC] border border-[#D9C8AA] rounded-xl text-[#786134] font-bold text-xs md:text-sm hover:bg-[#E5CD92] transition-colors shadow-sm mb-1 md:mb-4">
                            Equipped
                        </button>
                    </div>

                    {/* Bottom: Live Reactions */}
                    <div className="bg-[#FDF5E6] border border-[#D9C8AA] rounded-2xl p-2 md:p-4 shadow-inner mt-auto hidden sm:block">
                        <h4 className="font-bold text-gray-900 text-xs md:text-sm mb-1.5 md:mb-3">Live Reactions</h4>
                        <div className="flex gap-1.5 md:gap-2 justify-between">
                            <button className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 border border-[#8DA9D4] bg-[#BCCEE8] rounded-xl text-[#2F4770] hover:bg-[#A9C1DE] transition-colors shadow-sm">
                                <Settings size={18} className="md:w-[22px] md:h-[22px] text-[#4A6B9C] drop-shadow-sm" />
                                <span className="text-[8px] md:text-[10px] font-bold">Thinking</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 border border-[#D9C8AA] bg-[#FAECCB] rounded-xl text-[#786134] hover:bg-[#F2DFB3] transition-colors shadow-sm">
                                <Lightbulb size={18} className="md:w-[22px] md:h-[22px] text-amber-500 drop-shadow-sm" />
                                <span className="text-[8px] md:text-[10px] font-bold">Explaining</span>
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 border border-[#D9C8AA] bg-[#FAECCB] rounded-xl text-[#786134] hover:bg-[#F2DFB3] transition-colors shadow-sm">
                                <ThumbsUp size={18} className="md:w-[22px] md:h-[22px] text-amber-600 drop-shadow-sm" />
                                <span className="text-[8px] md:text-[10px] font-bold">Happy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Column on Mobile / Left Column on Desktop: Chat Area */}
            <div className="flex-1 flex flex-col bg-white/70 border border-[#D9C8AA] rounded-2xl p-2 md:p-4 shadow-sm overflow-hidden order-2 lg:order-1 min-h-0">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-base md:text-xl font-bold tracking-tight text-gray-900">Chat with a Persona Tutor.</h2>
                    <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-gray-600">
                            <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-1 md:px-2 py-2 md:py-4 space-y-4 md:space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-4 md:mt-20 text-xs md:text-base">
                            Say hello to {currentPersona.name}...
                        </div>
                    )}

                    {messages.map((m: any) => {
                        const textContent = m.content || (
                            m.parts
                                ?.filter((part: any) => part.type === 'text')
                                .map((part: any) => part.text)
                                .join('')
                        ) || '';

                        const isUser = m.role === "user";

                        return (
                            <div key={m.id} className={clsx("flex gap-2 md:gap-3", isUser ? "justify-end" : "justify-start")}>
                                {!isUser && (
                                    <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center border border-white shadow-sm overflow-hidden mt-1 relative">
                                        {currentPersona.faceUrl || currentPersona.imageUrl ? (
                                            <Image
                                                src={currentPersona.faceUrl || currentPersona.imageUrl || ""}
                                                alt={currentPersona.name}
                                                fill
                                                className="object-cover object-center"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#FAECCB] flex items-center justify-center text-[10px] md:text-xl">🤓</div>
                                        )}
                                    </div>
                                )}

                                <div className="max-w-[85%] md:max-w-[80%] flex flex-col">
                                    {!isUser && <span className="text-[8px] md:text-xs font-bold text-gray-700 ml-1 mb-0.5 md:mb-1">{currentPersona.name}</span>}
                                    <div className={clsx(
                                        "px-3 py-2 md:px-5 md:py-3.5 shadow-sm text-xs md:text-[15px] leading-relaxed break-words",
                                        isUser
                                            ? "bg-[#ABC4E9] text-[#1E3A5F] rounded-xl md:rounded-2xl rounded-tr-sm"
                                            : "bg-[#FAECCB] text-[#4A3D24] rounded-xl md:rounded-2xl rounded-tl-sm"
                                    )}>
                                        {textContent}
                                    </div>
                                </div>

                                {isUser && (
                                    <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-[#82A2D4] flex-shrink-0 flex items-center justify-center border border-white shadow-sm mt-1">
                                        <span className="text-white text-[10px] md:text-sm font-bold">U</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-2 md:gap-3 justify-start">
                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-gray-200 flex-shrink-0 border border-white shadow-sm overflow-hidden relative">
                                {currentPersona.faceUrl || currentPersona.imageUrl ? (
                                    <Image
                                        src={currentPersona.faceUrl || currentPersona.imageUrl || ""}
                                        alt={currentPersona.name}
                                        fill
                                        className="object-cover object-center"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#FAECCB] flex items-center justify-center text-[10px] md:text-xl">🤓</div>
                                )}
                            </div>
                            <div className="px-3 py-2 md:px-5 md:py-3.5 bg-[#FAECCB] text-[#4A3D24] rounded-xl md:rounded-2xl rounded-tl-sm animate-pulse text-xs md:text-[15px]">
                                Typing...
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="mt-2 flex gap-2 md:gap-3 relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white border border-[#D9C8AA] rounded-full pl-3 md:pl-6 pr-10 md:pr-14 py-2.5 md:py-3.5 text-xs md:text-base text-gray-800 focus:outline-none focus:border-[#C4A573] shadow-inner transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input?.trim()}
                        className="absolute right-1 md:right-2 top-1 md:top-1.5 bottom-1 md:bottom-1.5 aspect-square bg-[#CAA662] rounded-full flex items-center justify-center text-white hover:bg-[#B89454] transition-colors disabled:opacity-50"
                    >
                        <Send size={14} className="md:w-[18px] md:h-[18px] translate-x-[-1px] md:translate-y-[1px]" />
                    </button>
                </form>
            </div>
        </div>
    );
}
"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { clsx } from "clsx";
import { Edit, Send, Settings, Lightbulb, ThumbsUp, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import Image from "next/image";
import { PERSONAS } from "@/lib/personas";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
    const { currentPersona, setPersona } = useChatStore();
    const [input, setInput] = useState("");
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [predictedExpression, setPredictedExpression] = useState<string | null>(null);

    const chatConfig: any = {
        api: "/api/chat",
        onError: (err: any) => console.error("Chat Error:", err),
        onFinish: async (message: any) => {
            // Predict emotion for the AI's final response
            try {
                const res = await fetch('/api/expression', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [...messages, {
                            role: message.role || "assistant",
                            content: message.content || (message.parts?.map((p: any) => p.text).join('') || "")
                        }],
                        personaId: currentPersona.id
                    })
                });

                const data = await res.json();
                if (data.expression && data.expression !== "default") {
                    console.log("Emotion Agent (AI context) Success:", data.expression);
                    setPredictedExpression(data.expression);

                    // Keep the AI's reaction visible for 3-5 seconds based on text length
                    const duration = Math.min(5000, Math.max(3000, (message.content?.length || 0) * 50));
                    setTimeout(() => {
                        setPredictedExpression(null);
                    }, duration);
                } else {
                    setPredictedExpression(null);
                }
            } catch (err) {
                console.error("Emotion Agent (AI context) Failed:", err);
                setPredictedExpression(null);
            }
        }
    };

    const { messages, setMessages, stop, sendMessage, status } = useChat(chatConfig) as any;
    const isLoading = status === "streaming" || status === "submitted";

    // Determine active expression based on latest message
    let activeExpression = "default";

    // A newly predicted expression from our fast Emotion Agent
    if (predictedExpression) {
        activeExpression = predictedExpression;
    }

    // Determine what to show in the Character Art block
    const characterArtUrl = activeExpression !== "default" && currentPersona.expressions?.includes(activeExpression) && currentPersona.imageUrl
        ? currentPersona.imageUrl.replace(/\/[^/]+$/, `/expressions/${activeExpression}.${currentPersona.expressionExt || 'jpg'}`)
        : currentPersona.imageUrl;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        const userMessage = input;
        setInput("");

        // Clear any old prediction
        setPredictedExpression(null);

        // Fire Emotion Agent request in parallel to not block the send action
        fetch('/api/expression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...messages, { role: "user", content: userMessage }],
                personaId: currentPersona.id
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.expression) {
                    setPredictedExpression(data.expression);
                }
            })
            .catch(err => console.error("Emotion Agent Failed:", err));

        // Now send the actual chat message
        await sendMessage(
            { text: userMessage },
            {
                headers: { 'x-persona-id': currentPersona.id },
                body: { personaId: currentPersona.id }
            }
        );

        // The onFinish callback will handle resting/resetting the expression after the AI speaks
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-4 max-w-[1600px] mx-auto overflow-hidden relative">

            {/* Top Column on Mobile / Right Column on Desktop: Persona Details */}
            <div className="w-full lg:w-[320px] flex-shrink-0 hidden lg:flex flex-col gap-2 md:gap-4 order-1 lg:order-2">
                <div className="bg-[#FAECCB] border border-[#D9C8AA] rounded-2xl p-3 md:p-4 shadow-sm lg:h-full flex flex-col">

                    {/* Header: Title (Desktop Only) */}
                    <div className="justify-between items-center mb-2 md:mb-4 hidden lg:flex">
                        <h3 className="font-bold text-gray-900 tracking-tight text-sm md:text-base">Selected Persona & Reactions</h3>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center lg:items-center justify-between lg:mb-6 lg:relative gap-3 lg:gap-0">

                        {/* Grouped: Avatar + Name + Art */}
                        <div className="flex flex-col lg:flex-col items-center lg:items-center gap-8 md:gap-12 lg:gap-6 min-w-0 w-full pt-4 md:pt-6 lg:pt-0">

                            {/* Avatar & Name */}
                            <div className="flex items-center gap-2 md:gap-3 shrink-0 mb-4 lg:mb-0">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white border border-[#D9C8AA] flex items-center justify-center text-lg md:text-2xl shadow-sm overflow-hidden shrink-0 relative">
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
                                <div className="min-w-0">
                                    <div className="font-bold text-gray-900 text-sm md:text-lg truncate pl-1">{currentPersona.name}</div>
                                </div>
                            </div>

                            {/* Character Art with Floating Live Reactions */}
                            <div className="flex flex-col items-center justify-center relative min-h-[100px] lg:min-h-[250px] group lg:mt-4 lg:w-full shrink-0">

                                {/* Wrapper for Art + Reactions */}
                                <div className="relative pr-5 lg:pr-0">
                                    {characterArtUrl ? (
                                        <div className="w-16 h-24 lg:w-56 lg:h-[300px] relative rounded-lg lg:rounded-2xl overflow-hidden shadow-md border-2 border-[#D9C8AA] bg-[#FDF5E6] transition-all duration-300">
                                            <Image
                                                src={characterArtUrl}
                                                alt={currentPersona.name}
                                                fill
                                                className="object-cover transition-transform duration-500 hover:scale-105"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-24 lg:w-56 lg:h-[300px] bg-white/20 border-2 border-dashed border-[#C4A573]/40 rounded-lg lg:rounded-2xl flex items-center justify-center transition-all group-hover:bg-white/30">
                                            <span className="text-[#C4A573] font-medium text-[8px] lg:text-sm text-center px-1 lg:px-4">Character Art Pending</span>
                                        </div>
                                    )}

                                    {/* Floating Live Reactions */}
                                    <div className="absolute -right-1 lg:-right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 lg:gap-3 z-10 pointer-events-none">
                                        {/* Thinking */}
                                        <div title="Thinking" className={clsx(
                                            "flex items-center justify-center w-6 h-6 lg:w-12 lg:h-12 rounded-full shadow-sm transition-all duration-300 border lg:border-2",
                                            isLoading
                                                ? "bg-[#BCCEE8] border-[#8DA9D4] scale-110 shadow-md ring-2 lg:ring-4 ring-[#BCCEE8]/30"
                                                : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[30%]"
                                        )}>
                                            <Settings className={clsx(
                                                "w-3 h-3 lg:w-6 lg:h-6 transition-colors",
                                                isLoading ? "text-[#2F4770] animate-spin-slow" : "text-gray-400"
                                            )} />
                                        </div>

                                        {/* Explaining */}
                                        <div title="Explaining" className={clsx(
                                            "flex items-center justify-center w-6 h-6 lg:w-12 lg:h-12 rounded-full shadow-sm transition-all duration-300 border lg:border-2",
                                            activeExpression === 'explaining'
                                                ? "bg-[#FAECCB] border-[#D9C8AA] scale-110 shadow-md ring-2 lg:ring-4 ring-[#FAECCB]/40"
                                                : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                                        )}>
                                            <Lightbulb className={clsx(
                                                "w-3 h-3 lg:w-6 lg:h-6 transition-colors",
                                                activeExpression === 'explaining' ? "text-amber-500 fill-amber-500/30 animate-pulse" : "text-gray-400"
                                            )} />
                                        </div>

                                        {/* Happy */}
                                        <div title="Happy" className={clsx(
                                            "flex items-center justify-center w-6 h-6 lg:w-12 lg:h-12 rounded-full shadow-sm transition-all duration-300 border lg:border-2",
                                            activeExpression === 'happy'
                                                ? "bg-[#FAD8C3] border-[#E8B598] scale-110 shadow-md ring-2 lg:ring-4 ring-[#FAD8C3]/40"
                                                : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                                        )}>
                                            <ThumbsUp className={clsx(
                                                "w-3 h-3 lg:w-6 lg:h-6 transition-colors",
                                                activeExpression === 'happy' ? "text-amber-600 fill-amber-600/30 animate-bounce" : "text-gray-400"
                                            )} />
                                        </div>

                                        {/* Angry */}
                                        <div title="Angry" className={clsx(
                                            "flex items-center justify-center w-6 h-6 lg:w-12 lg:h-12 rounded-full shadow-sm transition-all duration-300 border lg:border-2",
                                            activeExpression === 'angry'
                                                ? "bg-[#FCA5A5] border-[#EF4444] scale-110 shadow-md ring-2 lg:ring-4 ring-[#FCA5A5]/40"
                                                : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                                        )}>
                                            <Flame className={clsx(
                                                "w-3 h-3 lg:w-6 lg:h-6 transition-colors",
                                                activeExpression === 'angry' ? "text-red-500 fill-red-500/30 animate-pulse" : "text-gray-400"
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Switcher Button */}
                        <div className="shrink-0 relative lg:absolute lg:right-0 lg:top-0">
                            <button
                                onClick={() => setShowSwitcher(!showSwitcher)}
                                className="text-gray-400 hover:text-gray-600 bg-white/50 p-1.5 rounded-md border border-transparent hover:border-[#D9C8AA] transition-all"
                            >
                                <Edit size={14} className="md:w-4 md:h-4" />
                            </button>

                            {showSwitcher && (
                                <div className="absolute right-0 top-8 w-48 bg-white border border-[#D9C8AA] rounded-xl shadow-lg z-20 overflow-hidden">
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

                </div>
            </div>
            <div className="flex-1 flex flex-col bg-white/70 border border-[#D9C8AA] rounded-2xl p-2 md:p-4 shadow-sm overflow-hidden order-2 lg:order-1 min-h-0 relative">

                {/* Mobile Header (Hidden on Desktop) */}
                <div className="flex lg:hidden items-center justify-between mb-2 px-2 pb-2 border-b border-[#D9C8AA]/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-[#D9C8AA] flex items-center justify-center text-sm shadow-sm overflow-hidden relative">
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
                        <div className="font-bold text-gray-900 text-sm truncate">{currentPersona.name}</div>
                        {/* Live Reactions (Mobile Header) */}
                        <div className="flex flex-row gap-1.5 items-center ml-2">
                            {/* Thinking */}
                            <div title="Thinking" className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 border",
                                isLoading
                                    ? "bg-[#BCCEE8] border-[#8DA9D4] scale-110 shadow-md ring-2 ring-[#BCCEE8]/30"
                                    : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[30%]"
                            )}>
                                <Settings className={clsx(
                                    "w-3 h-3 transition-colors",
                                    isLoading ? "text-[#2F4770] animate-spin-slow" : "text-gray-400"
                                )} />
                            </div>

                            {/* Explained / Normal */}
                            <div title="Explaining" className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 border",
                                (!isLoading && activeExpression === 'explaining')
                                    ? "bg-[#D4E8BC] border-[#A9D48D] scale-110 shadow-md ring-2 ring-[#D4E8BC]/40"
                                    : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                            )}>
                                <Lightbulb className={clsx(
                                    "w-3 h-3 transition-colors",
                                    (!isLoading && activeExpression === 'explaining') ? "text-[#4B702F] animate-pulse" : "text-gray-400"
                                )} />
                            </div>

                            {/* Happy */}
                            <div title="Happy" className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 border",
                                activeExpression === 'happy'
                                    ? "bg-[#FAD8C3] border-[#E8B598] scale-110 shadow-md ring-2 ring-[#FAD8C3]/40"
                                    : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                            )}>
                                <ThumbsUp className={clsx(
                                    "w-3 h-3 transition-colors",
                                    activeExpression === 'happy' ? "text-amber-600 fill-amber-600/30 animate-bounce" : "text-gray-400"
                                )} />
                            </div>

                            {/* Angry */}
                            <div title="Angry" className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 border",
                                activeExpression === 'angry'
                                    ? "bg-[#FCA5A5] border-[#EF4444] scale-110 shadow-md ring-2 ring-[#FCA5A5]/40"
                                    : "bg-white/60 border-white/40 opacity-50 scale-90 grayscale-[50%]"
                            )}>
                                <Flame className={clsx(
                                    "w-3 h-3 transition-colors",
                                    activeExpression === 'angry' ? "text-red-500 fill-red-500/30 animate-pulse" : "text-gray-400"
                                )} />
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowSwitcher(!showSwitcher)} className="text-gray-400 hover:text-gray-600 bg-white border border-[#D9C8AA]/50 rounded p-1 shadow-sm">
                            <Edit size={14} />
                        </button>
                        {showSwitcher && (
                            <div className="absolute top-10 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Persona</h4>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {PERSONAS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setPersona(p.id);
                                                setShowSwitcher(false);
                                                setPredictedExpression(null);
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between mb-2 px-2">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Chat with a Persona Tutor.</h2>
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

                                <div className="max-w-[85%] md:max-w-[80%] flex flex-col min-w-0">
                                    {!isUser && <span className="text-[8px] md:text-xs font-bold text-gray-700 ml-1 mb-0.5 md:mb-1">{currentPersona.name}</span>}
                                    <div className={clsx(
                                        "px-3 py-2 md:px-5 md:py-3.5 shadow-sm text-xs md:text-[15px] leading-relaxed break-words overflow-hidden",
                                        isUser
                                            ? "bg-[#ABC4E9] text-[#1E3A5F] rounded-xl md:rounded-2xl rounded-tr-sm"
                                            : "bg-[#FAECCB] text-[#4A3D24] rounded-xl md:rounded-2xl rounded-tl-sm"
                                    )}>
                                        {isUser ? (
                                            textContent
                                        ) : (
                                            <div className="prose-sm md:prose-base max-w-none text-[#4A3D24] flex flex-col gap-2 relative z-10">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 break-words w-full" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-[#2F4770] hover:text-[#1E3A5F] underline font-medium break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1 block w-full" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1 block w-full" {...props} />,
                                                        li: ({ node, ...props }) => <li className="pl-1 mb-1 leading-relaxed w-full break-words" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-xl md:text-2xl font-bold mt-4 mb-2 first:mt-0 text-[#2C2415]" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-lg md:text-xl font-bold mt-4 mb-2 first:mt-0 text-[#2C2415]" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-base md:text-lg font-bold mt-3 mb-1 first:mt-0 text-[#2C2415]" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-[#2C2415]" {...props} />,
                                                        em: ({ node, ...props }) => <em className="italic text-[#5C4D32]" {...props} />,
                                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#C4A573] pl-4 italic my-2 text-[#5C4D32]" {...props} />,
                                                        hr: ({ node, ...props }) => <hr className="my-4 border-[#D9C8AA]" {...props} />,
                                                        pre: ({ node, ref, ...props }: any) => <div className="my-2 rounded-lg overflow-hidden bg-[#2D2D2D] p-0 border border-gray-700 w-full shadow-inner" {...props} />,
                                                        table: ({ node, ...props }) => <div className="overflow-x-auto my-2 w-full"><table className="min-w-full divide-y divide-[#D9C8AA] border border-[#D9C8AA] rounded-md" {...props} /></div>,
                                                        thead: ({ node, ...props }) => <thead className="bg-[#EEDBAC]" {...props} />,
                                                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-bold text-[#4A3D24] uppercase tracking-wider border-b border-[#D9C8AA]" {...props} />,
                                                        td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap text-sm border-b border-[#D9C8AA]/50" {...props} />,
                                                        code: ({ node, inline, className, children, ...props }: any) => {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            const isCodeBlock = !inline && match;

                                                            const isMultiLine = !inline && children && String(children).includes('\n');

                                                            if (isCodeBlock || isMultiLine) {
                                                                return (
                                                                    <div className="flex flex-col w-full text-left">
                                                                        {match && (
                                                                            <div className="flex items-center justify-between px-3 py-1 bg-[#1E1E1E] border-b border-[#3D3D3D]">
                                                                                <span className="text-[10px] md:text-xs text-gray-400 font-mono">{match[1]}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="p-3 md:p-4 overflow-x-auto bg-[#2D2D2D]">
                                                                            <code className="text-xs md:text-sm text-gray-100 font-mono block min-w-full" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <code className="bg-[#EEDBAC]/70 px-1.5 py-0.5 rounded text-[11px] md:text-[13px] font-mono text-[#786134] whitespace-pre-wrap break-words border border-[#D9C8AA]/30" {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {textContent}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {
                                    isUser && (
                                        <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-[#82A2D4] flex-shrink-0 flex items-center justify-center border border-white shadow-sm mt-1">
                                            <span className="text-white text-[10px] md:text-sm font-bold">U</span>
                                        </div>
                                    )
                                }
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

                {/* Mobile Floating Character Art */}
                <div className="lg:hidden absolute bottom-[55px] right-2 flex flex-row items-end gap-2 pointer-events-none z-10 w-full justify-end">
                    {/* Removed Floating Live Reactions from Mobile Body */}

                    {/* Character Subject */}
                    <div className="w-[96px] h-[144px] relative pointer-events-auto filter drop-shadow-md">
                        {characterArtUrl && (
                            <Image
                                src={characterArtUrl}
                                alt={currentPersona.name}
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-2 flex gap-2 md:gap-3 relative z-20">
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
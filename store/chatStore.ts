import { create } from 'zustand';
import { Persona, PERSONAS } from '@/lib/personas';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

type ChatState = {
    messages: Message[];
    currentPersona: Persona;
    isLoading: boolean;
    setPersona: (personaId: string) => void;
    addMessage: (message: Message) => void;
    setLoading: (loading: boolean) => void;
    clearChat: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    currentPersona: PERSONAS[0], // Default to Desi Senior
    isLoading: false,

    setPersona: (personaId) => {
        const persona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];
        set({ currentPersona: persona, messages: [] }); // Reset chat on persona switch? Or keep context? Let's reset for clarity.
    },

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    setLoading: (isLoading) => set({ isLoading }),

    clearChat: () => set({ messages: [] }),
}));

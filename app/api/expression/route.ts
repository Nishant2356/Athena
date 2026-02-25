import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { PERSONAS } from "@/lib/personas";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages: rawMessages, personaId } = body;

        // Ensure the messages are clean CoreMessages, as the frontend might pass complex objects with `parts` arrays
        const messages = rawMessages.map((m: any) => {
            let textContent = m.content;
            if (!textContent && Array.isArray(m.parts)) {
                textContent = m.parts.map((p: any) => p.text || "").join('');
            }
            return {
                role: m.role || "user",
                content: typeof textContent === "string" ? textContent : ""
            };
        });

        const persona = PERSONAS.find(p => p.id === personaId);
        if (!persona || !persona.expressions?.length) {
            return new Response(JSON.stringify({ expression: "default" }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const validExpressions = ["default", ...persona.expressions];

        // The llama-3.1-8b-instant model supports structured JSON outputs and is very fast for simple classification
        const model = groq("llama-3.1-8b-instant");

        const lastMessage = messages[messages.length - 1];
        const isAssistant = lastMessage?.role === "assistant";

        const systemPrompt = `
You are an emotion-classification module for a virtual tutor named "${persona.name}".
Read the conversation history and the latest message.
${isAssistant ? `The latest message is from the tutor (${persona.name}) itself! Determine what facial expression ${persona.name} should make while saying this message.` : `The latest message is from the user. Determine what facial expression ${persona.name} should instantly show IN REACTION to the user's message.`}

Available expressions: ${validExpressions.join(", ")}.
- Select "shocked" if the message is surprising, upsetting, or about failing an exam.
- Select "happy" if the message represents success, compliments, or positivity.
- Select "sad" if the message represents feeling down, stressed, or heartbroken.
- Select "angry" if the message is furious, extremely annoyed, scolding, or defensive.
- Select "explaining" if the message is explaining a concept or asking a direct "how to" question.
- Select "thinking" ONLY if the message is pondering a very complex puzzle. DO NOT use this for normal conversation.
- Select "default" if nothing else strongly applies.

CRITICAL INSTRUCTION: You MUST reply with ONLY the exact word of the expression from the list above. Do not include any other text, punctuation, or explanation.
`;

        const { text } = await generateText({
            model,
            system: systemPrompt,
            messages: messages as any, // Cast to any to bypass strict SDK signature checks if needed
            temperature: 0.1, // Low temp for more deterministic classification
        });

        // Clean up the response just in case
        const predicted = text.trim().toLowerCase();
        const finalExpression = validExpressions.includes(predicted) ? predicted : "default";

        return new Response(JSON.stringify({ expression: finalExpression }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Emotion Agent Error:", error);
        return new Response(JSON.stringify({ expression: "default", error: "Failed to predict emotion" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

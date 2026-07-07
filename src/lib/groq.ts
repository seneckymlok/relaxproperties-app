/**
 * Minimal Groq client (OpenAI-compatible chat completions).
 *
 * Groq offers a free API key with fast Llama inference — used across the app
 * for property SEO metadata, description generation and natural-language search.
 * Get a key at https://console.groq.com and set GROQ_API_KEY in .env.local.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Default model — fast, capable, and free on Groq's tier. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface GroqMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface GroqOptions {
    /** Force a valid JSON object response (prompt must mention "JSON"). */
    json?: boolean;
    /** Sampling temperature. Lower = more deterministic. */
    temperature?: number;
    model?: string;
}

/**
 * Send a chat completion request to Groq and return the assistant's text.
 * Throws if GROQ_API_KEY is missing or the API returns an error.
 */
export async function groqChat(
    messages: GroqMessage[],
    { json = false, temperature = 0.7, model = GROQ_MODEL }: GroqOptions = {}
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY nie je nastavený. Pridajte GROQ_API_KEY do .env.local");
    }

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 500)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

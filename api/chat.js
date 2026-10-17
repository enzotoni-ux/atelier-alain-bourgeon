// Endpoint de chat branché sur une API LLM gratuite compatible OpenAI
// (Groq, OpenRouter, Mistral, Gemini en mode OpenAI…).
// Variables d'environnement Vercel :
//   LLM_API_KEY  (obligatoire) clé du fournisseur
//   LLM_API_URL  (optionnel)   défaut : https://api.groq.com/openai/v1/chat/completions
//   LLM_MODEL    (optionnel)   défaut : llama-3.1-8b-instant

const API_URL = process.env.LLM_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.LLM_MODEL || "llama-3.1-8b-instant";

const MAX_MESSAGES = 10;
const MAX_CHARS = 1000;
const RATE_LIMIT = 15; // requêtes par IP et par minute (par instance serverless)
const hits = new Map();

const SYSTEM_PROMPT = `Tu es l'assistant de L'Atelier Alain Bourgeon, qui crée des maquettes d'architecture artisanales (chaumière, colombages, manoir, ruine, tour).
Réponds en français, sauf si l'utilisateur écrit en anglais. Sois bref et factuel.
Tu n'as aucune information fiable sur les prix, délais ou stocks : n'en invente jamais et renvoie vers la page contact.html pour un devis.
Ne sors pas de ce sujet.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  if (!process.env.LLM_API_KEY) {
    return res.status(500).json({ error: "Chat non configuré." });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "inconnu";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Trop de messages, réessayez dans une minute." });
  }

  const messages = sanitize(req.body && req.body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Message invalide." });
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 400,
        temperature: 0.4
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur LLM :", data);
      return res.status(502).json({ error: "Le service de chat est indisponible." });
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// On ne garde que user/assistant : le client ne peut pas injecter de message "system".
function sanitize(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

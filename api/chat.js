// Endpoint de chat branché sur plusieurs API LLM gratuites (format OpenAI).
// Les fournisseurs sont essayés dans l'ordre ; si l'un échoue (quota, panne),
// on passe au suivant. Seuls ceux dont la clé est définie dans Vercel sont utilisés.
// Chaque modèle peut être remplacé par une variable <NOM>_MODEL (ex. GROQ_MODEL).
// Les modèles par défaut sont à vérifier : les offres gratuites changent souvent.

const PROVIDERS = [
  { name: "GROQ", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant" },
  { name: "CEREBRAS", url: "https://api.cerebras.ai/v1/chat/completions", model: "llama3.1-8b" },
  { name: "GEMINI", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.0-flash" },
  { name: "MISTRAL", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest" },
  { name: "OPENROUTER", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free" }
].map(p => ({ ...p, key: process.env[p.name + "_API_KEY"], model: process.env[p.name + "_MODEL"] || p.model }))
 .filter(p => p.key);

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

  if (!PROVIDERS.length) {
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

  const payload = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  for (const provider of PROVIDERS) {
    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: provider.model,
          messages: payload,
          max_tokens: 400,
          temperature: 0.4
        }),
        signal: AbortSignal.timeout(15000)
      });

      const data = await response.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "";

      if (response.ok && reply) {
        return res.status(200).json({ reply, provider: provider.name.toLowerCase() });
      }
      console.error(`Erreur ${provider.name} :`, response.status, data);
    } catch (error) {
      console.error(`Erreur ${provider.name} :`, error);
    }
  }

  return res.status(502).json({ error: "Le service de chat est indisponible." });
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

const MAX_RECIPIENTS = 10;
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { emails, link, from, turnstileToken } = req.body || {};

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Ajoutez au moins une adresse e-mail." });
    }
    const recipients = [...new Set(emails.map(e => String(e).trim().toLowerCase()))];
    if (recipients.length > MAX_RECIPIENTS) {
      return res.status(400).json({ error: `${MAX_RECIPIENTS} invités maximum par envoi.` });
    }
    if (!recipients.every(e => EMAIL_RE.test(e) && e.length <= 254)) {
      return res.status(400).json({ error: "Une des adresses e-mail n'est pas valide." });
    }

    // Le lien doit pointer vers la page de visio de ce site : l'endpoint ne doit pas
    // servir à diffuser des liens arbitraires sous le nom de l'atelier.
    let url;
    try { url = new URL(String(link)); } catch { url = null; }
    if (!url || url.host !== req.headers.host || !(url.pathname === "/" || url.pathname.endsWith("/index.html")) ||
        !/^#[a-z0-9-]{3,40}$/.test(url.hash)) {
      return res.status(400).json({ error: "Lien de réunion invalide." });
    }

    if (!turnstileToken) {
      return res.status(400).json({ error: "Veuillez valider la vérification anti-robot." });
    }
    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", process.env.TURNSTILE_SECRET_KEY || "");
    verifyBody.append("response", turnstileToken);
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody.toString()
    });
    const verifyData = await verify.json();
    if (!verifyData.success) {
      return res.status(403).json({ error: "Vérification anti-robot refusée." });
    }

    const sender = String(from || "").replace(/[\r\n<>]/g, "").trim().slice(0, 30) || "Quelqu'un";
    const safeLink = escapeHtml(url.href);

    const results = await Promise.all(recipients.map(async to => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.INVITE_FROM || "Atelier Alain Bourgeon <onboarding@resend.dev>",
          to: [to],
          subject: `${sender} vous invite à une visioconférence`,
          html: `
            <p>${escapeHtml(sender)} vous invite à rejoindre une visioconférence.</p>
            <p><a href="${safeLink}" style="display:inline-block;padding:10px 24px;background:#1a73e8;color:#fff;border-radius:24px;text-decoration:none;font-weight:600">Participer à la réunion</a></p>
            <p>Ou copiez ce lien : <br>${safeLink}</p>
            <p style="color:#5f6368;font-size:12px">Aucun compte n'est nécessaire. Ouvrez le lien dans Chrome, Edge, Firefox ou Safari et autorisez la caméra et le micro.</p>
          `
        })
      });
      if (!r.ok) console.error("Erreur Resend :", await r.text());
      return { to, ok: r.ok };
    }));

    const failed = results.filter(r => !r.ok).map(r => r.to);
    return res.status(200).json({ sent: results.length - failed.length, failed });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

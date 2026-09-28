export default async function handler(req, res) {
  // On accepte uniquement les envois POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      nom,
      email,
      telephone,
      origine,
      format,
      typeMaquette,
      projet,
      delai,
      photos = [],
      documents = [],
      turnstileToken
    } = req.body;

    // Vérification minimale
    if (!nom || !email) {
      return res.status(400).json({
        error: "Le nom et l'email sont obligatoires."
      });
    }

    if (!turnstileToken) {
      return res.status(400).json({ error: "Veuillez valider la vérification anti-robot." });
    }

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", process.env.TURNSTILE_SECRET_KEY || "");
    verifyBody.append("response", turnstileToken);

    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody.toString()
    });
    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      console.error("Erreur Turnstile :", verifyData);
      return res.status(403).json({ error: "Vérification anti-robot refusée." });
    }

    const response = await fetch(
      "https://api.airtable.com/v0/appdGPOIhuP8pDo1d/tbllzqwVXU3dPxLJz",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.airtable_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            "Nom Complet": nom,
            "Emails": email,
            "Téléphone": telephone || "",
            "Origine": origine || "Site internet",
            "Format souhaité": format || null,
            "Type de maquette souhaité": typeMaquette || null,
            "Votre projet": projet || "",
            "Délai souhaité": delai || null
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Airtable :", data);
      return res.status(response.status).json({
        error: "Impossible d'enregistrer la demande."
      });
    }

    // Enregistrement des photos et documents dans la table "Pièces jointes".
    const attachmentRecords = [
      ...photos.map(file => ({
        fields: {
          "Photos": [{ url: file.url, filename: file.filename }],
          "Description": `Envoyé depuis le formulaire par ${nom}`
        }
      })),
      ...documents.map(file => ({
        fields: {
          "Documents": [{ url: file.url, filename: file.filename }],
          "Description": `Envoyé depuis le formulaire par ${nom}`
        }
      }))
    ];

    if (attachmentRecords.length) {
      const attachmentResponse = await fetch(
        "https://api.airtable.com/v0/appdGPOIhuP8pDo1d/tbl7t2k4psKk7tcMi",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.airtable_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ records: attachmentRecords })
        }
      );

      const attachmentData = await attachmentResponse.json();
      if (!attachmentResponse.ok) {
        console.error("Erreur Airtable pièces jointes :", attachmentData);
      }
    }

    // Notification email via Resend.
    // Avec le domaine de test Resend, l'envoi est autorisé vers l'adresse du compte Resend.
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Atelier Alain Bourgeon <onboarding@resend.dev>",
        to: ["enzotoni@gmail.com"],
        reply_to: email,
        subject: `Nouvelle demande de maquette — ${nom}`,
        html: `
          <h2>Nouvelle demande depuis le site Atelier Alain Bourgeon</h2>
          <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(telephone || "Non renseigné")}</p>
          <p><strong>Origine :</strong> ${escapeHtml(origine || "Site internet")}</p>
          <p><strong>Format :</strong> ${escapeHtml(format || "Non renseigné")}</p>
          <p><strong>Type de maquette :</strong> ${escapeHtml(typeMaquette || "Non renseigné")}</p>
          <p><strong>Délai souhaité :</strong> ${escapeHtml(delai || "Non renseigné")}</p>
          <p><strong>Projet :</strong></p>
          <p>${escapeHtml(projet || "Non renseigné").replace(/\n/g, "<br>")}</p>
          <p><strong>Photos jointes :</strong> ${photos.length}</p>
          <p><strong>Documents joints :</strong> ${documents.length}</p>
        `
      })
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      // La demande reste enregistrée dans Airtable même si la notification email échoue.
      console.error("Erreur Resend :", emailData);
      return res.status(200).json({
        success: true,
        emailSent: false,
        message: "Votre demande a bien été enregistrée."
      });
    }

    return res.status(200).json({
      success: true,
      emailSent: true,
      message: "Votre demande a bien été envoyée."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur serveur."
    });
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

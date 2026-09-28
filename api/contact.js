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
      delai
    } = req.body;

    // Vérification minimale
    if (!nom || !email) {
      return res.status(400).json({
        error: "Le nom et l'email sont obligatoires."
      });
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

    return res.status(200).json({
      success: true,
      message: "Votre demande a bien été envoyée."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur serveur."
    });
  }
}

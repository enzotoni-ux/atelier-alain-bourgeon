import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const filename = decodeURIComponent(String(req.headers["x-file-name"] || "fichier"));
    const contentType = String(req.headers["content-type"] || "application/octet-stream");

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ error: "Type de fichier non autorisé." });
    }

    const chunks = [];
    let size = 0;

    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_FILE_SIZE) {
        return res.status(413).json({ error: "Fichier trop volumineux (4 Mo maximum)." });
      }
      chunks.push(chunk);
    }

    if (!size) {
      return res.status(400).json({ error: "Fichier vide." });
    }

    const safeName = filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    const blob = await put(
      `demandes/${Date.now()}-${safeName}`,
      Buffer.concat(chunks),
      {
        access: "public",
        addRandomSuffix: true,
        contentType
      }
    );

    return res.status(200).json({
      url: blob.url,
      filename
    });
  } catch (error) {
    console.error("Erreur Blob :", error);
    return res.status(500).json({ error: "Impossible d'envoyer le fichier." });
  }
}

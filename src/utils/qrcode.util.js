/**
 * Utilitaire de génération de QR Code.
 * Utilise le package `qrcode` pour produire un QR Code
 * encodé en Data URL (base64 PNG) lisible par les navigateurs.
 */

const QRCode = require("qrcode");

/**
 * Génère un QR Code à partir d'un texte.
 * @param {string} text - Texte à encoder (ex: UUID d'inscription)
 * @returns {Promise<string>} Data URL base64 du QR Code (image PNG)
 */
const generateQRCode = async (text) => {
  try {
    // toDataURL retourne une chaîne "data:image/png;base64,..."
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H", // Haute tolérance aux erreurs
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (err) {
    throw new Error(`Erreur génération QR Code : ${err.message}`);
  }
};

module.exports = { generateQRCode };

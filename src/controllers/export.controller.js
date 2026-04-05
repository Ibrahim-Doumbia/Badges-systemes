const ExportService = require("../services/export.service");
const { error }     = require("../utils/response.util");

class ExportController {

  /**
   * GET /api/events/:eventId/participants/export?format=csv|xlsx
   * Exporte la liste des participants d'un événement.
   */
  static async exportParticipants(req, res) {
    try {
      const { eventId } = req.params;
      const format      = (req.query.format || "csv").toLowerCase();

      if (format === "xlsx") {
        const buffer = await ExportService.exportParticipantsXLSX(eventId);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="participants-${eventId}.xlsx"`);
        return res.send(buffer);
      }

      // CSV par défaut
      const csv = await ExportService.exportParticipantsCSV(eventId);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="participants-${eventId}.csv"`);
      return res.send("\uFEFF" + csv); // BOM UTF-8 pour Excel
    } catch (err) {
      return error(res, err.message, err.message.includes("introuvable") ? 404 : 500);
    }
  }

  /**
   * POST /api/events/:eventId/participants/import
   * Importe les participants depuis un fichier CSV ou Excel.
   * Corps : multipart/form-data, champ "file"
   */
  static async importParticipants(req, res) {
    try {
      if (!req.file) {
        return error(res, "Fichier manquant (champ 'file' requis)", 400);
      }

      const { eventId } = req.params;
      const { buffer, mimetype, originalname } = req.file;

      const results = await ExportService.importParticipants(eventId, buffer, mimetype, originalname);

      return res.status(200).json({
        success: true,
        message: `Import terminé : ${results.created} créé(s), ${results.skipped} ignoré(s)`,
        data: results,
      });
    } catch (err) {
      return error(res, err.message, err.message.includes("introuvable") ? 404 : 500);
    }
  }

  /**
   * GET /api/events/:eventId/badges/download
   * Télécharge tous les badges d'un événement dans un fichier ZIP.
   */
  static async downloadAllBadges(req, res) {
    try {
      const { eventId } = req.params;
      const zipBuffer   = await ExportService.downloadAllBadgesZIP(eventId);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="badges-${eventId}.zip"`);
      return res.send(zipBuffer);
    } catch (err) {
      return error(res, err.message, err.message.includes("introuvable") ? 404 : 500);
    }
  }

  /**
   * GET /api/badges/:id/download
   * Télécharge le badge PDF d'une inscription spécifique.
   */
  static async downloadBadge(req, res) {
    try {
      const { pdfBuffer, participant, event } = await ExportService.downloadBadgePDF(req.params.id);

      const safe     = (str) => (str || "").replace(/[^a-zA-Z0-9\-_]/g, "_");
      const filename = `badge_${safe(participant.nom)}_${safe(participant.prenom)}_${safe(event.title)}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (err) {
      return error(res, err.message, err.message.includes("introuvable") ? 404 : 500);
    }
  }
}

module.exports = ExportController;

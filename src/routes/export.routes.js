const express  = require("express");
const multer   = require("multer");
const router   = express.Router({ mergeParams: true });

const ExportController = require("../controllers/export.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

// Multer en mémoire : le fichier importé reste en Buffer (pas de disque)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter(req, file, cb) {
    const allowed = [
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const ext = (file.originalname || "").split(".").pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ext === "csv" || ext === "xlsx" || ext === "xls") {
      cb(null, true);
    } else {
      cb(new Error("Format non supporté. Utilisez CSV ou XLSX."));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Export / Import
 *   description: Export CSV/Excel des participants, import en masse, téléchargement des badges
 */

// ─── Participants ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /events/{eventId}/participants/export:
 *   get:
 *     summary: Exporter les participants d'un événement
 *     description: Retourne la liste des participants inscrits au format CSV ou Excel.
 *     tags: [Export / Import]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: csv
 *         description: Format du fichier exporté
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Événement introuvable
 */
router.get(
  "/events/:eventId/participants/export",
  requireRole(["staff", "organisateur"]),
  ExportController.exportParticipants
);

/**
 * @swagger
 * /events/{eventId}/participants/import:
 *   post:
 *     summary: Importer des participants en masse
 *     description: >
 *       Importe une liste de participants depuis un fichier CSV ou Excel.
 *       Colonnes requises : nom, prenom, email, telephone, fonction, organisation, localite, categorie.
 *       Les participants existants (même email) sont retrouvés ; les inscriptions en double sont ignorées.
 *     tags: [Export / Import]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier CSV ou XLSX
 *     responses:
 *       200:
 *         description: Import terminé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ligne:
 *                             type: integer
 *                           message:
 *                             type: string
 *       400:
 *         description: Fichier manquant ou format invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Événement introuvable
 */
router.post(
  "/events/:eventId/participants/import",
  requireRole(["organisateur", "staff"]),
  upload.single("file"),
  ExportController.importParticipants
);

// ─── Badges ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /events/{eventId}/badges/download:
 *   get:
 *     summary: Télécharger tous les badges d'un événement (ZIP)
 *     description: Génère un fichier ZIP contenant un PDF par participant inscrit avec un badge.
 *     tags: [Export / Import]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Archive ZIP téléchargée
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Événement introuvable ou aucun badge généré
 */
router.get(
  "/events/:eventId/badges/download",
  requireRole(["staff", "organisateur"]),
  ExportController.downloadAllBadges
);

/**
 * @swagger
 * /badges/{id}/download:
 *   get:
 *     summary: Télécharger un badge en PDF
 *     description: Génère et retourne le PDF du badge pour un identifiant de badge donné.
 *     tags: [Export / Import]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF téléchargé
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Badge introuvable
 */
router.get(
  "/badges/:id/download",
  ExportController.downloadBadge
);

module.exports = router;

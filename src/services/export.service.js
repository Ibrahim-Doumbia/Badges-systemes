/**
 * Service Export / Import / Téléchargement.
 *
 * - exportParticipantsCSV   : liste des participants d'un événement au format CSV
 * - exportParticipantsXLSX  : idem au format Excel (.xlsx)
 * - importParticipants      : création en masse depuis CSV ou XLSX
 * - downloadAllBadgesZIP    : tous les badges PDF d'un événement dans un ZIP
 * - downloadBadgePDF        : badge PDF d'une seule inscription
 */

const ExcelJS  = require("exceljs");
const archiver = require("archiver");
const { Badge, Inscription, Participant, Event, Category } = require("../models");
const { generateBadgePDF } = require("../utils/badge-pdf.util");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise un nom de colonne : supprime les accents, met en minuscule, trim.
 * "Prénom" → "prenom" | "Catégorie" → "categorie" | "Téléphone" → "telephone"
 */
function normalizeHeader(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Analyse une ligne CSV en tenant compte des guillemets. */
function parseCSVLine(line, sep) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/** Détecte le séparateur (tabulation, point-virgule ou virgule) à partir de la première ligne. */
function detectSeparator(firstLine) {
  const tabs       = (firstLine.match(/\t/g)    || []).length;
  const semicolons = (firstLine.match(/;/g)     || []).length;
  const commas     = (firstLine.match(/,/g)     || []).length;
  if (tabs > 0 && tabs >= semicolons && tabs >= commas) return "\t";
  return semicolons > commas ? ";" : ",";
}

/** Sécurise une valeur pour l'insertion dans une cellule CSV. */
function csvCell(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class ExportService {

  /** Charge toutes les inscriptions d'un événement avec participant, catégorie et badge. */
  static async _getEventData(eventId) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new Error("Événement introuvable");

    const inscriptions = await Inscription.findAll({
      where: { event_id: eventId },
      include: [
        { model: Participant, as: "participant" },
        { model: Category,    as: "category"    },
        { model: Badge,       as: "badge"        },
      ],
      order: [["date_inscription", "ASC"]],
    });

    return { event, inscriptions };
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────

  static async exportParticipantsCSV(eventId) {
    const { inscriptions } = await this._getEventData(eventId);

    const headers = [
      "nom", "prenom", "email", "telephone",
      "fonction", "organisation", "localite",
      "categorie", "statut_inscription", "date_inscription",
    ];

    const rows = inscriptions.map((ins) => {
      const p = ins.participant;
      return [
        p.nom          || "",
        p.prenom       || "",
        p.email        || "",
        p.telephone    || "",
        p.fonction     || "",
        p.organisation || "",
        p.localite     || "",
        ins.category?.name || "",
        ins.statut     || "",
        new Date(ins.date_inscription).toLocaleDateString("fr-FR"),
      ].map(csvCell).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  // ── Export XLSX ─────────────────────────────────────────────────────────────

  static async exportParticipantsXLSX(eventId) {
    const { event, inscriptions } = await this._getEventData(eventId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator  = "Badges Système";
    workbook.created  = new Date();

    const sheet = workbook.addWorksheet("Participants");

    sheet.columns = [
      { header: "Nom",               key: "nom",               width: 20 },
      { header: "Prénom",            key: "prenom",            width: 20 },
      { header: "Email",             key: "email",             width: 32 },
      { header: "Téléphone",         key: "telephone",         width: 16 },
      { header: "Fonction",          key: "fonction",          width: 22 },
      { header: "Organisation",      key: "organisation",      width: 26 },
      { header: "Localité",          key: "localite",          width: 20 },
      { header: "Catégorie",         key: "categorie",         width: 20 },
      { header: "Statut",            key: "statut",            width: 14 },
      { header: "Date inscription",  key: "date_inscription",  width: 18 },
    ];

    // En-tête stylisée
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 22;

    inscriptions.forEach((ins) => {
      const p = ins.participant;
      sheet.addRow({
        nom:              p.nom          || "",
        prenom:           p.prenom       || "",
        email:            p.email        || "",
        telephone:        p.telephone    || "",
        fonction:         p.fonction     || "",
        organisation:     p.organisation || "",
        localite:         p.localite     || "",
        categorie:        ins.category?.name || "",
        statut:           ins.statut     || "",
        date_inscription: new Date(ins.date_inscription).toLocaleDateString("fr-FR"),
      });
    });

    // Bordures sur toutes les cellules
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top:    { style: "thin" },
          left:   { style: "thin" },
          bottom: { style: "thin" },
          right:  { style: "thin" },
        };
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  /**
   * Importe les participants depuis un buffer CSV ou XLSX.
   * Crée le participant (ou le retrouve par email) et crée l'inscription si absente.
   *
   * @param {string}  eventId
   * @param {Buffer}  buffer    - Contenu du fichier uploadé
   * @param {string}  mimetype  - MIME type du fichier (peut être imprécis)
   * @param {string}  filename  - Nom original du fichier (utilisé pour détecter le format)
   * @returns {{ created, skipped, errors }}
   */
  static async importParticipants(eventId, buffer, mimetype, filename = "") {
    const event = await Event.findByPk(eventId);
    if (!event) throw new Error("Événement introuvable");

    // Récupérer les catégories de cet événement une seule fois
    const categories = await Category.findAll({ where: { event_id: eventId } });
    const catByName  = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    let rows = []; // [{ nom, prenom, email, telephone, fonction, organisation, localite, categorie }]

    // L'extension du fichier est plus fiable que le MIME (Windows renvoie parfois
    // application/octet-stream ou application/vnd.ms-excel pour les CSV).
    const ext = (filename || "").split(".").pop().toLowerCase();
    const isXLSX =
      ext === "xlsx" || ext === "xls" ||
      mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (isXLSX) {
      rows = await this._parseXLSX(buffer);
    } else {
      rows = this._parseCSV(buffer);
    }

    const results = { created: 0, skipped: 0, errors: [], total_lignes: rows.length };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // ligne Excel (1 = en-tête)

      try {
        if (!row.email) {
          results.errors.push({ ligne: lineNum, message: "Email manquant" });
          continue;
        }

        const catName = (row.categorie || row.category || "").toLowerCase().trim();
        if (!catName) {
          results.errors.push({ ligne: lineNum, message: "Colonne 'categorie' manquante ou vide" });
          continue;
        }

        const category = catByName.get(catName);
        if (!category) {
          results.errors.push({
            ligne: lineNum,
            message: `Catégorie "${row.categorie || row.category}" introuvable pour cet événement`,
          });
          continue;
        }

        // Créer ou retrouver le participant
        const [participant] = await Participant.findOrCreate({
          where: { email: row.email.toLowerCase().trim() },
          defaults: {
            nom:          row.nom          || "",
            prenom:       row.prenom       || "",
            telephone:    row.telephone    || "",
            fonction:     row.fonction     || "",
            organisation: row.organisation || "",
            localite:     row.localite     || "",
          },
        });

        // Vérifier inscription existante
        const existing = await Inscription.findOne({
          where: { participant_id: participant.id, event_id: eventId },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await Inscription.create({
          participant_id: participant.id,
          event_id:       eventId,
          category_id:    category.id,
          statut:         "confirmed",
        });

        results.created++;
      } catch (err) {
        results.errors.push({ ligne: lineNum, message: err.message });
      }
    }

    return results;
  }

  /** Analyse un CSV et retourne un tableau d'objets avec les colonnes en clés (sans accents). */
  static _parseCSV(buffer) {
    const text  = buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) throw new Error("Le fichier CSV ne contient pas de données");

    const sep     = detectSeparator(lines[0]);
    const headers = parseCSVLine(lines[0], sep).map((h) =>
      normalizeHeader(h.replace(/^"|"$/g, ""))
    );

    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line, sep);
      const row = {};
      headers.forEach((h, idx) => {
        if (h) row[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
      });
      return row;
    }).filter((row) => Object.values(row).some((v) => v));
  }

  /** Analyse un fichier XLSX et retourne un tableau d'objets (en-têtes normalisés sans accents). */
  static async _parseXLSX(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Le fichier Excel ne contient aucune feuille");

    // Collecter toutes les lignes sous forme de tableaux de valeurs (position = colonne)
    const rawRows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values[colNumber - 1] = (cell.text || String(cell.value ?? "")).trim();
      });
      rawRows.push(values);
    });

    if (rawRows.length < 2) throw new Error("Le fichier Excel ne contient pas de données");

    // Normaliser les en-têtes (supprime accents, met en minuscule)
    const headers = rawRows[0].map((h) => normalizeHeader(h));

    return rawRows.slice(1).map((values) => {
      const obj = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = String(values[idx] ?? "").trim();
      });
      return obj;
    }).filter((obj) => Object.values(obj).some((v) => v));
  }

  // ── Téléchargement ZIP (tous les badges) ────────────────────────────────────

  /**
   * Génère un ZIP contenant le badge PDF de chaque inscription confirmée
   * avec un badge pour l'événement donné.
   * @returns {Promise<Buffer>}
   */
  static async downloadAllBadgesZIP(eventId) {
    const { event, inscriptions } = await this._getEventData(eventId);

    const withBadge = inscriptions.filter((ins) => ins.badge);
    if (withBadge.length === 0) throw new Error("Aucun badge généré pour cet événement");

    return new Promise(async (resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 6 } });
      const chunks  = [];

      archive.on("data",  (chunk) => chunks.push(chunk));
      archive.on("end",   () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);

      for (const ins of withBadge) {
        try {
          const pdfBuffer = await generateBadgePDF({
            participant: ins.participant,
            event,
            category:    ins.category,
            badge:       ins.badge,
          });

          const safe = (str) => (str || "").replace(/[^a-zA-Z0-9\-_]/g, "_");
          const filename = `badge_${safe(ins.participant.nom)}_${safe(ins.participant.prenom)}.pdf`;
          archive.append(pdfBuffer, { name: filename });
        } catch {
          // Un badge en erreur ne bloque pas les autres
        }
      }

      archive.finalize();
    });
  }

  // ── Téléchargement badge seul ───────────────────────────────────────────────

  /**
   * Génère le PDF d'un badge spécifique.
   * @param {string} badgeId - UUID du badge
   * @returns {Promise<{ pdfBuffer, participant, event }>}
   */
  static async downloadBadgePDF(badgeId) {
    const badge = await Badge.findByPk(badgeId, {
      include: [
        {
          model: Inscription,
          as:    "inscription",
          include: [
            { model: Participant, as: "participant" },
            { model: Event,       as: "event"       },
            { model: Category,    as: "category"    },
          ],
        },
      ],
    });

    if (!badge) throw new Error("Badge introuvable");

    const { inscription } = badge;

    const pdfBuffer = await generateBadgePDF({
      participant: inscription.participant,
      event:       inscription.event,
      category:    inscription.category,
      badge,
    });

    return { pdfBuffer, participant: inscription.participant, event: inscription.event };
  }
}

module.exports = ExportService;

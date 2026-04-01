/**
 * Contrôleur public — accessible sans authentification.
 *
 * Endpoints :
 *   GET  /api/public/register/:token          → infos de l'événement + catégories disponibles
 *   POST /api/public/register/:token          → inscription d'un participant
 *   GET  /api/public/events/:eventId/qr       → QR code de l'événement (pour affichage jour J)
 */

const { Event, Category, EventType, User, Participant, Inscription } = require("../models");
const { Op } = require("sequelize");
const { generateQRCode } = require("../utils/qrcode.util");
const BadgeService = require("../services/badge.service");
const MailService = require("../services/mail.service");
const { success, error } = require("../utils/response.util");

class PublicController {
  /**
   * GET /api/public/events
   * Retourne les événements actifs en cours ou à venir.
   * Accessible sans authentification.
   */
  static async getEvents(req, res) {
    try {
      const now = new Date();
      const events = await Event.findAll({
        where: {
          isActive: true,
          end_date: { [Op.gte]: now },
        },
        attributes: ["id", "title", "description", "start_date", "end_date", "lieu", "photo_url", "registration_token"],
        include: [
          { model: EventType, as: "eventType", attributes: ["id", "name", "label"] },
          { model: Category, as: "categories", attributes: ["id", "name", "description", "price"] },
        ],
        order: [["start_date", "ASC"]],
      });

      return success(res, events, "Événements en cours et à venir");
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  /**
   * GET /api/public/register/:token
   * Retourne les infos publiques de l'événement et ses catégories.
   * Utilisé par le frontend pour afficher le formulaire d'inscription.
   * Les champs du formulaire sont fixes : nom, prenom, email, telephone, fonction, organisation, localite.
   */
  static async getRegistrationForm(req, res) {
    try {
      const event = await Event.findOne({
        where: { registration_token: req.params.token, isActive: true },
        attributes: ["id", "title", "description", "start_date", "end_date", "lieu", "photo_url"],
        include: [
          { model: EventType, as: "eventType", attributes: ["id", "name", "label"] },
          { model: Category, as: "categories", attributes: ["id", "name", "description", "price"] },
        ],
      });

      if (!event) return error(res, "Lien d'inscription invalide ou événement inactif", 404);

      return success(res, event, "Formulaire d'inscription récupéré");
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  /**
   * POST /api/public/register/:token
   * Inscription publique d'un participant.
   *
   * Body : { nom, prenom, email, telephone, fonction, organisation, localite, category_id }
   *   - email est obligatoire (identifiant unique du participant)
   *   - Si le participant existe déjà (même email), ses données sont réutilisées
   */
  static async register(req, res) {
    try {
      const { nom, prenom, email, telephone, fonction, organisation, localite, category_id } = req.body;

      if (!email) return error(res, "Le champ email est obligatoire", 400);
      if (!category_id) return error(res, "category_id est requis", 400);

      // Récupérer l'événement via le token
      const event = await Event.findOne({
        where: { registration_token: req.params.token, isActive: true },
        include: [
          { model: Category, as: "categories", attributes: ["id", "name", "price", "event_id"] },
        ],
      });

      if (!event) return error(res, "Lien d'inscription invalide ou événement inactif", 404);

      // Vérifier que la catégorie appartient à cet événement
      const category = event.categories.find((c) => c.id === category_id);
      if (!category) return error(res, "Cette catégorie n'appartient pas à cet événement", 400);

      // Retrouver ou créer le participant par email
      const [participant] = await Participant.findOrCreate({
        where: { email },
        defaults: { nom, prenom, email, telephone, fonction, organisation, localite },
      });

      // Vérifier qu'il n'est pas déjà inscrit à cet événement
      const existing = await Inscription.findOne({
        where: { participant_id: participant.id, event_id: event.id },
      });
      if (existing) return error(res, "Vous êtes déjà inscrit à cet événement", 400);

      const inscription = await Inscription.create({
        participant_id: participant.id,
        event_id: event.id,
        category_id,
        statut: "confirmed",
      });

      // Génération automatique du badge
      const badge = await BadgeService.generate(inscription.id);

      // Envoi de l'email de confirmation avec le badge en PDF (non bloquant)
      MailService.sendInscriptionConfirmed({
        to: email,
        participant,
        event,
        category,
        badge,
      }).catch((err) => console.error("[Mail] Échec envoi confirmation inscription :", err.message));

      return success(
        res,
        { inscription_id: inscription.id, participant_id: participant.id, badge },
        "Inscription confirmée. Votre badge vous a été envoyé par email.",
        201
      );
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  /**
   * GET /api/public/events/:eventId/qr
   * Retourne le QR code de l'événement pointant vers le lien d'inscription.
   * Affiché le jour J pour que les participants scannent et s'inscrivent.
   */
  static async getEventQr(req, res) {
    try {
      const event = await Event.findByPk(req.params.eventId, {
        attributes: ["id", "title", "registration_token", "isActive"],
      });

      if (!event) return error(res, "Événement introuvable", 404);
      if (!event.isActive) return error(res, "Événement inactif", 400);

      const registrationUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/register/${event.registration_token}`
        : `${process.env.BASE_URL || "http://localhost:3000"}/api/public/register/${event.registration_token}`;

      const qr_code = await generateQRCode(registrationUrl);

      return success(res, { registration_url: registrationUrl, qr_code }, "QR code généré");
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
}

module.exports = PublicController;

/**
 * Contrôleur public — accessible sans authentification.
 *
 * Endpoints :
 *   GET  /api/public/register/:token          → infos de l'événement + champs du formulaire
 *   POST /api/public/register/:token          → inscription d'un participant via le formulaire
 *   GET  /api/public/events/:eventId/qr       → QR code de l'événement (pour affichage jour J)
 */

const { Event, Category, EventType, EventField, User, Participant, Inscription } = require("../models");
const { generateQRCode } = require("../utils/qrcode.util");
const BadgeService = require("../services/badge.service");
const MailService = require("../services/mail.service");
const { success, error } = require("../utils/response.util");

class PublicController {
  /**
   * GET /api/public/register/:token
   * Retourne les infos publiques de l'événement + les champs du formulaire définis par l'organisateur.
   * Utilisé par le frontend pour afficher le formulaire d'inscription.
   */
  static async getRegistrationForm(req, res) {
    try {
      const event = await Event.findOne({
        where: { registration_token: req.params.token, isActive: true },
        attributes: ["id", "title", "description", "start_date", "end_date", "lieu", "photo_url"],
        include: [
          { model: EventType, as: "eventType", attributes: ["id", "name", "label"] },
          { model: Category, as: "categories", attributes: ["id", "name", "description", "price"] },
          {
            model: EventField,
            as: "fields",
            attributes: ["id", "label", "field_key", "field_type", "is_required", "options", "order"],
            order: [["order", "ASC"]],
          },
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
   * Inscription publique d'un participant via le formulaire dynamique.
   *
   * Body : { form_data: { [field_key]: value, ... }, category_id }
   *   - form_data doit contenir au minimum un champ email (pour identifier le participant)
   *   - Les champs requis sont validés contre les EventField de l'événement
   */
  static async register(req, res) {
    try {
      const { form_data, category_id } = req.body;

      if (!form_data || typeof form_data !== "object") {
        return error(res, "form_data est requis", 400);
      }
      if (!category_id) {
        return error(res, "category_id est requis", 400);
      }

      // Récupérer l'événement via le token
      const event = await Event.findOne({
        where: { registration_token: req.params.token, isActive: true },
        include: [
          { model: EventField, as: "fields" },
          { model: Category, as: "categories", attributes: ["id", "name", "price", "event_id"] },
        ],
      });

      if (!event) return error(res, "Lien d'inscription invalide ou événement inactif", 404);

      // Valider les champs requis
      const missingFields = event.fields
        .filter((f) => f.is_required && !form_data[f.field_key])
        .map((f) => f.label);

      if (missingFields.length > 0) {
        return error(res, `Champs obligatoires manquants : ${missingFields.join(", ")}`, 400);
      }

      // Vérifier que la catégorie appartient à cet événement
      const category = event.categories.find((c) => c.id === category_id);
      if (!category) {
        return error(res, "Cette catégorie n'appartient pas à cet événement", 400);
      }

      // L'email est obligatoire pour identifier le participant
      const email = form_data.email;
      if (!email) {
        return error(res, "Le champ email est obligatoire pour l'inscription", 400);
      }

      // Retrouver ou créer le participant par email
      const [participant] = await Participant.findOrCreate({
        where: { email },
        defaults: {
          email,
          nom: form_data.nom || null,
          prenom: form_data.prenom || null,
          telephone: form_data.telephone || null,
          fonction: form_data.fonction || null,
          organisation: form_data.organisation || null,
          localite: form_data.localite || null,
        },
      });

      // Vérifier qu'il n'est pas déjà inscrit à cet événement
      const existing = await Inscription.findOne({
        where: { participant_id: participant.id, event_id: event.id },
      });
      if (existing) {
        return error(res, "Vous êtes déjà inscrit à cet événement", 400);
      }

      const inscription = await Inscription.create({
        participant_id: participant.id,
        event_id: event.id,
        category_id,
        statut: "confirmed",
        form_data,
      });

      // Génération automatique du badge
      const badge = await BadgeService.generate(inscription.id);

      // Récupérer la catégorie pour l'email (déjà chargée avec name)
      const categoryObj = event.categories.find((c) => c.id === category_id)
        || { name: "Standard" };

      // Envoi de l'email de confirmation avec le badge en PDF (non bloquant)
      MailService.sendInscriptionConfirmed({
        to: email,
        participant,
        event,
        category: categoryObj,
        badge,
        form_data,
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

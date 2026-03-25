/**
 * Contrôleur public — accessible sans authentification.
 *
 * Endpoints :
 *   GET  /api/public/events/:id          → infos de l'événement + catégories + QR code du lien d'inscription
 *   POST /api/public/events/:id/register → inscription d'un participant via le lien QR
 */

const { Event, Category, EventType, User } = require("../models");
const { Participant, Inscription } = require("../models");
const { generateQRCode } = require("../utils/qrcode.util");
const { success, error } = require("../utils/response.util");

class PublicController {
  /**
   * GET /api/public/events/:id
   * Retourne les infos publiques de l'événement + catégories + QR code du lien d'inscription.
   */
  static async getEventInfo(req, res) {
    try {
      const event = await Event.findByPk(req.params.id, {
        attributes: ["id", "title", "description", "start_date", "end_date", "lieu"],
        include: [
          { model: EventType, as: "eventType", attributes: ["id", "name"] },
          { model: User, as: "creator", attributes: ["id", "nom", "prenom"] },
          {
            model: Category,
            as: "categories",
            attributes: ["id", "name", "description", "price"],
          },
        ],
      });

      if (!event) return error(res, "Événement introuvable", 404);

      // URL vers laquelle le QR code pointe (page d'inscription côté frontend)
      const registrationUrl =
        process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/events/${event.id}/register`
          : `${process.env.BASE_URL || "http://localhost:3000"}/api/public/events/${event.id}`;

      const qr_code = await generateQRCode(registrationUrl);

      return success(res, { event, registration_url: registrationUrl, qr_code });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  /**
   * POST /api/public/events/:id/register
   * Inscription publique d'un participant (sans compte requis).
   * Si le participant existe déjà (même email), on le retrouve et on crée l'inscription.
   *
   * Body : { nom, prenom, email, telephone?, fonction?, organisation?, localite?, category_id }
   */
  static async register(req, res) {
    try {
      const event_id = req.params.id;
      const { nom, prenom, email, telephone, fonction, organisation, localite, category_id } = req.body;

      // Validations de base
      if (!nom || !prenom || !email || !category_id) {
        return error(res, "Champs requis : nom, prenom, email, category_id", 400);
      }

      // Vérifier que l'événement existe
      const event = await Event.findByPk(event_id);
      if (!event) return error(res, "Événement introuvable", 404);

      // Vérifier que la catégorie appartient à cet événement
      const category = await Category.findByPk(category_id);
      if (!category) return error(res, "Catégorie introuvable", 404);
      if (category.event_id !== event_id) {
        return error(res, "Cette catégorie n'appartient pas à cet événement", 400);
      }

      // Retrouver ou créer le participant par email
      const [participant] = await Participant.findOrCreate({
        where: { email },
        defaults: { nom, prenom, email, telephone, fonction, organisation, localite },
      });

      // Vérifier qu'il n'est pas déjà inscrit
      const existing = await Inscription.findOne({
        where: { participant_id: participant.id, event_id },
      });
      if (existing) {
        return error(res, "Vous êtes déjà inscrit à cet événement", 400);
      }

      const inscription = await Inscription.create({
        participant_id: participant.id,
        event_id,
        category_id,
        date_inscription: new Date(),
        statut: "pending",
      });

      return success(
        res,
        { inscription_id: inscription.id, participant, category: { name: category.name, price: category.price } },
        "Inscription enregistrée avec succès. Votre badge sera généré à la confirmation.",
        201
      );
    } catch (err) {
      return error(res, err.message, 400);
    }
  }
}

module.exports = PublicController;

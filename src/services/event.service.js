/**
 * Service Event.
 *
 * Responsabilités :
 * - CRUD des événements
 * - Listing paginé avec filtres (type, date, actif)
 * - Création automatique des rôles par défaut à chaque nouvel événement
 * - Inclusion des jours, catégories et rôles associés
 */

const { Event, EventType, EventDay, EventRole, Category, User, UserEvent } = require("../models");
const EventRoleService = require("./event_role.service");
const MailService = require("./mail.service");
const { Op } = require("sequelize");

class EventService {
  /**
   * Crée un événement et génère automatiquement ses rôles d'équipe par défaut.
   * Les rôles créés : Coordinateur, Accueil, Sécurité, Animateur, Logistique, Communication.
   * L'organisateur est choisi explicitement via organisateur_id (obligatoire).
   * Seul l'admin peut créer un événement et désigner un organisateur.
   */
  static async create({ title, description, start_date, end_date, lieu, event_type_id, created_by, organisateur_id }) {
    if (!organisateur_id) throw new Error("L'identifiant de l'organisateur est obligatoire");

    const eventType = await EventType.findByPk(event_type_id);
    if (!eventType) throw new Error("Type d'événement introuvable");

    // Valider que l'organisateur désigné existe et est actif
    const organisateur = await User.findByPk(organisateur_id);
    if (!organisateur) throw new Error("Organisateur introuvable");
    if (!organisateur.isActive) throw new Error("L'organisateur sélectionné est désactivé");

    // Création de l'événement
    const event = await Event.create({
      title, description, start_date, end_date, lieu, event_type_id, created_by,
    });

    // Création automatique des rôles par défaut pour cet événement
    await EventRoleService.createDefaults(event.id);

    // Assigner l'organisateur désigné (pas forcément le créateur) au rôle "Organisateur"
    const organisateurRole = await EventRole.findOne({
      where: { event_id: event.id, name: "Organisateur" },
    });
    if (organisateurRole) {
      await UserEvent.create({
        user_id: organisateur_id,
        event_id: event.id,
        event_role_id: organisateurRole.id,
      });
    }

    // Récupérer l'événement complet pour la réponse et l'email
    const fullEvent = await EventService.getById(event.id);

    // Envoyer l'email de confirmation à l'organisateur désigné
    MailService.sendEventCreated({
      to: organisateur.email,
      prenom: organisateur.prenom,
      nom: organisateur.nom,
      event: fullEvent,
    }).catch((err) => console.error("[Mail] Échec envoi email création événement :", err.message));

    return fullEvent;
  }

  static async getAll({ limit, offset, search, event_type_id, isActive }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (event_type_id) where.event_type_id = event_type_id;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        { model: EventType, as: "eventType", attributes: ["id", "name", "label"] },
        { model: User, as: "creator", attributes: ["id", "nom", "prenom"] },
        { model: EventDay, as: "days" },
        { model: Category, as: "categories" },
        { model: EventRole, as: "roles", attributes: ["id", "name"] },
      ],
      limit,
      offset,
      order: [["start_date", "DESC"]],
      distinct: true,
    });

    return { count, rows };
  }

  static async getById(id) {
    const event = await Event.findByPk(id, {
      include: [
        { model: EventType, as: "eventType" },
        { model: User, as: "creator", attributes: ["id", "nom", "prenom"] },
        { model: EventDay, as: "days" },
        { model: Category, as: "categories" },
        { model: EventRole, as: "roles", attributes: ["id", "name", "description"] },
      ],
    });
    if (!event) throw new Error("Événement introuvable");
    return event;
  }

  static async update(id, data) {
    const event = await Event.findByPk(id);
    if (!event) throw new Error("Événement introuvable");

    if (data.event_type_id) {
      const eventType = await EventType.findByPk(data.event_type_id);
      if (!eventType) throw new Error("Type d'événement introuvable");
    }

    return await event.update(data);
  }

  static async delete(id) {
    const event = await Event.findByPk(id);
    if (!event) throw new Error("Événement introuvable");
    // Les EventRoles sont supprimés en CASCADE (défini dans models/index.js)
    await event.destroy();
    return { message: "Événement supprimé" };
  }
}

module.exports = EventService;

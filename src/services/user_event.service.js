/**
 * Service UserEvent — Gestion de l'équipe d'un événement.
 *
 * Responsabilités :
 * - Assigner un utilisateur à un événement avec un rôle d'événement
 * - Changer le rôle d'un membre de l'équipe
 * - Retirer un membre de l'équipe
 * - Lister les membres de l'équipe d'un événement
 *
 * Règles métier :
 * - L'utilisateur doit exister et être actif
 * - Le rôle doit appartenir à l'événement concerné
 * - Un utilisateur ne peut être assigné qu'une seule fois au même événement
 */

const { UserEvent, User, Event, EventRole, Role } = require("../models");

class UserEventService {
  /**
   * Assigne un utilisateur à un événement avec un rôle spécifique.
   * @param {string} event_id      - UUID de l'événement
   * @param {string} user_id       - UUID de l'utilisateur à assigner
   * @param {string} event_role_id - UUID du rôle d'événement (doit appartenir à cet événement)
   */
  static async assign({ event_id, user_id, event_role_id }) {
    // Vérifications d'existence
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    const user = await User.findByPk(user_id);
    if (!user) throw new Error("Utilisateur introuvable");
    if (!user.isActive) throw new Error("Impossible d'assigner un compte désactivé");

    const eventRole = await EventRole.findByPk(event_role_id);
    if (!eventRole) throw new Error("Rôle introuvable");

    // Le rôle doit appartenir à cet événement
    if (eventRole.event_id !== event_id) {
      throw new Error("Ce rôle n'appartient pas à cet événement");
    }

    // L'organisateur (créateur de l'événement) ne peut pas être assigné comme staff
    if (event.created_by === user_id) {
      throw new Error("L'organisateur de l'événement ne peut pas être assigné comme membre du staff");
    }

    // Un utilisateur ne peut être assigné qu'une seule fois par événement
    const existing = await UserEvent.findOne({ where: { user_id, event_id } });
    if (existing) throw new Error("Cet utilisateur est déjà dans l'équipe de cet événement");

    const assignment = await UserEvent.create({ user_id, event_id, event_role_id });

    return await UserEventService.getAssignmentById(assignment.id);
  }

  /**
   * Liste paginée des membres de l'équipe d'un événement.
   */
  static async getTeamByEvent(event_id, { limit, offset }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    const { count, rows } = await UserEvent.findAndCountAll({
      where: { event_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nom", "prenom", "email"],
          include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
        },
        {
          model: EventRole,
          as: "eventRole",
          attributes: ["id", "name", "description"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "ASC"]],
    });

    return { count, rows };
  }

  /**
   * Récupère une affectation par son ID.
   */
  static async getAssignmentById(id) {
    const assignment = await UserEvent.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nom", "prenom", "email"],
          include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
        },
        {
          model: EventRole,
          as: "eventRole",
          attributes: ["id", "name", "description"],
        },
        {
          model: Event,
          as: "event",
          attributes: ["id", "title"],
        },
      ],
    });
    if (!assignment) throw new Error("Affectation introuvable");
    return assignment;
  }

  /**
   * Change le rôle d'un membre de l'équipe dans un événement.
   * @param {string} id            - UUID de l'UserEvent
   * @param {string} event_role_id - UUID du nouveau rôle
   */
  static async changeRole(id, event_role_id) {
    const assignment = await UserEvent.findByPk(id);
    if (!assignment) throw new Error("Affectation introuvable");

    const newRole = await EventRole.findByPk(event_role_id);
    if (!newRole) throw new Error("Rôle introuvable");

    // Le nouveau rôle doit appartenir au même événement
    if (newRole.event_id !== assignment.event_id) {
      throw new Error("Ce rôle n'appartient pas à cet événement");
    }

    await assignment.update({ event_role_id });
    return await UserEventService.getAssignmentById(id);
  }

  /**
   * Retire un utilisateur de l'équipe d'un événement.
   */
  static async remove(id) {
    const assignment = await UserEvent.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["nom", "prenom"] },
        { model: EventRole, as: "eventRole", attributes: ["name"] },
      ],
    });
    if (!assignment) throw new Error("Affectation introuvable");

    const { nom, prenom } = assignment.user;
    const roleName = assignment.eventRole?.name;

    await assignment.destroy();
    return { message: `${prenom} ${nom} retiré du rôle "${roleName}"` };
  }
}

module.exports = UserEventService;

/**
 * Service EventRole — Gestion des rôles d'équipe d'un événement.
 *
 * Responsabilités :
 * - Créer les rôles par défaut automatiquement à la création d'un événement
 * - Permettre l'ajout/modification/suppression de rôles personnalisés
 * - Lister les rôles d'un événement
 *
 * Rôles créés par défaut pour chaque événement :
 *   Coordinateur, Accueil, Sécurité, Animateur, Logistique, Communication
 *
 * Ces rôles sont un point de départ. L'admin peut en ajouter ou en supprimer.
 */

const { EventRole, Event, UserEvent, User } = require("../models");

// Liste des rôles créés automatiquement pour chaque nouvel événement
const DEFAULT_ROLES = [
  { name: "Coordinateur",   description: "Responsable de la coordination générale de l'événement" },
  { name: "Accueil",        description: "Gestion de l'accueil et de l'enregistrement des participants" },
  { name: "Sécurité",       description: "Contrôle des accès et sécurité du site" },
  { name: "Animateur",      description: "Animation des sessions et ateliers" },
  { name: "Logistique",     description: "Gestion du matériel et de l'installation" },
  { name: "Communication",  description: "Couverture médiatique et réseaux sociaux" },
];

class EventRoleService {
  /**
   * Crée les rôles par défaut pour un événement.
   * Appelé automatiquement dans EventService.create().
   * @param {string} event_id - UUID de l'événement
   * @returns {Promise<EventRole[]>} Les rôles créés
   */
  static async createDefaults(event_id) {
    const roles = DEFAULT_ROLES.map((r) => ({ ...r, event_id }));
    return await EventRole.bulkCreate(roles);
  }

  /**
   * Ajoute un rôle personnalisé à un événement.
   */
  static async create({ event_id, name, description }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    // Empêche les doublons de nom dans le même événement
    const existing = await EventRole.findOne({ where: { event_id, name } });
    if (existing) throw new Error(`Le rôle "${name}" existe déjà pour cet événement`);

    return await EventRole.create({ event_id, name, description });
  }

  /**
   * Liste tous les rôles d'un événement avec le nombre de membres assignés.
   */
  static async getByEvent(event_id, { limit, offset }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    const { count, rows } = await EventRole.findAndCountAll({
      where: { event_id },
      include: [
        {
          model: UserEvent,
          as: "assignments",
          include: [
            { model: User, as: "user", attributes: ["id", "nom", "prenom", "email"] },
          ],
        },
      ],
      limit,
      offset,
      order: [["name", "ASC"]],
    });

    return { count, rows };
  }

  /**
   * Récupère un rôle par son ID.
   */
  static async getById(id) {
    const role = await EventRole.findByPk(id, {
      include: [
        { model: Event, as: "event", attributes: ["id", "title"] },
        {
          model: UserEvent,
          as: "assignments",
          include: [
            { model: User, as: "user", attributes: ["id", "nom", "prenom", "email"] },
          ],
        },
      ],
    });
    if (!role) throw new Error("Rôle introuvable");
    return role;
  }

  /**
   * Met à jour le nom ou la description d'un rôle.
   */
  static async update(id, { name, description }) {
    const role = await EventRole.findByPk(id);
    if (!role) throw new Error("Rôle introuvable");

    // Vérifie l'unicité du nouveau nom dans le même événement
    if (name && name !== role.name) {
      const existing = await EventRole.findOne({
        where: { event_id: role.event_id, name },
      });
      if (existing) throw new Error(`Le rôle "${name}" existe déjà pour cet événement`);
    }

    return await role.update({ name, description });
  }

  /**
   * Supprime un rôle d'événement.
   * Impossible si des membres sont encore assignés à ce rôle.
   */
  static async delete(id) {
    const role = await EventRole.findByPk(id, {
      include: [{ model: UserEvent, as: "assignments" }],
    });
    if (!role) throw new Error("Rôle introuvable");

    if (role.assignments && role.assignments.length > 0) {
      throw new Error(
        `Impossible de supprimer : ${role.assignments.length} membre(s) sont assignés à ce rôle`
      );
    }

    await role.destroy();
    return { message: `Rôle "${role.name}" supprimé` };
  }
}

module.exports = EventRoleService;

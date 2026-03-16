/**
 * Controller EventRole.
 * Gère les rôles d'équipe propres à chaque événement.
 */

const EventRoleService = require("../services/event_role.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class EventRoleController {
  /**
   * POST /api/events/:eventId/roles
   * Ajoute un rôle personnalisé à un événement.
   */
  static async create(req, res) {
    try {
      const role = await EventRoleService.create({
        ...req.body,
        event_id: req.params.eventId,
      });
      return success(res, role, "Rôle créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * GET /api/events/:eventId/roles
   * Liste paginée des rôles d'un événement avec leurs membres assignés.
   */
  static async getByEvent(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await EventRoleService.getByEvent(req.params.eventId, { limit, offset });
      return paginated(res, rows, count, { page, limit }, "Rôles de l'événement");
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * GET /api/events/:eventId/roles/:id
   */
  static async getOne(req, res) {
    try {
      const role = await EventRoleService.getById(req.params.id);
      return success(res, role, "Rôle récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  /**
   * PUT /api/events/:eventId/roles/:id
   */
  static async update(req, res) {
    try {
      const role = await EventRoleService.update(req.params.id, req.body);
      return success(res, role, "Rôle mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * DELETE /api/events/:eventId/roles/:id
   * Refusé si des membres sont encore assignés à ce rôle.
   */
  static async delete(req, res) {
    try {
      const result = await EventRoleService.delete(req.params.id);
      return success(res, result, "Rôle supprimé");
    } catch (err) {
      return error(res, err.message);
    }
  }
}

module.exports = EventRoleController;

/**
 * Controller UserEvent — Gestion de l'équipe d'un événement.
 * Permet d'assigner des utilisateurs à un événement avec un rôle précis.
 */

const UserEventService = require("../services/user_event.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class UserEventController {
  /**
   * POST /api/events/:eventId/team
   * Assigne un utilisateur à l'équipe d'un événement avec un rôle.
   * Corps : { user_id, event_role_id }
   */
  static async assign(req, res) {
    try {
      const assignment = await UserEventService.assign({
        event_id: req.params.eventId,
        user_id: req.body.user_id,
        event_role_id: req.body.event_role_id,
        requesterRole: req.user.role.name,
      });
      return success(res, assignment, "Utilisateur assigné à l'événement", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * GET /api/events/:eventId/team
   * Liste paginée des membres de l'équipe d'un événement.
   */
  static async getTeam(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await UserEventService.getTeamByEvent(req.params.eventId, { limit, offset });
      return paginated(res, rows, count, { page, limit }, "Équipe de l'événement");
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * PATCH /api/events/:eventId/team/:id/role
   * Change le rôle d'un membre dans l'équipe.
   * Corps : { event_role_id }
   */
  static async changeRole(req, res) {
    try {
      const assignment = await UserEventService.changeRole(
        req.params.id,
        req.body.event_role_id,
        req.user.role.name
      );
      return success(res, assignment, "Rôle mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  /**
   * DELETE /api/events/:eventId/team/:id
   * Retire un utilisateur de l'équipe.
   */
  static async remove(req, res) {
    try {
      const result = await UserEventService.remove(req.params.id);
      return success(res, result, "Membre retiré de l'équipe");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = UserEventController;

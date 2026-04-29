const BadgeService = require("../services/badge.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class BadgeController {
  /**
   * POST /api/badges/generate/:inscriptionId
   */
  static async generate(req, res) {
    try {
      const badge = await BadgeService.generate(req.params.inscriptionId, req.user.id);
      return success(res, badge, "Badge généré", 201);
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : 400;
      return error(res, err.message, status);
    }
  }

  /**
   * GET /api/badges?event_id=...&statut=...&inscription_id=...
   * event_id obligatoire pour tout le monde.
   */
  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { statut, event_id, inscription_id } = req.query;

      const { count, rows } = await BadgeService.getAll({
        limit, offset, statut, event_id, inscription_id, userId: req.user.id,
      });
      return paginated(res, rows, count, { page, limit }, "Liste des badges");
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : err.message.includes("obligatoire") ? 400
                   : 500;
      return error(res, err.message, status);
    }
  }

  /**
   * GET /api/badges/:id
   */
  static async getOne(req, res) {
    try {
      const badge = await BadgeService.getById(req.params.id, req.user.id);
      return success(res, badge, "Badge récupéré");
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : 500;
      return error(res, err.message, status);
    }
  }

  /**
   * PATCH /api/badges/:id/print
   */
  static async markAsPrinted(req, res) {
    try {
      const badge = await BadgeService.markAsPrinted(req.params.id, req.user.id);
      return success(res, badge, "Badge marqué comme imprimé");
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : 400;
      return error(res, err.message, status);
    }
  }

  /**
   * PATCH /api/badges/:id/regenerate
   */
  static async regenerate(req, res) {
    try {
      const badge = await BadgeService.regenerate(req.params.id, req.user.id);
      return success(res, badge, "Badge régénéré");
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : 400;
      return error(res, err.message, status);
    }
  }

  /**
   * PATCH /api/badges/inscription/:inscriptionId/regenerate
   */
  static async regenerateBadge(req, res) {
    try {
      const badge = await BadgeService.regenerateBadge(req.params.inscriptionId, req.user.id);
      return success(res, badge, "Badge régénéré pour l'inscription");
    } catch (err) {
      const status = err.message.includes("introuvable") ? 404
                   : err.message.includes("refusé")      ? 403
                   : 400;
      return error(res, err.message, status);
    }
  }
}

module.exports = BadgeController;

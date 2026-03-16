const BadgeService = require("../services/badge.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class BadgeController {
  /**
   * POST /api/badges/generate/:inscriptionId
   * Génère manuellement un badge pour une inscription.
   */
  static async generate(req, res) {
    try {
      const badge = await BadgeService.generate(req.params.inscriptionId);
      return success(res, badge, "Badge généré", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { statut } = req.query;
      const { count, rows } = await BadgeService.getAll({ limit, offset, statut });
      return paginated(res, rows, count, { page, limit }, "Liste des badges");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const badge = await BadgeService.getById(req.params.id);
      return success(res, badge, "Badge récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async markAsPrinted(req, res) {
    try {
      const badge = await BadgeService.markAsPrinted(req.params.id);
      return success(res, badge, "Badge marqué comme imprimé");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async regenerate(req, res) {
    try {
      const badge = await BadgeService.regenerate(req.params.id);
      return success(res, badge, "Badge régénéré");
    } catch (err) {
      return error(res, err.message);
    }
  }
}

module.exports = BadgeController;

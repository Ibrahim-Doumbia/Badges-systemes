const InscriptionService = require("../services/inscription.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class InscriptionController {
  static async create(req, res) {
    try {
      const inscription = await InscriptionService.create(req.body);
      return success(res, inscription, "Inscription créée", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { event_id, statut } = req.query;
      const { count, rows } = await InscriptionService.getAll({ limit, offset, event_id, statut });
      return paginated(res, rows, count, { page, limit }, "Liste des inscriptions");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const inscription = await InscriptionService.getById(req.params.id);
      return success(res, inscription, "Inscription récupérée");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async updateStatus(req, res) {
    try {
      const inscription = await InscriptionService.updateStatus(req.params.id, req.body.statut);
      return success(res, inscription, "Statut mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await InscriptionService.delete(req.params.id);
      return success(res, result, "Inscription supprimée");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = InscriptionController;

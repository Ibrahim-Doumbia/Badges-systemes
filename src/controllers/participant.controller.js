const ParticipantService = require("../services/participant.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class ParticipantController {
  static async create(req, res) {
    try {
      const participant = await ParticipantService.create(req.body);
      return success(res, participant, "Participant créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search } = req.query;
      const { count, rows } = await ParticipantService.getAll({ limit, offset, search });
      return paginated(res, rows, count, { page, limit }, "Liste des participants");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const participant = await ParticipantService.getById(req.params.id);
      return success(res, participant, "Participant récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const participant = await ParticipantService.update(req.params.id, req.body);
      return success(res, participant, "Participant mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await ParticipantService.delete(req.params.id);
      return success(res, result, "Participant supprimé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = ParticipantController;

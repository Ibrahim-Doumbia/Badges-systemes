const EventFieldService = require("../services/event_field.service");
const { success, error } = require("../utils/response.util");

class EventFieldController {
  static async getAll(req, res) {
    try {
      const fields = await EventFieldService.getByEvent(req.params.eventId);
      return success(res, fields, "Champs du formulaire récupérés");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async create(req, res) {
    try {
      const field = await EventFieldService.create(req.params.eventId, req.body);
      return success(res, field, "Champ créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async update(req, res) {
    try {
      const field = await EventFieldService.update(req.params.id, req.params.eventId, req.body);
      return success(res, field, "Champ mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await EventFieldService.delete(req.params.id, req.params.eventId);
      return success(res, result, "Champ supprimé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = EventFieldController;

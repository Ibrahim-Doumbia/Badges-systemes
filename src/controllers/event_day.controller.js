const EventDayService = require("../services/event_day.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class EventDayController {
  static async create(req, res) {
    try {
      const day = await EventDayService.create({
        ...req.body,
        event_id: req.params.eventId,
      });
      return success(res, day, "Jour créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getByEvent(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await EventDayService.getByEvent(req.params.eventId, { limit, offset });
      return paginated(res, rows, count, { page, limit }, "Jours de l'événement");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const day = await EventDayService.getById(req.params.id);
      return success(res, day, "Jour récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const day = await EventDayService.update(req.params.id, req.body);
      return success(res, day, "Jour mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await EventDayService.delete(req.params.id);
      return success(res, result, "Jour supprimé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = EventDayController;

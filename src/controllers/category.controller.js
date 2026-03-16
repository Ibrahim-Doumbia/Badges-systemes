const CategoryService = require("../services/category.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class CategoryController {
  static async create(req, res) {
    try {
      const category = await CategoryService.create({
        ...req.body,
        event_id: req.params.eventId,
      });
      return success(res, category, "Catégorie créée", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getByEvent(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await CategoryService.getByEvent(req.params.eventId, { limit, offset });
      return paginated(res, rows, count, { page, limit }, "Catégories de l'événement");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id);
      return success(res, category, "Catégorie récupérée");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      return success(res, category, "Catégorie mise à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await CategoryService.delete(req.params.id);
      return success(res, result, "Catégorie supprimée");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = CategoryController;

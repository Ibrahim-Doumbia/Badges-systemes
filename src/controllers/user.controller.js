/**
 * Controller utilisateur.
 * Endpoints réservés aux admins pour gérer les comptes.
 */

const UserService = require("../services/user.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class UserController {
  static async create(req, res) {
    try {
      const user = await UserService.createUser(req.body);
      return success(res, user, "Utilisateur créé avec succès", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search } = req.query;
      const { count, rows } = await UserService.getUsers({ limit, offset, search });
      return paginated(res, rows, count, { page, limit }, "Liste des utilisateurs");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return success(res, user, "Utilisateur récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      return success(res, user, "Utilisateur mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async desactive(req, res) {
    try {
      const result = await UserService.desactiveUser(req.params.id);
      return success(res, result, "Utilisateur désactivé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = UserController;

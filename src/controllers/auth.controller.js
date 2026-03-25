/**
 * Controller d'authentification.
 * Gère uniquement les requêtes/réponses HTTP.
 * La logique métier est dans AuthService.
 */

const AuthService = require("../services/auth.service");
const { success, error } = require("../utils/response.util");

class AuthController {
  /**
   * POST /api/auth/login
   * Authentifie un utilisateur et retourne un JWT.
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return success(res, result, "Connexion réussie");
    } catch (err) {
      return error(res, err.message, 401);
    }
  }

  /**
   * POST /api/auth/register
   * Inscription publique — crée un compte avec le rôle "organisateur".
   */
  static async register(req, res) {
    try {
      const { nom, prenom, email, password } = req.body;
      const result = await AuthService.register({ nom, prenom, email, password });
      return success(res, result, "Inscription réussie", 201);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  /**
   * PUT /api/auth/change-password
   * Change le mot de passe. Accessible même si mustChangePassword = true.
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await AuthService.changePassword({
        userId: req.user.id,
        oldPassword,
        newPassword,
      });
      return success(res, result, "Mot de passe modifié avec succès");
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  /**
   * GET /api/auth/me
   * Retourne les informations de l'utilisateur connecté.
   */
  static async me(req, res) {
    const { password, ...user } = req.user.toJSON();
    return success(res, user, "Profil utilisateur");
  }
}

module.exports = AuthController;

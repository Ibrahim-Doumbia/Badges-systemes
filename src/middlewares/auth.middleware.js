/**
 * Middlewares d'authentification et d'autorisation.
 *
 * authenticate  : vérifie le JWT et attache req.user
 * requireRole   : vérifie que l'utilisateur a le rôle requis
 * mustChangePwd : bloque si mustChangePassword = true (sauf route change-password)
 */

const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");
const { error } = require("../utils/response.util");

/**
 * Vérifie le token JWT dans le header Authorization: Bearer <token>
 * Attache l'utilisateur complet (avec son rôle) à req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "Token d'authentification manquant", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return error(res, "Token expiré, veuillez vous reconnecter", 401);
      }
      return error(res, "Token invalide", 401);
    }

    // Récupère l'utilisateur avec son rôle depuis la DB
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: "role" }],
    });

    if (!user) return error(res, "Utilisateur introuvable", 401);
    if (!user.isActive) return error(res, "Compte désactivé", 403);

    req.user = user; // Attache l'utilisateur à la requête
    next();
  } catch (err) {
    return error(res, "Erreur d'authentification", 500);
  }
};

/**
 * Middleware de changement de mot de passe obligatoire.
 * Si mustChangePassword = true, bloque toutes les routes sauf /auth/change-password
 */
const mustChangePwd = (req, res, next) => {
  if (req.user && req.user.mustChangePassword) {
    return error(
      res,
      "Vous devez changer votre mot de passe avant de continuer",
      403,
      { mustChangePassword: true }
    );
  }
  next();
};

/**
 * Factory de middleware de vérification de rôle.
 * Usage: requireRole("admin") ou requireRole(["admin", "staff"])
 * @param {string|string[]} roles - Rôle(s) autorisé(s)
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return error(res, "Rôle non défini", 403);
    }

    if (!allowedRoles.includes(req.user.role.name)) {
      return error(res, "Accès refusé : droits insuffisants", 403);
    }

    next();
  };
};

module.exports = { authenticate, mustChangePwd, requireRole };

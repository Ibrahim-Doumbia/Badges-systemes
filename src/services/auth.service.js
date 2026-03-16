/**
 * Service d'authentification.
 *
 * Responsabilités :
 * - Connexion (login) avec vérification du mot de passe
 * - Changement de mot de passe (premier login ou mise à jour)
 * - Génération du JWT
 *
 * Validation du mot de passe :
 * Le mot de passe brut doit contenir au moins 1 majuscule,
 * 1 caractère spécial et faire au moins 8 caractères.
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

// Regex de validation : 1 majuscule, 1 spécial, min 8 caractères
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Authentifie un utilisateur et retourne un token JWT + les infos utilisateur.
   */
  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email et mot de passe sont requis");
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) throw new Error("Email ou mot de passe incorrect");
    if (!user.isActive) throw new Error("Compte désactivé");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Email ou mot de passe incorrect");

    const token = AuthService.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role?.name,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  /**
   * Change le mot de passe d'un utilisateur.
   * Vérifie l'ancien mot de passe, valide le nouveau, puis hash et sauvegarde.
   */
  static async changePassword({ userId, oldPassword, newPassword }) {
    if (!oldPassword || !newPassword) {
      throw new Error("Ancien et nouveau mots de passe requis");
    }

    const user = await User.findByPk(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new Error("Ancien mot de passe incorrect");

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new Error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial"
      );
    }

    if (oldPassword === newPassword) {
      throw new Error("Le nouveau mot de passe doit être différent de l'ancien");
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.update({ password: hashed, mustChangePassword: false });

    return { message: "Mot de passe modifié avec succès" };
  }

  /**
   * Génère un JWT signé avec les informations de l'utilisateur.
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        mustChangePassword: user.mustChangePassword,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
  }
}

module.exports = AuthService;

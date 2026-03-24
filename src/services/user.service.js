/**
 * Service utilisateur.
 *
 * Responsabilités :
 * - Création d'utilisateur par l'admin (avec mot de passe par défaut)
 * - Listing paginé des utilisateurs
 * - Mise à jour et désactivation de compte
 *
 * Mot de passe par défaut : défini dans .env (DEFAULT_PASSWORD)
 * mustChangePassword est toujours true à la création.
 */

const bcrypt = require("bcrypt");
const { User, Role } = require("../models");
const { Op } = require("sequelize");

const SALT_ROUNDS = 10;

class UserService {
  /**
   * Crée un utilisateur avec le mot de passe par défaut.
   * Seul un admin peut appeler cette méthode.
   */
  static async createUser({ nom, prenom, email, role_id }) {
    // Vérification que l'email n'est pas déjà pris
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error("Un utilisateur avec cet email existe déjà");

    // Vérification que le rôle existe
    const role = await Role.findByPk(role_id);
    if (!role) throw new Error("Rôle introuvable");

    const defaultPassword = process.env.DEFAULT_PASSWORD || "Ev£nement@2024";
    const hashed = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    const user = await User.create({
      nom,
      prenom,
      email,
      password: hashed,
      role_id,
      mustChangePassword: true,
    });

    // On ne retourne jamais le mot de passe
    const { password, ...userWithoutPwd } = user.toJSON();
    return userWithoutPwd;
  }

  /**
   * Liste paginée des utilisateurs avec leur rôle.
   */
  static async getUsers({ limit, offset, search }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return { count, rows };
  }

  /**
   * Récupère un utilisateur par son ID.
   */
  static async getUserById(id) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password"] },
    });
    if (!user) throw new Error("Utilisateur introuvable");
    return user;
  }

  /**
   * Met à jour les informations d'un utilisateur.
   */
  static async updateUser(id, { nom, prenom, email, role_id, isActive }) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("Utilisateur introuvable");

    // Vérifie l'unicité de l'email si modifié
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) throw new Error("Cet email est déjà utilisé");
    }

    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) throw new Error("Rôle introuvable");
    }

    await user.update({ nom, prenom, email, role_id, isActive });

    const { password, ...updated } = user.toJSON();
    return updated;
  }

  /**
   * Désactive un compte utilisateur (soft delete).
   */
  static async desactiveUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("Utilisateur introuvable");
    await user.update({ isActive: false });
    return { message: "Utilisateur désactivé" };
  }
}

module.exports = UserService;

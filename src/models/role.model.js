/**
 * Modèle Role
 * Représente les rôles d'accès dans le système (admin, staff).
 * Utilise UUID comme clé primaire pour plus de sécurité et de portabilité.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define(
  "Role",
  {
    
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Génération automatique d'UUID v4
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM("admin", "staff", "organisateur"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

module.exports = Role;

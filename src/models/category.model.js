/**
 * Modèle Category
 * Catégories de participation à un événement (VIP, Standard, Etudiant...).
 * Chaque catégorie est liée à un événement spécifique.
 * Le prix est stocké en décimal avec 2 décimales.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Ex: VIP, Standard, Etudiant",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: { args: [0], msg: "Le prix ne peut pas être négatif" },
      },
    },
    // event_id ajouté via associations dans index.js
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);

module.exports = Category;

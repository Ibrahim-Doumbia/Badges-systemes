/**
 * Modèle Badge
 * Lié à une Inscription (relation 1:1).
 * Contient le QR Code généré automatiquement lors de la confirmation d'une inscription.
 *
 * Statuts :
 * - generated : badge généré mais pas encore imprimé
 * - printed   : badge imprimé
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Badge = sequelize.define(
  "Badge",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Data URL base64 du QR code (image/png)",
    },
    statut: {
      type: DataTypes.ENUM("generated", "printed"),
      defaultValue: "generated",
      allowNull: false,
    },
    date_generation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    // inscription_id ajouté via associations dans index.js
  },
  {
    tableName: "badges",
    timestamps: true,
  }
);

module.exports = Badge;

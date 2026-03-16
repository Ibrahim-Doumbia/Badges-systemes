/**
 * Modèle Inscription
 * Table centrale qui relie un Participant, un Event et une Category.
 * C'est le nœud métier principal : l'inscription déclenche la génération du badge.
 *
 * Statuts :
 * - pending   : en attente de confirmation
 * - confirmed : inscription validée
 * - cancelled : inscription annulée
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Inscription = sequelize.define(
  "Inscription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date_inscription: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    // participant_id, event_id, category_id ajoutés via associations dans index.js
  },
  {
    tableName: "inscriptions",
    timestamps: true,
  }
);

module.exports = Inscription;

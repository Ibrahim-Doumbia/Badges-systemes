/**
 * Modèle EventType
 * Types d'événements disponibles : conférence, formation, salon, atelier.
 * Utilise un ENUM pour contraindre les valeurs autorisées.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventType = sequelize.define(
  "EventType",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM("conference", "formation", "salon", "atelier", "concert"),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Libellé affiché (ex: Conférence, Atelier...)",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "event_types",
    timestamps: true,
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

module.exports = EventType;

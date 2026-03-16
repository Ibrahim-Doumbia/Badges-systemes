/**
 * Modèle EventDay
 * Représente une journée d'un événement.
 * Un événement peut s'étaler sur plusieurs jours.
 * Chaque jour a une date, des horaires et un lieu.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventDay = sequelize.define(
  "EventDay",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: "date doit être une date valide" },
      },
    },
    heure_debut: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    heure_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    lieu: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // event_id ajouté via associations dans index.js
  },
  {
    tableName: "event_days",
    timestamps: true,
  }
);

module.exports = EventDay;

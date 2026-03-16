/**
 * Modèle Event
 * Représente un événement (conférence, formation...).
 * Lié à un EventType et à l'utilisateur qui l'a créé.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: "start_date doit être une date valide" },
      },
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: "end_date doit être une date valide" },
        isAfterStart(value) {
          if (value < this.start_date) {
            throw new Error("end_date doit être après start_date");
          }
        },
      },
    },
    lieu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // event_type_id et created_by ajoutés via associations dans index.js
  },
  {
    tableName: "events",
    timestamps: true,
  }
);

module.exports = Event;

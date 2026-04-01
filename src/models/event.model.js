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
          const end = String(value).substring(0, 10);
          const start = String(this.start_date).substring(0, 10);
          if (end < start) {
            throw new Error("end_date doit être après start_date");
          }
        },
      },
    },
    lieu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registration_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      comment: "Token unique pour le lien d'inscription public",
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
    indexes: [{ unique: true, fields: ["registration_token"] }],
  }
);

module.exports = Event;

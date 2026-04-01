/**
 * Modèle EventField
 * Définit les champs du formulaire d'inscription pour un événement donné.
 * Chaque événement peut avoir ses propres champs personnalisés.
 * L'organisateur crée ces champs ; les participants les remplissent via le lien public.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventField = sequelize.define(
  "EventField",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Libellé affiché au participant (ex: 'Nom', 'Société')",
    },
    field_key: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Clé technique utilisée dans form_data (ex: 'nom', 'societe')",
    },
    field_type: {
      type: DataTypes.ENUM("text", "email", "tel", "number", "date", "select", "textarea"),
      defaultValue: "text",
      allowNull: false,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Pour les champs 'select' : tableau des choix possibles, ex: [\"VIP\", \"Standard\"]",
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Ordre d'affichage dans le formulaire",
    },
    // event_id ajouté via associations dans index.js
  },
  {
    tableName: "event_fields",
    timestamps: true,
  }
);

module.exports = EventField;

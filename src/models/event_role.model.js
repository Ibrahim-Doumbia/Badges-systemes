/**
 * Modèle EventRole — Rôles spécifiques à un événement.
 *
 * Chaque événement possède ses propres rôles d'équipe, indépendants
 * des rôles système (admin/staff). Exemples : Coordinateur, Accueil,
 * Sécurité, Animateur, Logistique, Communication.
 *
 * Ces rôles sont créés automatiquement lors de la création d'un événement
 * à partir d'une liste de rôles par défaut, puis peuvent être
 * personnalisés (ajout, modification, suppression).
 *
 * Relation :
 *   Event ──< EventRole ──< UserEvent
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventRole = sequelize.define(
  "EventRole",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nom du rôle dans l'événement (ex: Coordinateur, Accueil)",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Description des responsabilités de ce rôle",
    },
    // event_id ajouté via associations dans models/index.js
  },
  {
    tableName: "event_roles",
    timestamps: true,
  }
);

module.exports = EventRole;

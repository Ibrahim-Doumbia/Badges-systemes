/**
 * Modèle Participant
 * Représente une personne qui s'inscrit à un événement.
 * Un participant peut être inscrit à plusieurs événements via la table inscriptions.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Participant = sequelize.define(
  "Participant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Format d'email invalide" },
      },
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fonction: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Poste ou fonction du participant",
    },
    organisation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Entreprise ou organisation d'appartenance",
    },
    localite: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Ville ou localité du participant",
    },
  },
  {
    tableName: "participants",
    timestamps: true,
  }
);

module.exports = Participant;

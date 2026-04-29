/**
 * Point d'entrée des modèles Sequelize.
 * Ce fichier :
 *   1. Importe tous les modèles
 *   2. Définit TOUTES les associations (relations entre tables)
 *   3. Exporte les modèles et l'instance sequelize
 *
 * Toutes les clés étrangères sont définies ICI (pas dans les modèles individuels)
 * pour éviter les dépendances circulaires.
 *
 * IMPORTANT — UUID sur les clés étrangères :
 * Chaque foreignKey est défini avec { name, type: DataTypes.UUID } pour que
 * PostgreSQL crée bien des colonnes de type UUID et non INTEGER par défaut.
 * Sans cette précision, Sequelize peut inférer un type incorrect selon la version.
 *
 * SCHÉMA DES RELATIONS :
 *  Role ──< User
 *  EventType ──< Event
 *  User ──< Event (créateur)
 *  Event ──< EventDay
 *  Event ──< EventRole          ← rôles propres à chaque événement
 *  EventRole ──< UserEvent      ← un membre d'équipe a un rôle de l'événement
 *  Event ──< Category
 *  Participant ──< Inscription

 *  Event ──< Inscription
 *  Category ──< Inscription
 *  Inscription ──1 Badge
 *  User >──< Event (via UserEvent)
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Import des modèles
const Role        = require("./role.model");
const User        = require("./user.model");
const EventType   = require("./event_type.model");
const Event       = require("./event.model");
const EventDay    = require("./event_day.model");
const EventRole   = require("./event_role.model");
const Category    = require("./category.model");
const Participant = require("./participant.model");
const Inscription = require("./inscription.model");
const Badge       = require("./badge.model");
const UserEvent   = require("./user_event.model");

// ─── Relations User / Role ────────────────────────────────────────────────────
// Un utilisateur appartient à un rôle (admin ou organisateur)
User.belongsTo(Role, {
  foreignKey: { name: "role_id", type: DataTypes.UUID, allowNull: false },
  as: "role",
});
Role.hasMany(User, {
  foreignKey: { name: "role_id", type: DataTypes.UUID },
  as: "users",
});

// ─── Relations Event / EventType ─────────────────────────────────────────────
Event.belongsTo(EventType, {
  foreignKey: { name: "event_type_id", type: DataTypes.UUID, allowNull: false },
  as: "eventType",
});
EventType.hasMany(Event, {
  foreignKey: { name: "event_type_id", type: DataTypes.UUID },
  as: "events",
});

// ─── Relations Event / User (créateur) ───────────────────────────────────────
Event.belongsTo(User, {
  foreignKey: { name: "created_by", type: DataTypes.UUID, allowNull: false },
  as: "creator",
});
User.hasMany(Event, {
  foreignKey: { name: "created_by", type: DataTypes.UUID },
  as: "createdEvents",
});

// ─── Relations Event / EventDay ──────────────────────────────────────────────
// Suppression en CASCADE : supprimer un événement supprime ses jours
Event.hasMany(EventDay, {
  foreignKey: { name: "event_id", type: DataTypes.UUID, allowNull: false },
  as: "days",
  onDelete: "CASCADE",
});
EventDay.belongsTo(Event, {
  foreignKey: { name: "event_id", type: DataTypes.UUID },
  as: "event",
});

// ─── Relations Event / EventRole ─────────────────────────────────────────────
// Les rôles sont créés automatiquement à la création de l'événement
// Suppression en CASCADE : supprimer un événement supprime ses rôles
Event.hasMany(EventRole, {
  foreignKey: { name: "event_id", type: DataTypes.UUID, allowNull: false },
  as: "roles",
  onDelete: "CASCADE",
});
EventRole.belongsTo(Event, {
  foreignKey: { name: "event_id", type: DataTypes.UUID },
  as: "event",
});

// ─── Relations Event / Category ──────────────────────────────────────────────
// Suppression en CASCADE : supprimer un événement supprime ses catégories
Event.hasMany(Category, {
  foreignKey: { name: "event_id", type: DataTypes.UUID, allowNull: false },
  as: "categories",
  onDelete: "CASCADE",
});
Category.belongsTo(Event, {
  foreignKey: { name: "event_id", type: DataTypes.UUID },
  as: "event",
});

// ─── Relations Inscription ───────────────────────────────────────────────────
// Une inscription relie un participant à un événement via une catégorie
Inscription.belongsTo(Participant, {
  foreignKey: { name: "participant_id", type: DataTypes.UUID, allowNull: false },
  as: "participant",
});
Participant.hasMany(Inscription, {
  foreignKey: { name: "participant_id", type: DataTypes.UUID },
  as: "inscriptions",
});

Inscription.belongsTo(Event, {
  foreignKey: { name: "event_id", type: DataTypes.UUID, allowNull: false },
  as: "event",
});
Event.hasMany(Inscription, {
  foreignKey: { name: "event_id", type: DataTypes.UUID },
  as: "inscriptions",
});

Inscription.belongsTo(Category, {
  foreignKey: { name: "category_id", type: DataTypes.UUID, allowNull: false },
  as: "category",
});
Category.hasMany(Inscription, {
  foreignKey: { name: "category_id", type: DataTypes.UUID },
  as: "inscriptions",
});

// ─── Relations Badge / Inscription (1:1) ─────────────────────────────────────
// Un badge est lié à une seule inscription
// Suppression en CASCADE : supprimer une inscription supprime son badge
Inscription.hasOne(Badge, {
  foreignKey: { name: "inscription_id", type: DataTypes.UUID, allowNull: false },
  as: "badge",
  onDelete: "CASCADE",
});
Badge.belongsTo(Inscription, {
  foreignKey: { name: "inscription_id", type: DataTypes.UUID },
  as: "inscription",
});

// ─── Relations User >──< Event (via UserEvent) ───────────────────────────────
// Un utilisateur peut être assigné à plusieurs événements avec un rôle précis
User.belongsToMany(Event, {
  through: UserEvent,
  foreignKey: { name: "user_id", type: DataTypes.UUID },
  as: "assignedEvents",
});
Event.belongsToMany(User, {
  through: UserEvent,
  foreignKey: { name: "event_id", type: DataTypes.UUID },
  as: "team",
});

// Associations directes sur UserEvent pour les includes Sequelize
UserEvent.belongsTo(User, {
  foreignKey: { name: "user_id", type: DataTypes.UUID, allowNull: false },
  as: "user",
});
UserEvent.belongsTo(Event, {
  foreignKey: { name: "event_id", type: DataTypes.UUID, allowNull: false },
  as: "event",
});

// Un membre d'équipe a un rôle spécifique à l'événement
UserEvent.belongsTo(EventRole, {
  foreignKey: { name: "event_role_id", type: DataTypes.UUID, allowNull: false },
  as: "eventRole",
});
EventRole.hasMany(UserEvent, {
  foreignKey: { name: "event_role_id", type: DataTypes.UUID },
  as: "assignments",
});

module.exports = {
  sequelize,
  Role,
  User,
  EventType,
  Event,
  EventDay,
  EventRole,
  Category,
  Participant,
  Inscription,
  Badge,
  UserEvent,
};

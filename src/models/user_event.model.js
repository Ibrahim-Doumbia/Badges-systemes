/**
 * Modèle UserEvent (table de jonction)
 * Relie un User (staff/admin) à un Event via un EventRole.
 *
 * Schéma :
 *   User >──< Event (via UserEvent)
 *   UserEvent ──> EventRole (rôle précis de l'utilisateur dans l'événement)
 *
 * Exemple :
 *   Sophie (staff) est assignée à la conférence DevConf 2026
 *   avec le rôle "Accueil" (EventRole lié à DevConf 2026).
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserEvent = sequelize.define(
  "UserEvent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // user_id, event_id et event_role_id ajoutés via associations dans models/index.js
  },
  {
    tableName: "user_events",
    timestamps: true,
  }
);

module.exports = UserEvent;

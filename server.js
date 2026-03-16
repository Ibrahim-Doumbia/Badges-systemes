/**
 * Point d'entrée du serveur.
 * Charge les variables d'environnement, importe l'app Express,
 * synchronise la base de données Sequelize, puis démarre le serveur.
 *
 * sync({ alter: true }) adapte les tables existantes sans les supprimer.
 * En production, utiliser des migrations Sequelize à la place.
 */

require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    await sequelize.authenticate();
    console.log("✅ Connexion à PostgreSQL établie");

    // Synchronisation des modèles avec la base de données
    // alter: true = modifie les tables existantes pour correspondre aux modèles
    // ATTENTION : En production, utiliser des migrations plutôt que sync
    await sequelize.sync({ alter: true });
    console.log("✅ Modèles synchronisés avec la base de données");

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📋 Health check : http://localhost:${PORT}/health`);
      console.log(`🔑 API : http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Impossible de démarrer le serveur :", error.message);
    process.exit(1);
  }
};

startServer();

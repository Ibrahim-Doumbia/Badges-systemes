/**
 * Job : désactivation automatique des événements expirés.
 * Tourne chaque jour à minuit (00:00).
 * Met isActive = false pour tout événement dont end_date < aujourd'hui.
 */

const cron = require("node-cron");
const { Op } = require("sequelize");
const { Event } = require("../models");

function startDeactivateExpiredEventsJob() {
  // Exécution immédiate au démarrage pour rattraper les événements déjà expirés
  deactivateExpiredEvents();

  // Puis chaque jour à minuit
  cron.schedule("0 0 * * *", deactivateExpiredEvents);

  console.log("⏰ Job de désactivation des événements expirés démarré");
}

async function deactivateExpiredEvents() {
  try {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    const [updatedCount] = await Event.update(
      { isActive: false },
      {
        where: {
          end_date: { [Op.lt]: today },
          isActive: true,
        },
      }
    );

    if (updatedCount > 0) {
      console.log(`✅ ${updatedCount} événement(s) expiré(s) désactivé(s)`);
    }
  } catch (err) {
    console.error("❌ Erreur job désactivation événements :", err.message);
  }
}

module.exports = startDeactivateExpiredEventsJob;

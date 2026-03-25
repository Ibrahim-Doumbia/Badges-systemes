/**
 * Script de seeding initial.
 * Crée les rôles (admin, staff) et un compte administrateur par défaut.
 *
 * Usage : node src/seeders/seed.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, Role, User } = require("../models");

const SALT_ROUNDS = 10;

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✔ Connexion à la base de données OK");

    // ── 1. Rôles ──────────────────────────────────────────────────────────────
    const [adminRole] = await Role.findOrCreate({
      where: { name: "admin" },
      defaults: { description: "Administrateur système — accès complet" },
    });

    const [staffRole] = await Role.findOrCreate({
      where: { name: "staff" },
      defaults: { description: "Staff — gestion des participants et badges" },
    });

    const [organisateurRole] = await Role.findOrCreate({
      where: { name: "organisateur" },
      defaults: { description: "Organisateur — peut créer et gérer ses propres événements" },
    });

    console.log("✔ Rôles créés/vérifiés :", adminRole.name, "/", staffRole.name, "/", organisateurRole.name);

    // ── 2. Compte admin par défaut ─────────────────────────────────────────────
    const adminEmail = "admin@badges.com";
    const adminPassword = process.env.DEFAULT_PASSWORD || "Admin@2024";

    const existing = await User.findOne({ where: { email: adminEmail } });

    if (existing) {
      console.log("ℹ  Compte admin déjà existant :", adminEmail);
    } else {
      const hashed = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await User.create({
        nom: "Super",
        prenom: "Admin",
        email: adminEmail,
        password: hashed,
        mustChangePassword: false,
        isActive: true,
        role_id: adminRole.id,
      });
      console.log("✔ Compte admin créé :");
      console.log("   Email    :", adminEmail);
      console.log("   Password :", adminPassword);
    }

    console.log("\n🎉 Seeding terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("✘ Erreur lors du seeding :", err.message);
    process.exit(1);
  }
}

seed();

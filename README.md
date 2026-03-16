# Badges Système — Backend

API REST pour la gestion d'événements avec inscription des participants et génération automatique de badges QR Code.

---

## Table des matières

1. [Technologies](#technologies)
2. [Architecture du projet](#architecture-du-projet)
3. [Modèle de données](#modèle-de-données)
4. [Installation et configuration](#installation-et-configuration)
5. [Démarrage](#démarrage)
6. [Authentification](#authentification)
7. [Référence des endpoints](#référence-des-endpoints)
   - [Auth](#auth)
   - [Utilisateurs](#utilisateurs)
   - [Types d'événements](#types-dévénements)
   - [Événements](#événements)
   - [Jours d'événement](#jours-dévénement)
   - [Catégories](#catégories)
   - [Rôles d'événement](#rôles-dévénement)
   - [Équipe d'événement](#équipe-dévénement)
   - [Participants](#participants)
   - [Inscriptions](#inscriptions)
   - [Badges](#badges)
8. [Format des réponses](#format-des-réponses)
9. [Pagination](#pagination)
10. [Sécurité](#sécurité)
11. [Structure des fichiers](#structure-des-fichiers)

---

## Technologies

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | ≥ 18 | Runtime |
| Express.js | ^5.2 | Framework HTTP |
| Sequelize | ^6.37 | ORM |
| PostgreSQL | ≥ 14 | Base de données |
| bcrypt | ^6.0 | Hachage des mots de passe |
| jsonwebtoken | ^9.0 | Authentification JWT |
| qrcode | ^1.5 | Génération de QR Code |
| dotenv | ^17 | Variables d'environnement |
| nodemon | ^3.1 | Rechargement à chaud (dev) |

---

## Architecture du projet

Le projet suit une **architecture en couches stricte** :

```
Requête HTTP
     │
     ▼
┌─────────────┐
│   Routes    │  Définit les URL et applique les middlewares
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middlewares │  authenticate · mustChangePwd · requireRole
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │  Lit req, appelle le service, renvoie res — AUCUNE logique métier
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Toute la logique métier, validations, règles
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │  Définition Sequelize + associations
└──────┬──────┘
       │
       ▼
  PostgreSQL
```

**Principes appliqués :**
- Les **controllers** ne contiennent que du code HTTP (`req` / `res`), aucune logique métier.
- Les **services** sont indépendants du framework, testables unitairement.
- Les **modèles** déclarent la structure et les associations, pas les règles métier.
- Toutes les **associations** Sequelize sont centralisées dans `models/index.js` pour éviter les dépendances circulaires.
- Tous les identifiants sont des **UUID v4**.

---

## Modèle de données

### Diagramme des relations

```
roles ──< users
              └──< user_events >──────────────────┐
                        │                         │
                        └──> event_roles ──────┐  │
                                               │  │
event_types ──< events ────────────────────────┘──┘
                  │
                  ├──< event_days
                  │
                  ├──< event_roles   ← créés automatiquement à la création
                  │
                  ├──< categories
                  │         │
                  └──< inscriptions ──< participants
                            │
                            └──1 badges
```

### Tables et champs principaux

#### `roles`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | Identifiant unique |
| name | ENUM | `admin` ou `staff` |
| description | STRING | Description du rôle |

#### `users`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | Identifiant unique |
| nom | STRING | Nom de famille |
| prenom | STRING | Prénom |
| email | STRING UNIQUE | Email (identifiant de connexion) |
| password | STRING | Mot de passe haché (bcrypt) |
| mustChangePassword | BOOLEAN | `true` = doit changer son mdp à la prochaine connexion |
| isActive | BOOLEAN | `false` = compte désactivé |
| role_id | UUID FK | Référence vers `roles` |

#### `event_types`
| Champ | Type | Valeurs |
|-------|------|---------|
| id | UUID PK | — |
| name | ENUM | `conference`, `formation`, `salon`, `atelier` |
| label | STRING | Libellé affiché |
| description | TEXT | Description |

#### `events`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| title | STRING | Titre de l'événement |
| description | TEXT | Description |
| start_date | DATEONLY | Date de début |
| end_date | DATEONLY | Date de fin |
| lieu | STRING | Lieu principal |
| isActive | BOOLEAN | Événement actif ou non |
| event_type_id | UUID FK | Type d'événement |
| created_by | UUID FK | Utilisateur créateur |

#### `event_days`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| date | DATEONLY | Date du jour |
| heure_debut | TIME | Heure de début |
| heure_fin | TIME | Heure de fin |
| lieu | STRING | Lieu spécifique à ce jour |
| event_id | UUID FK | Événement parent |

#### `event_roles`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| name | STRING | Nom du rôle (ex : Coordinateur, Accueil) |
| description | TEXT | Responsabilités associées à ce rôle |
| event_id | UUID FK | Événement auquel ce rôle appartient |

> **Rôles créés automatiquement** à chaque création d'événement :
> `Coordinateur` · `Accueil` · `Sécurité` · `Animateur` · `Logistique` · `Communication`
>
> Ces rôles sont propres à chaque événement et peuvent être personnalisés (ajout, modification, suppression).
> La suppression d'un événement supprime ses rôles en **CASCADE**.

#### `user_events`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| user_id | UUID FK | Utilisateur membre de l'équipe |
| event_id | UUID FK | Événement concerné |
| event_role_id | UUID FK | Rôle de l'utilisateur dans cet événement |

> Un utilisateur ne peut être assigné **qu'une seule fois** au même événement.
> Le rôle assigné (`event_role_id`) doit appartenir au même événement.

#### `categories`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| name | STRING | Ex : VIP, Standard, Etudiant |
| description | TEXT | Description de la catégorie |
| price | DECIMAL(10,2) | Prix en devise locale |
| event_id | UUID FK | Événement associé |

#### `participants`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| nom | STRING | Nom |
| prenom | STRING | Prénom |
| email | STRING UNIQUE | Email du participant |
| telephone | STRING | Numéro de téléphone |
| fonction | STRING | Poste occupé |
| organisation | STRING | Entreprise ou structure |
| localite | STRING | Ville ou localité |

#### `inscriptions`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| date_inscription | DATE | Horodatage de l'inscription |
| statut | ENUM | `pending`, `confirmed`, `cancelled` |
| participant_id | UUID FK | Participant |
| event_id | UUID FK | Événement |
| category_id | UUID FK | Catégorie choisie |

> **Règle métier :** Un participant ne peut être inscrit qu'une seule fois au même événement.

#### `badges`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID PK | — |
| qr_code | TEXT | Data URL base64 de l'image PNG |
| statut | ENUM | `generated`, `printed` |
| date_generation | DATE | Date de génération |
| inscription_id | UUID FK UNIQUE | Inscription liée (relation 1:1) |

> **Règle métier :** Le badge est généré automatiquement quand le statut d'une inscription passe à `confirmed`.
> Le QR Code encode la chaîne `BADGE:<inscription_id>`.

---

## Installation et configuration

### Prérequis

- Node.js ≥ 18
- PostgreSQL ≥ 14 installé et démarré
- npm ≥ 9

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=badges_systeme
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_securise_minimum_32_caracteres
JWT_EXPIRES_IN=24h

# Mot de passe par défaut pour les nouveaux utilisateurs créés par l'admin
DEFAULT_PASSWORD=Ev£nement@2024
```

### 3. Créer la base de données

Se connecter à PostgreSQL et exécuter :

```sql
CREATE DATABASE badges_systeme;
```

> Sequelize crée automatiquement toutes les tables au premier démarrage grâce à `sync({ alter: true })`.

---

## Démarrage

```bash
# Mode développement (rechargement automatique)
npm run dev

# Mode production
npm start
```

Sorties attendues au démarrage :

```
✅ Connexion à PostgreSQL établie
✅ Modèles synchronisés avec la base de données
🚀 Serveur démarré sur http://localhost:3000
📋 Health check : http://localhost:3000/health
🔑 API : http://localhost:3000/api
```

### Health check

```http
GET /health
```

```json
{
  "status": "OK",
  "timestamp": "2026-03-16T10:00:00.000Z"
}
```

---

## Authentification

L'API utilise **JWT (JSON Web Token)** via le header `Authorization`.

### Flux de connexion

```
1. L'admin crée un utilisateur → mot de passe par défaut assigné
                                  mustChangePassword = true

2. L'utilisateur se connecte → reçoit un token JWT
   Le token contient { mustChangePassword: true }

3. Toutes les routes sont bloquées (403) sauf PUT /api/auth/change-password

4. L'utilisateur change son mot de passe → mustChangePassword = false

5. L'utilisateur peut maintenant accéder à l'API normalement
```

### Inclure le token dans les requêtes

```http
Authorization: Bearer <votre_token_jwt>
```

### Règles de mot de passe

Le nouveau mot de passe doit respecter :
- Minimum **8 caractères**
- Au moins **1 lettre majuscule**
- Au moins **1 caractère spécial** (`!@#$%^&*` etc.)

### Niveaux d'accès

| Rôle | Description |
|------|-------------|
| `admin` | Accès complet à toutes les ressources |
| `staff` | Lecture + création/modification participants, inscriptions, badges |

---

## Référence des endpoints

> **Base URL :** `http://localhost:3000/api`
>
> **Légende :**
> - 🔓 Public — aucun token requis
> - 🔐 Authentifié — token JWT valide requis
> - 👤 Admin uniquement
> - 👥 Admin ou Staff

---

### Auth

#### `POST /auth/login` 🔓

Authentifie un utilisateur et retourne un token JWT.

**Corps de la requête :**
```json
{
  "email": "admin@example.com",
  "password": "MonMotDePasse@1"
}
```

**Réponse `200` :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "admin@example.com",
      "role": "admin",
      "mustChangePassword": false
    }
  }
}
```

---

#### `PUT /auth/change-password` 🔐

Change le mot de passe. **Accessible même si `mustChangePassword = true`.**

**Corps de la requête :**
```json
{
  "oldPassword": "Ev£nement@2024",
  "newPassword": "NouveauMdp@2024"
}
```

**Réponse `200` :**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès",
  "data": { "message": "Mot de passe modifié avec succès" }
}
```

---

#### `GET /auth/me` 🔐

Retourne le profil de l'utilisateur connecté.

**Réponse `200` :**
```json
{
  "success": true,
  "message": "Profil utilisateur",
  "data": {
    "id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "admin@example.com",
    "mustChangePassword": false,
    "isActive": true,
    "role": { "id": "uuid", "name": "admin" }
  }
}
```

---

### Utilisateurs

> Toutes les routes nécessitent le rôle **admin**.

#### `POST /users` 👤

Crée un utilisateur avec le mot de passe par défaut défini dans `.env`.

**Corps de la requête :**
```json
{
  "nom": "Martin",
  "prenom": "Sophie",
  "email": "sophie.martin@example.com",
  "role_id": "uuid-du-role-staff"
}
```

**Réponse `201` :**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "id": "uuid",
    "nom": "Martin",
    "prenom": "Sophie",
    "email": "sophie.martin@example.com",
    "mustChangePassword": true,
    "isActive": true,
    "role_id": "uuid"
  }
}
```

---

#### `GET /users` 👤

Liste paginée des utilisateurs. Supporte la recherche par nom, prénom ou email.

**Paramètres de requête :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Numéro de page (défaut : 1) |
| `limit` | number | Éléments par page (défaut : 20, max : 100) |
| `search` | string | Filtre par nom, prénom ou email |

**Exemple :** `GET /users?page=1&limit=10&search=martin`

---

#### `GET /users/:id` 👤

Récupère un utilisateur par son UUID.

---

#### `PUT /users/:id` 👤

Met à jour les informations d'un utilisateur.

**Corps de la requête (champs optionnels) :**
```json
{
  "nom": "Martin",
  "prenom": "Sophie",
  "email": "nouveau@example.com",
  "role_id": "uuid",
  "isActive": true
}
```

---

#### `DELETE /users/:id` 👤

Désactive le compte (soft delete — `isActive = false`). Le compte n'est pas supprimé physiquement.

---

### Types d'événements

#### `POST /event-types` 👤

Crée un type d'événement.

**Corps de la requête :**
```json
{
  "name": "conference",
  "label": "Conférence",
  "description": "Événement académique ou professionnel avec présentations"
}
```

> **Valeurs autorisées pour `name` :** `conference`, `formation`, `salon`, `atelier`

---

#### `GET /event-types` 🔐

Liste paginée des types d'événements.

**Paramètres :** `page`, `limit`

---

#### `GET /event-types/:id` 🔐

Récupère un type d'événement par son UUID.

---

#### `PUT /event-types/:id` 👤

Met à jour le label ou la description (le `name` ENUM ne peut pas être modifié).

---

#### `DELETE /event-types/:id` 👤

Supprime un type d'événement.

---

### Événements

#### `POST /events` 👤

Crée un événement. L'`id` du créateur est extrait automatiquement du token JWT.

> **Comportement automatique :** à la création, **6 rôles d'équipe par défaut** sont générés automatiquement pour cet événement : `Coordinateur`, `Accueil`, `Sécurité`, `Animateur`, `Logistique`, `Communication`.

**Corps de la requête :**
```json
{
  "title": "DevConf 2026",
  "description": "Conférence annuelle des développeurs",
  "start_date": "2026-06-10",
  "end_date": "2026-06-12",
  "lieu": "Palais des congrès, Paris",
  "event_type_id": "uuid-du-type"
}
```

**Réponse `201` :**
```json
{
  "success": true,
  "message": "Événement créé",
  "data": {
    "id": "uuid",
    "title": "DevConf 2026",
    "start_date": "2026-06-10",
    "end_date": "2026-06-12",
    "lieu": "Palais des congrès, Paris",
    "isActive": true,
    "eventType": { "id": "uuid", "name": "conference", "label": "Conférence" },
    "creator": { "id": "uuid", "nom": "Dupont", "prenom": "Jean" },
    "days": [],
    "categories": [],
    "roles": [
      { "id": "uuid", "name": "Coordinateur", "description": "..." },
      { "id": "uuid", "name": "Accueil",      "description": "..." },
      { "id": "uuid", "name": "Sécurité",     "description": "..." },
      { "id": "uuid", "name": "Animateur",    "description": "..." },
      { "id": "uuid", "name": "Logistique",   "description": "..." },
      { "id": "uuid", "name": "Communication","description": "..." }
    ]
  }
}
```

---

#### `GET /events` 🔐

Liste paginée avec filtres. Inclut les jours, catégories, rôles et type d'événement.

**Paramètres de requête :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page (défaut : 1) |
| `limit` | number | Limite (défaut : 20) |
| `search` | string | Filtre par titre ou description |
| `event_type_id` | UUID | Filtre par type |
| `isActive` | boolean | Filtre par statut actif |

**Exemple :** `GET /events?page=1&limit=5&search=DevConf&isActive=true`

---

#### `GET /events/:id` 🔐

Détail complet d'un événement avec ses jours, catégories, rôles, créateur et type.

---

#### `PUT /events/:id` 👤

Met à jour les informations d'un événement.

---

#### `DELETE /events/:id` 👤

Supprime définitivement un événement. Les jours, catégories et rôles associés sont supprimés en **CASCADE**.

---

### Jours d'événement

> Routes imbriquées : `/events/:eventId/days`

#### `POST /events/:eventId/days` 👤

Ajoute une journée à un événement.

**Corps de la requête :**
```json
{
  "date": "2026-06-10",
  "heure_debut": "09:00:00",
  "heure_fin": "18:00:00",
  "lieu": "Salle A — Rez-de-chaussée"
}
```

---

#### `GET /events/:eventId/days` 🔐

Liste paginée des jours d'un événement, triés par date croissante.

**Paramètres :** `page`, `limit`

---

#### `GET /events/:eventId/days/:id` 🔐

Récupère un jour spécifique.

---

#### `PUT /events/:eventId/days/:id` 👥

Met à jour un jour d'événement.

---

#### `DELETE /events/:eventId/days/:id` 👤

Supprime un jour d'événement.

---

### Catégories

> Routes imbriquées : `/events/:eventId/categories`

#### `POST /events/:eventId/categories` 👤

Ajoute une catégorie de participation à un événement.

**Corps de la requête :**
```json
{
  "name": "VIP",
  "description": "Accès prioritaire, repas inclus",
  "price": 150.00
}
```

---

#### `GET /events/:eventId/categories` 🔐

Liste paginée des catégories d'un événement, triées par nom.

**Paramètres :** `page`, `limit`

---

#### `GET /events/:eventId/categories/:id` 🔐

Récupère une catégorie spécifique avec son événement.

---

#### `PUT /events/:eventId/categories/:id` 👤

Met à jour une catégorie (nom, description, prix).

---

#### `DELETE /events/:eventId/categories/:id` 👤

Supprime une catégorie.

---

### Rôles d'événement

> Routes imbriquées : `/events/:eventId/roles`
>
> Les 6 rôles par défaut sont créés automatiquement. Ces endpoints permettent de les personnaliser.

#### `POST /events/:eventId/roles` 👤

Ajoute un rôle personnalisé à un événement.

**Corps de la requête :**
```json
{
  "name": "Photographe",
  "description": "Couverture photo de l'événement"
}
```

**Réponse `201` :**
```json
{
  "success": true,
  "message": "Rôle créé",
  "data": {
    "id": "uuid",
    "name": "Photographe",
    "description": "Couverture photo de l'événement",
    "event_id": "uuid-event"
  }
}
```

---

#### `GET /events/:eventId/roles` 🔐

Liste paginée des rôles d'un événement. Chaque rôle inclut les membres qui lui sont assignés.

**Paramètres :** `page`, `limit`

**Réponse `200` :**
```json
{
  "success": true,
  "message": "Rôles de l'événement",
  "data": [
    {
      "id": "uuid",
      "name": "Accueil",
      "description": "Gestion de l'accueil et de l'enregistrement des participants",
      "assignments": [
        {
          "id": "uuid",
          "user": { "id": "uuid", "nom": "Martin", "prenom": "Sophie", "email": "..." }
        }
      ]
    }
  ],
  "meta": { "total": 6, "totalPages": 1, "currentPage": 1, ... }
}
```

---

#### `GET /events/:eventId/roles/:id` 🔐

Récupère un rôle avec l'événement et tous les membres assignés.

---

#### `PUT /events/:eventId/roles/:id` 👤

Renomme ou modifie la description d'un rôle.

**Corps de la requête :**
```json
{
  "name": "Accueil & Enregistrement",
  "description": "Accueil VIP et enregistrement des participants"
}
```

---

#### `DELETE /events/:eventId/roles/:id` 👤

Supprime un rôle.

> **Règle métier :** La suppression est **refusée** si des membres de l'équipe sont encore assignés à ce rôle. Il faut d'abord retirer ou réaffecter ces membres.

---

### Équipe d'événement

> Routes imbriquées : `/events/:eventId/team`
>
> Permet d'assigner des utilisateurs (admin ou staff) à l'équipe d'un événement avec un rôle précis.

#### `POST /events/:eventId/team` 👤

Assigne un utilisateur à l'équipe d'un événement avec un rôle d'événement.

**Corps de la requête :**
```json
{
  "user_id": "uuid-utilisateur",
  "event_role_id": "uuid-role-accueil"
}
```

> **Règles métier :**
> - L'utilisateur doit être actif (`isActive = true`).
> - Le `event_role_id` doit appartenir à cet événement.
> - Un utilisateur ne peut être assigné **qu'une seule fois** au même événement.

**Réponse `201` :**
```json
{
  "success": true,
  "message": "Utilisateur assigné à l'événement",
  "data": {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "nom": "Martin",
      "prenom": "Sophie",
      "email": "sophie.martin@example.com",
      "role": { "id": "uuid", "name": "staff" }
    },
    "eventRole": {
      "id": "uuid",
      "name": "Accueil",
      "description": "Gestion de l'accueil et de l'enregistrement"
    },
    "event": { "id": "uuid", "title": "DevConf 2026" }
  }
}
```

---

#### `GET /events/:eventId/team` 🔐

Liste paginée des membres de l'équipe d'un événement, avec leur rôle système et leur rôle dans l'événement.

**Paramètres :** `page`, `limit`

---

#### `PATCH /events/:eventId/team/:id/role` 👤

Change le rôle d'un membre dans l'équipe.

**Corps de la requête :**
```json
{
  "event_role_id": "uuid-role-coordinateur"
}
```

> Le nouveau rôle doit appartenir au même événement.

---

#### `DELETE /events/:eventId/team/:id` 👤

Retire un utilisateur de l'équipe d'un événement.

---

### Participants

#### `POST /participants` 👥

Enregistre un nouveau participant.

**Corps de la requête :**
```json
{
  "nom": "Kamdem",
  "prenom": "Alice",
  "email": "alice.kamdem@example.com",
  "telephone": "+237 6XX XXX XXX",
  "fonction": "Ingénieure logicielle",
  "organisation": "TechCorp SA",
  "localite": "Douala"
}
```

---

#### `GET /participants` 🔐

Liste paginée. Recherche par nom, prénom, email ou organisation.

**Paramètres :** `page`, `limit`, `search`

---

#### `GET /participants/:id` 🔐

Récupère un participant avec toutes ses inscriptions (événements et catégories inclus).

---

#### `PUT /participants/:id` 👥

Met à jour les informations d'un participant.

---

#### `DELETE /participants/:id` 👤

Supprime un participant.

---

### Inscriptions

#### `POST /inscriptions` 👥

Inscrit un participant à un événement dans une catégorie donnée.

**Corps de la requête :**
```json
{
  "participant_id": "uuid-participant",
  "event_id": "uuid-event",
  "category_id": "uuid-category"
}
```

**Règles métier appliquées :**
- La catégorie doit appartenir à l'événement.
- Un participant ne peut pas être inscrit deux fois au même événement.

**Réponse `201`** — statut initial : `pending`.

---

#### `GET /inscriptions` 🔐

Liste paginée. Inclut participant, événement, catégorie et badge.

**Paramètres de requête :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page |
| `limit` | number | Limite |
| `event_id` | UUID | Filtrer par événement |
| `statut` | string | `pending`, `confirmed`, `cancelled` |

---

#### `GET /inscriptions/:id` 🔐

Détail d'une inscription avec toutes les données associées.

---

#### `PATCH /inscriptions/:id/status` 👥

Met à jour le statut d'une inscription.

**Corps de la requête :**
```json
{
  "statut": "confirmed"
}
```

> **Important :** Quand le statut passe à `confirmed` et qu'aucun badge n'existe encore, **le badge est généré automatiquement** avec son QR Code.

**Valeurs autorisées :** `pending`, `confirmed`, `cancelled`

---

#### `DELETE /inscriptions/:id` 👤

Supprime une inscription et son badge en CASCADE.

---

### Badges

#### `POST /badges/generate/:inscriptionId` 👥

Génère manuellement un badge pour une inscription (utile si la génération automatique a échoué).

**Réponse `201` :**
```json
{
  "success": true,
  "message": "Badge généré",
  "data": {
    "id": "uuid",
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "statut": "generated",
    "date_generation": "2026-03-16T10:30:00.000Z",
    "inscription_id": "uuid"
  }
}
```

> Le champ `qr_code` contient un **Data URL base64** directement utilisable dans une balise `<img src="...">`.

---

#### `GET /badges` 🔐

Liste paginée des badges avec leurs inscriptions, participants et événements.

**Paramètres de requête :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page |
| `limit` | number | Limite |
| `statut` | string | `generated` ou `printed` |

---

#### `GET /badges/:id` 🔐

Récupère un badge complet avec toutes les données associées.

---

#### `PATCH /badges/:id/print` 👥

Marque un badge comme imprimé (`statut: "printed"`).

---

#### `PATCH /badges/:id/regenerate` 👤

Régénère le QR Code d'un badge existant et repasse le statut à `generated`.

---

## Format des réponses

Toutes les réponses suivent ce format standardisé :

### Réponse simple

```json
{
  "success": true,
  "message": "Description de l'opération",
  "data": { ... }
}
```

### Réponse paginée

```json
{
  "success": true,
  "message": "Liste des éléments",
  "data": [ ... ],
  "meta": {
    "total": 150,
    "totalPages": 8,
    "currentPage": 2,
    "perPage": 20,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

### Codes HTTP utilisés

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Requête invalide (données manquantes ou incorrectes) |
| `401` | Non authentifié (token absent ou expiré) |
| `403` | Accès refusé (droits insuffisants ou mustChangePassword) |
| `404` | Ressource introuvable |
| `500` | Erreur interne du serveur |

---

## Pagination

Tous les endpoints de listing supportent la pagination via des paramètres de requête :

```
GET /api/events?page=2&limit=10
```

| Paramètre | Défaut | Maximum | Description |
|-----------|--------|---------|-------------|
| `page` | `1` | — | Numéro de page (commence à 1) |
| `limit` | `20` | `100` | Nombre d'éléments par page |

La réponse inclut un objet `meta` avec les métadonnées de navigation :

```json
"meta": {
  "total": 243,
  "totalPages": 13,
  "currentPage": 2,
  "perPage": 20,
  "hasNextPage": true,
  "hasPrevPage": true
}
```

---

## Sécurité

### Mots de passe
- Hachés avec **bcrypt** (10 rounds de salage).
- Le mot de passe brut n'est **jamais** stocké ni retourné dans les réponses.
- Règles de complexité : ≥ 8 caractères, 1 majuscule, 1 caractère spécial.

### JWT
- Signé avec `JWT_SECRET` (variable d'environnement).
- Expiration configurable via `JWT_EXPIRES_IN` (défaut : `24h`).
- Vérification à chaque requête protégée.

### Contrôle d'accès
- Middleware `authenticate` : vérifie le token et charge l'utilisateur complet en base.
- Middleware `requireRole` : vérifie que le rôle système correspond avant d'exécuter le controller.
- Middleware `mustChangePwd` : bloque toutes les routes si `mustChangePassword = true`.

### Autres mesures
- Les réponses n'exposent **jamais** le champ `password`.
- La désactivation de compte (`isActive = false`) bloque immédiatement l'accès.
- Limite de pagination à **100 éléments** par page pour éviter les dumps de données.
- CORS configurable via la variable `CORS_ORIGIN`.
- Suppression en cascade contrôlée (jours, catégories, rôles, badges liés à l'événement/inscription).

---

## Structure des fichiers

```
Backend/
├── .env                            ← Variables d'environnement (ne pas versionner)
├── .env.example                    ← Modèle de configuration
├── package.json
├── server.js                       ← Point d'entrée : connexion DB + démarrage serveur
└── src/
    ├── app.js                      ← Configuration Express (middlewares, routes, erreurs)
    ├── config/
    │   └── database.js             ← Instance Sequelize
    ├── models/
    │   ├── index.js                ← Chargement des modèles + toutes les associations
    │   ├── role.model.js           ← Rôles système : admin, staff
    │   ├── user.model.js           ← Utilisateurs du système
    │   ├── event_type.model.js     ← Types d'événements (conférence, formation...)
    │   ├── event.model.js          ← Événements
    │   ├── event_day.model.js      ← Journées d'un événement
    │   ├── event_role.model.js     ← Rôles propres à chaque événement ← NOUVEAU
    │   ├── category.model.js       ← Catégories de participation
    │   ├── participant.model.js    ← Participants
    │   ├── inscription.model.js    ← Inscriptions
    │   ├── badge.model.js          ← Badges avec QR Code
    │   └── user_event.model.js     ← Table de jonction User ↔ Event (avec event_role_id)
    ├── services/                   ← Logique métier (pas de req/res)
    │   ├── auth.service.js
    │   ├── user.service.js
    │   ├── event_type.service.js
    │   ├── event.service.js        ← Crée les rôles par défaut à chaque événement
    │   ├── event_day.service.js
    │   ├── event_role.service.js   ← CRUD rôles + createDefaults() ← NOUVEAU
    │   ├── category.service.js
    │   ├── participant.service.js
    │   ├── inscription.service.js
    │   ├── badge.service.js
    │   └── user_event.service.js   ← Gestion de l'équipe événement ← NOUVEAU
    ├── controllers/                ← Gestion HTTP uniquement
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── event_type.controller.js
    │   ├── event.controller.js
    │   ├── event_day.controller.js
    │   ├── event_role.controller.js    ← NOUVEAU
    │   ├── category.controller.js
    │   ├── participant.controller.js
    │   ├── inscription.controller.js
    │   ├── badge.controller.js
    │   └── user_event.controller.js    ← NOUVEAU
    ├── routes/
    │   ├── index.js                    ← Agrégateur de toutes les routes sous /api
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── event_type.routes.js
    │   ├── event.routes.js
    │   ├── event_day.routes.js         ← imbriqué sous /events/:eventId/days
    │   ├── event_role.routes.js        ← imbriqué sous /events/:eventId/roles ← NOUVEAU
    │   ├── category.routes.js          ← imbriqué sous /events/:eventId/categories
    │   ├── participant.routes.js
    │   ├── inscription.routes.js
    │   ├── badge.routes.js
    │   └── user_event.routes.js        ← imbriqué sous /events/:eventId/team ← NOUVEAU
    ├── middlewares/
    │   └── auth.middleware.js          ← authenticate / mustChangePwd / requireRole
    └── utils/
        ├── response.util.js            ← success() / paginated() / error()
        ├── pagination.util.js          ← getPagination() depuis req.query
        └── qrcode.util.js              ← generateQRCode() → Data URL base64
```

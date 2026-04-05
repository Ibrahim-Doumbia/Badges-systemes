const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Badges Système API",
      version: "1.0.0",
      description: `API REST pour la gestion d'événements et génération de badges QR Code.

## Flux d'inscription participant
1. L'organisateur crée un événement → un \`registration_token\` est généré automatiquement
2. Les événements à venir sont visibles publiquement : \`GET /public/events\`
3. Le lien d'inscription est partagé : \`GET /public/register/{token}\` → retourne les infos de l'événement et ses catégories
4. Le participant remplit ses informations (nom, prénom, email…) et soumet : \`POST /public/register/{token}\` → inscription **confirmée automatiquement** + badge PDF envoyé par email
5. Jour J : \`GET /public/events/{id}/qr\` → QR code à scanner pour accéder directement au formulaire d'inscription`,
    },
    servers: [
      {
        url: "http://localhost:3001/api",
        description: "Serveur de développement",
        // url: "/api",
        // description: "Serveur production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ─── Auth ─────────────────────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@example.com" },
            password: { type: "string", example: "Password123!" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["oldPassword", "newPassword"],
          properties: {
            oldPassword: { type: "string", example: "AncienMotDePasse1" },
            newPassword: { type: "string", example: "NouveauMotDePasse1!" },
          },
        },
        // ─── User ─────────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            email: { type: "string", format: "email", example: "jean.dupont@example.com" },
            mustChangePassword: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            role_id: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["nom", "prenom", "email", "password", "role_id"],
          properties: {
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            email: { type: "string", format: "email", example: "jean.dupont@example.com" },
            password: { type: "string", example: "Password123!" },
            role_id: { type: "string", format: "uuid" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            nom: { type: "string" },
            prenom: { type: "string" },
            email: { type: "string", format: "email" },
            role_id: { type: "string", format: "uuid" },
          },
        },
        // ─── EventType ────────────────────────────────────────────────────────
        EventType: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", enum: ["conference", "formation", "salon", "atelier"] },
            label: { type: "string", example: "Conférence" },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateEventTypeRequest: {
          type: "object",
          required: ["name", "label"],
          properties: {
            name: { type: "string", enum: ["conference", "formation", "salon", "atelier"] },
            label: { type: "string", example: "Conférence" },
            description: { type: "string" },
          },
        },
        // ─── Event ────────────────────────────────────────────────────────────
        Event: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", example: "DevFest 2025" },
            description: { type: "string" },
            start_date: { type: "string", format: "date", example: "2025-06-01" },
            end_date: { type: "string", format: "date", example: "2025-06-03" },
            lieu: { type: "string", example: "Palais des congrès, Yaoundé" },
            photo_url: {
              type: "string",
              nullable: true,
              example: "/uploads/events/1717200000000-123456789.jpg",
              description: "URL de la photo de l'événement",
            },
            registration_token: {
              type: "string",
              format: "uuid",
              description: "Token unique — construit le lien public : /public/register/{token}",
            },
            isActive: { type: "boolean", example: true },
            event_type_id: { type: "string", format: "uuid" },
            created_by: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateEventRequest: {
          type: "object",
          required: ["title", "start_date", "end_date", "event_type_id"],
          properties: {
            title: { type: "string", example: "DevFest 2025" },
            description: { type: "string" },
            start_date: { type: "string", format: "date", example: "2025-06-01" },
            end_date: { type: "string", format: "date", example: "2025-06-03" },
            lieu: { type: "string", example: "Palais des congrès, Yaoundé" },
            event_type_id: { type: "string", format: "uuid" },
            organisateur_id: {
              type: "string",
              format: "uuid",
              description: "Admin uniquement — ID de l'organisateur désigné. Ignoré pour les non-admins (forcé à l'utilisateur connecté).",
            },
            photo: {
              type: "string",
              format: "binary",
              description: "Photo de l'événement (jpeg, png, webp, gif — 5 Mo max)",
            },
          },
        },
        // ─── EventDay ─────────────────────────────────────────────────────────
        EventDay: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            date: { type: "string", format: "date", example: "2025-06-01" },
            heure_debut: { type: "string", example: "09:00:00" },
            heure_fin: { type: "string", example: "18:00:00" },
            lieu: { type: "string", example: "Salle A" },
            event_id: { type: "string", format: "uuid" },
          },
        },
        CreateEventDayRequest: {
          type: "object",
          required: ["date", "heure_debut", "heure_fin", "lieu"],
          properties: {
            date: { type: "string", format: "date", example: "2025-06-01" },
            heure_debut: { type: "string", example: "09:00:00" },
            heure_fin: { type: "string", example: "18:00:00" },
            lieu: { type: "string", example: "Salle A" },
          },
        },
        // ─── Category ─────────────────────────────────────────────────────────
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "VIP" },
            description: { type: "string" },
            price: { type: "number", format: "float", example: 50000 },
            event_id: { type: "string", format: "uuid" },
          },
        },
        CreateCategoryRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "VIP" },
            description: { type: "string" },
            price: { type: "number", format: "float", example: 0 },
          },
        },
        // ─── EventRole ────────────────────────────────────────────────────────
        EventRole: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Coordinateur" },
            description: { type: "string" },
            event_id: { type: "string", format: "uuid" },
          },
        },
        CreateEventRoleRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Coordinateur" },
            description: { type: "string" },
          },
        },
        // ─── UserEvent (Team) ─────────────────────────────────────────────────
        TeamMember: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            event_id: { type: "string", format: "uuid" },
            event_role_id: { type: "string", format: "uuid" },
            User: { $ref: "#/components/schemas/User" },
            EventRole: { $ref: "#/components/schemas/EventRole" },
          },
        },
        AssignTeamMemberRequest: {
          type: "object",
          required: ["user_id", "event_role_id"],
          properties: {
            user_id: { type: "string", format: "uuid" },
            event_role_id: { type: "string", format: "uuid" },
          },
        },
        ChangeRoleRequest: {
          type: "object",
          required: ["event_role_id"],
          properties: {
            event_role_id: { type: "string", format: "uuid" },
          },
        },
        // ─── Participant ──────────────────────────────────────────────────────
        Participant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nom: { type: "string", nullable: true, example: "Kamga" },
            prenom: { type: "string", nullable: true, example: "Alice" },
            email: { type: "string", format: "email", example: "alice.kamga@example.com" },
            telephone: { type: "string", nullable: true, example: "+237 6XX XXX XXX" },
            fonction: { type: "string", nullable: true, example: "Ingénieure logicielle" },
            organisation: { type: "string", nullable: true, example: "TechCorp SA" },
            localite: { type: "string", nullable: true, example: "Douala" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateParticipantRequest: {
          type: "object",
          required: ["email"],
          description: "Seul l'email est obligatoire. Les autres champs dépendent des besoins.",
          properties: {
            nom: { type: "string" },
            prenom: { type: "string" },
            email: { type: "string", format: "email" },
            telephone: { type: "string" },
            fonction: { type: "string" },
            organisation: { type: "string" },
            localite: { type: "string" },
          },
        },
        // ─── Public Register ──────────────────────────────────────────────────
        PublicRegisterRequest: {
          type: "object",
          required: ["email", "category_id"],
          description: "Corps de la requête d'inscription publique. L'email identifie le participant. Si le participant existe déjà (même email), ses données sont réutilisées.",
          properties: {
            email: { type: "string", format: "email", example: "alice.kamga@example.com" },
            nom: { type: "string", example: "Kamga" },
            prenom: { type: "string", example: "Alice" },
            telephone: { type: "string", example: "+237 6XX XXX XXX" },
            fonction: { type: "string", example: "Ingénieure logicielle" },
            organisation: { type: "string", example: "TechCorp SA" },
            localite: { type: "string", example: "Douala" },
            category_id: { type: "string", format: "uuid", description: "ID de la catégorie choisie (doit appartenir à l'événement)" },
          },
        },
        // ─── Inscription ──────────────────────────────────────────────────────
        Inscription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            participant_id: { type: "string", format: "uuid" },
            event_id: { type: "string", format: "uuid" },
            category_id: { type: "string", format: "uuid" },
            statut: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
              example: "confirmed",
              description: "Auto-confirmé lors de l'inscription publique. Gérable manuellement par admin/staff/organisateur.",
            },
            date_inscription: { type: "string", format: "date-time" },
          },
        },
        CreateInscriptionRequest: {
          type: "object",
          required: ["participant_id", "event_id", "category_id"],
          description: "Création manuelle par admin/staff/organisateur.",
          properties: {
            participant_id: { type: "string", format: "uuid" },
            event_id: { type: "string", format: "uuid" },
            category_id: { type: "string", format: "uuid" },
          },
        },
        UpdateInscriptionStatusRequest: {
          type: "object",
          required: ["statut"],
          properties: {
            statut: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
          },
        },
        // ─── Badge ────────────────────────────────────────────────────────────
        Badge: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            qr_code: {
              type: "string",
              description: "Data URL base64 du QR Code (image/png)",
              example: "data:image/png;base64,iVBORw0KGgo...",
            },
            statut: { type: "string", enum: ["generated", "printed"], example: "generated" },
            date_generation: { type: "string", format: "date-time" },
            inscription_id: { type: "string", format: "uuid" },
          },
        },
        // ─── Réponses génériques ──────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Opération réussie" },
            data: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "array", items: { type: "object" } },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer", example: 42 },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 5 },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Une erreur est survenue" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);

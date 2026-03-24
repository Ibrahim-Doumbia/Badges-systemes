const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Badges Système API",
      version: "1.0.0",
      description: "API REST pour la gestion d'événements et génération de badges QR Code",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Serveur de développement",
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
            nom: { type: "string", example: "Kamga" },
            prenom: { type: "string", example: "Alice" },
            email: { type: "string", format: "email", example: "alice.kamga@example.com" },
            telephone: { type: "string", example: "+237 6XX XXX XXX" },
            fonction: { type: "string", example: "Ingénieure logicielle" },
            organisation: { type: "string", example: "TechCorp SA" },
            localite: { type: "string", example: "Douala" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateParticipantRequest: {
          type: "object",
          required: ["nom", "prenom", "email"],
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
        // ─── Inscription ──────────────────────────────────────────────────────
        Inscription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            participant_id: { type: "string", format: "uuid" },
            event_id: { type: "string", format: "uuid" },
            category_id: { type: "string", format: "uuid" },
            statut: { type: "string", enum: ["pending", "confirmed", "cancelled"], example: "pending" },
            date_inscription: { type: "string", format: "date-time" },
          },
        },
        CreateInscriptionRequest: {
          type: "object",
          required: ["participant_id", "event_id", "category_id"],
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

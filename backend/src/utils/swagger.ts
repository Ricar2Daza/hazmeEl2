export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HazMe API - MVP Bolsa de Empleo',
    version: '1.0.0',
    description: 'API REST para la plataforma HazMe: Bolsa de Empleo entre profesionales y clientes.',
    contact: {
      name: 'HazMe Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor local de desarrollo',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          emailVerified: { type: 'boolean' },
          phone: { type: 'string', nullable: true },
          companyName: { type: 'string', nullable: true },
          portfolioUrl: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          experienceYears: { type: 'integer', nullable: true },
          skills: { type: 'array', items: { type: 'string' } },
          locationAddress: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      JobStatus: {
        type: 'string',
        enum: ['ABIERTO', 'EN_PROGRESO', 'FINALIZADO', 'CANCELADO'],
      },
      ApplicationStatus: {
        type: 'string',
        enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'],
      },
      NotificationType: {
        type: 'string',
        enum: ['NEW_APPLICATION', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'JOB_UPDATED'],
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          locationAddress: { type: 'string' },
          budgetMin: { type: 'integer' },
          budgetMax: { type: 'integer' },
          deadlineDate: { type: 'string', format: 'date-time' },
          categoryId: { type: 'string', format: 'uuid' },
          publisherId: { type: 'string', format: 'uuid' },
          status: { $ref: '#/components/schemas/JobStatus' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          publisher: { $ref: '#/components/schemas/User', nullable: true },
          category: { $ref: '#/components/schemas/Category', nullable: true },
          applications: { type: 'array', items: { $ref: '#/components/schemas/Application' }, nullable: true },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          applicantId: { type: 'string', format: 'uuid' },
          message: { type: 'string', nullable: true },
          status: { $ref: '#/components/schemas/ApplicationStatus' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          job: { $ref: '#/components/schemas/Job', nullable: true },
          applicant: { $ref: '#/components/schemas/User', nullable: true },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: { $ref: '#/components/schemas/NotificationType' },
          title: { type: 'string' },
          message: { type: 'string' },
          relatedJobId: { type: 'string', format: 'uuid', nullable: true },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticación de usuarios (registro, login, verificación)' },
    { name: 'Categories', description: 'Categorías de trabajos' },
    { name: 'Jobs', description: 'Gestión de publicaciones de trabajos' },
    { name: 'Applications', description: 'Postulaciones a trabajos' },
    { name: 'Notifications', description: 'Notificaciones de usuarios' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['General'],
        summary: 'Comprobar estado del API',
        security: [],
        responses: {
          200: {
            description: 'API funcionando',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  phone: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokens' },
              },
            },
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: {
            description: 'Email no verificado',
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refrescar access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Nuevo access token generado' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/auth/verify/{token}': {
      get: {
        tags: ['Auth'],
        summary: 'Verificar email con token',
        security: [],
        parameters: [
          {
            in: 'path',
            name: 'token',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Email verificado exitosamente' },
          400: { description: 'Token inválido' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener perfil del usuario autenticado',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Actualizar perfil de usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  phone: { type: 'string', nullable: true },
                  companyName: { type: 'string', nullable: true },
                  portfolioUrl: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
                  experienceYears: { type: 'integer', nullable: true },
                  skills: { type: 'array', items: { type: 'string' } },
                  locationAddress: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Perfil actualizado' } },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Listar todas las categorías',
        security: [],
        responses: {
          200: {
            description: 'Lista de categorías',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
    },
    '/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Buscar y listar trabajos (paginado)',
        security: [],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          { in: 'query', name: 'budgetMin', schema: { type: 'integer' } },
          { in: 'query', name: 'budgetMax', schema: { type: 'integer' } },
          { in: 'query', name: 'deadlineFrom', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'deadlineTo', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'status', schema: { $ref: '#/components/schemas/JobStatus' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', default: 'createdAt' } },
        ],
        responses: {
          200: {
            description: 'Lista paginada de trabajos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Crear nuevo trabajo (publicador)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'title',
                  'description',
                  'locationAddress',
                  'budgetMin',
                  'budgetMax',
                  'deadlineDate',
                  'categoryId',
                ],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  locationAddress: { type: 'string' },
                  budgetMin: { type: 'integer' },
                  budgetMax: { type: 'integer' },
                  deadlineDate: { type: 'string', format: 'date-time' },
                  categoryId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Trabajo creado' } },
      },
    },
    '/jobs/mine': {
      get: {
        tags: ['Jobs'],
        summary: 'Listar trabajos publicados por mí (con contador de postulaciones)',
        responses: {
          200: { description: 'Mis trabajos publicados' },
        },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Obtener detalle de un trabajo por ID',
        security: [],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detalle del trabajo' }, 404: { description: 'No encontrado' } },
      },
      put: {
        tags: ['Jobs'],
        summary: 'Editar trabajo (solo publicador)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Trabajo actualizado' }, 403: { description: 'Sin permisos' } },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Cancelar trabajo (soft delete: status=CANCELADO)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Trabajo cancelado' }, 403: { description: 'Sin permisos' } },
      },
    },
    '/jobs/{jobId}/apply': {
      post: {
        tags: ['Applications'],
        summary: 'Postularse a un trabajo',
        parameters: [{ in: 'path', name: 'jobId', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Postulación creada' },
          403: { description: 'No puedes postularte a tu propio trabajo' },
          409: { description: 'Ya te has postulado a este trabajo' },
        },
      },
    },
    '/jobs/{jobId}/applications': {
      get: {
        tags: ['Applications'],
        summary: 'Ver postulaciones de mi trabajo (solo publicador)',
        parameters: [{ in: 'path', name: 'jobId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lista de postulaciones' }, 403: { description: 'Sin permisos' } },
      },
    },
    '/applications/mine': {
      get: {
        tags: ['Applications'],
        summary: 'Ver mis postulaciones (como postulante)',
        responses: { 200: { description: 'Mis postulaciones' } },
      },
    },
    '/applications/{id}/accept': {
      patch: {
        tags: ['Applications'],
        summary: 'Aceptar postulación (solo publicador del job)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Postulación aceptada' } },
      },
    },
    '/applications/{id}/reject': {
      patch: {
        tags: ['Applications'],
        summary: 'Rechazar postulación (solo publicador del job)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Postulación rechazada' } },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Listar mis notificaciones (paginado)',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Mis notificaciones' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar notificación como leída',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Notificación marcada' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar todas mis notificaciones como leídas',
        responses: { 200: { description: 'Todas marcadas como leídas' } },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Contar notificaciones sin leer',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { count: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    },
  },
  components_responses: {},
  responses: {
    ValidationError: {
      description: 'Error de validación',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    UnauthorizedError: {
      description: 'No autorizado',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
} as any;

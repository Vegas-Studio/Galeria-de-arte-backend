const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Art Gallery API',
      version: '1.0.0',
      description: 'API REST para la galería de arte virtual'
    },
    servers: [
      {
        url: 'http://localhost:{port}',
        variables: {
          port: {
            default: '3000'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            rol: {
              type: 'string',
              enum: ['Admin', 'Curador', 'Artista', 'Visitante'],
              example: 'Visitante'
            }
          }
        },
        ProfileUpdate: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            email: { type: 'string', format: 'email', example: 'nuevo@ejemplo.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'nuevaClave123' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        ValidationErrors: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  msg: { type: 'string' },
                  path: { type: 'string' },
                  location: { type: 'string' }
                }
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
          nombre: { type: 'string', example: 'Juan' },
          apellido: { type: 'string', example: 'Pérez' },
          rol: {
            type: 'string',
            enum: ['Admin', 'Curador', 'Artista', 'Visitante'],
            example: 'Visitante'
          }
        }
      },
    },
    paths: {
      '/api/users': {
        get: {
          summary: 'Obtener todos los usuarios',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [],
          responses: {
            '200': {
              description: 'Lista de usuarios obtenida exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            },
            '401': { $ref: '#/components/schemas/Error' },
            '403': { $ref: '#/components/schemas/Error' },
            '500': { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '/api/users/{id}': {
        get: {
          summary: 'Obtener un usuario por ID',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'ID del usuario', schema: { type: 'integer' } }
          ],
          responses: {
            '200': { description: 'Usuario obtenido exitosamente', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            '401': { $ref: '#/components/schemas/Error' },
            '403': { $ref: '#/components/schemas/Error' },
            '404': { $ref: '#/components/schemas/Error' },
            '500': { $ref: '#/components/schemas/Error' }
          }
        }
      },
    }
  },
  apis: ['./src/routes/profile.routes.js', './src/routes/profileUpdate.routes.js']
};

module.exports = swaggerJsdoc(options);

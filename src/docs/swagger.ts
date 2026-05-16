import swaggerJSDoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Coding Camp Copilot API',
    version: '0.1.0',
    description: `
REST API untuk Coding Camp Copilot — Capstone Project CC26-PSU096.

**Tema**: Accessible & Adaptive Learning
**Tim**: DBS Foundation x Dicoding 2026

Saat ini hanya endpoint **Authentication** yang sudah live. Endpoint lain (chat, knowledge base, dll) menyusul.
    `.trim(),
    contact: {
      name: 'Tim CC26-PSU096',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api/v1`,
      description: 'Development server',
    },
    {
      url: '/api/v1',
      description: 'Same-origin (production)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & user session' },
    { name: 'Health', description: 'System health check' },
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
      // ── Input ─────────────────────────────────────────────
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'full_name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@codingcamp.id' },
          password: {
            type: 'string',
            minLength: 8,
            example: 'Password123',
            description: 'Min 8 char, harus ada huruf & angka',
          },
          full_name: { type: 'string', example: 'John Doe' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@codingcamp.id' },
          password: { type: 'string', example: 'copilot2026' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        },
      },

      // ── Output ────────────────────────────────────────────
      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', example: 'John Doe' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
            },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              token: { type: 'string', description: 'JWT access token' },
              refresh_token: { type: 'string' },
              expires_in: { type: 'integer', example: 900, description: 'Detik' },
            },
          },
        },
      },
      RefreshResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              refresh_token: { type: 'string' },
              expires_in: { type: 'integer', example: 900 },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'UNAUTHORIZED',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'CONFLICT',
                  'RATE_LIMITED',
                  'INTERNAL_ERROR',
                ],
              },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    issue: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validasi input gagal',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication gagal — token tidak ada/invalid/expired',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Tidak punya hak akses untuk resource ini',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      RateLimited: {
        description: 'Terlalu banyak request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  // Glob pattern relatif ke cwd. tsx & node sama-sama jalan dari root backend folder.
  apis: ['./src/modules/**/*.routes.ts', './src/routes.ts'],
});

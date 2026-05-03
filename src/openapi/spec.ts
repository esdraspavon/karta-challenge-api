import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema } from '../modules/auth/auth.schema';
import { agreementIdParam } from '../modules/agreements/agreements.schema';
import { publishAgreementSchema } from '../modules/admin/admin.schema';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const BearerAuth = registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const ApiKeyAuth = registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
});

const errorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('ErrorResponse');

const cardProgramSchema = z
  .object({
    id: z.number().int().optional(),
    code: z.string(),
    name: z.string(),
  })
  .openapi('CardProgram');

const userSchema = z
  .object({
    id: z.number().int(),
    email: z.string().email(),
    card_program: cardProgramSchema,
  })
  .openapi('User');

const loginResponseSchema = z
  .object({
    token: z.string(),
    user: userSchema,
  })
  .openapi('LoginResponse');

const agreementSchema = z
  .object({
    id: z.number().int(),
    code: z.string(),
    title: z.string(),
    version: z.number().int(),
    pdf_url: z.string().url(),
    published_at: z.string(),
    card_program: cardProgramSchema,
  })
  .openapi('Agreement');

const signatureSchema = z
  .object({
    id: z.number().int(),
    agreement_id: z.number().int(),
    signed_at: z.string(),
    pdf_url_snapshot: z.string().url(),
    agreement: z.object({
      id: z.number().int(),
      code: z.string(),
      version: z.number().int(),
      title: z.string(),
    }),
  })
  .openapi('Signature');

const signedAgreementSchema = z
  .object({
    signature_id: z.number().int(),
    agreement_id: z.number().int(),
    code: z.string(),
    title: z.string(),
    version: z.number().int(),
    signed_at: z.string(),
    pdf_url: z.string().url().describe('Snapshot of the PDF URL at sign time'),
    card_program: cardProgramSchema,
  })
  .openapi('SignedAgreement');

const publishedAgreementSchema = z
  .object({
    id: z.number().int(),
    card_program_id: z.number().int(),
    code: z.string(),
    version: z.number().int(),
    title: z.string(),
    pdf_url: z.string().url(),
    published_at: z.string(),
    card_program: cardProgramSchema,
  })
  .openapi('PublishedAgreement');

const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Liveness probe',
  responses: {
    200: { description: 'OK', ...json(z.object({ ok: z.boolean() })) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Log in with email and password',
  request: {
    body: json(loginSchema),
  },
  responses: {
    200: { description: 'OK', ...json(loginResponseSchema) },
    400: { description: 'Validation error', ...json(errorSchema) },
    401: { description: 'Invalid credentials', ...json(errorSchema) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/me',
  tags: ['User'],
  summary: 'Current user profile + card program',
  security: [{ [BearerAuth.name]: [] }],
  responses: {
    200: { description: 'OK', ...json(userSchema) },
    401: { description: 'Missing or invalid JWT', ...json(errorSchema) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/me/pending-agreements',
  tags: ['User'],
  summary: 'Latest unsigned version of each agreement for the user program',
  security: [{ [BearerAuth.name]: [] }],
  responses: {
    200: { description: 'OK', ...json(z.array(agreementSchema)) },
    401: { description: 'Missing or invalid JWT', ...json(errorSchema) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/me/signed-agreements',
  tags: ['User'],
  summary: 'History of signed agreements with snapshot pdf_url',
  security: [{ [BearerAuth.name]: [] }],
  responses: {
    200: { description: 'OK', ...json(z.array(signedAgreementSchema)) },
    401: { description: 'Missing or invalid JWT', ...json(errorSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/agreements/{agreementId}/sign',
  tags: ['User'],
  summary: 'Sign an agreement (idempotent)',
  description:
    'Calling this twice for the same `(user, agreementId)` will return 2xx both times and produce a single row in the database. The response always includes `pdf_url_snapshot`, the URL captured at first-sign time.',
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: agreementIdParam,
  },
  responses: {
    200: { description: 'Signed (or already signed)', ...json(signatureSchema) },
    401: { description: 'Missing or invalid JWT', ...json(errorSchema) },
    404: { description: 'Agreement not found for this user', ...json(errorSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/admin/agreements',
  tags: ['Admin'],
  summary: 'Publish a new version (or a brand-new agreement code)',
  description:
    'If `(card_program_code, code)` is new → creates v1. Otherwise creates vN+1. Authenticated with the admin API key.',
  security: [{ [ApiKeyAuth.name]: [] }],
  request: {
    body: json(publishAgreementSchema),
  },
  responses: {
    201: { description: 'Created', ...json(publishedAgreementSchema) },
    400: { description: 'Validation error', ...json(errorSchema) },
    401: { description: 'Missing or invalid X-API-Key', ...json(errorSchema) },
    404: { description: 'Card program not found', ...json(errorSchema) },
  },
});

export function buildOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Karta Challenge API',
      version: '1.0.0',
      description:
        'Backend for the Karta technical challenge. Two independent auth schemes: user JWT (`Authorization: Bearer ...`) and admin API key (`X-API-Key: ...`).',
    },
    servers: [{ url: 'http://localhost:3000' }],
  });
}

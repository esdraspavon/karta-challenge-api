import { z } from 'zod';

export const agreementIdParam = z.object({
  agreementId: z.string().regex(/^\d+$/, 'agreementId must be a positive integer').transform(Number),
});

export type AgreementIdParam = z.infer<typeof agreementIdParam>;

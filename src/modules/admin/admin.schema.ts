import { z } from 'zod';

export const publishAgreementSchema = z.object({
  card_program_code: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  pdf_url: z.string().url(),
});

export type PublishAgreementInput = z.infer<typeof publishAgreementSchema>;

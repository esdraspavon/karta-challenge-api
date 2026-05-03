import { db } from '../../config/db';
import { NotFound } from '../../utils/errors';
import type { PublishAgreementInput } from './admin.schema';

interface CardProgramRow {
  id: number;
  code: string;
  name: string;
}

interface AgreementRow {
  id: number;
  card_program_id: number;
  code: string;
  version: number;
  title: string;
  pdf_url: string;
  published_at: string;
}

export async function publishAgreement(input: PublishAgreementInput) {
  const program = await db<CardProgramRow>('card_programs')
    .where({ code: input.card_program_code })
    .first();
  if (!program) {
    throw NotFound(`Card program with code "${input.card_program_code}" not found`);
  }

  const result = await db('agreements')
    .where({ card_program_id: program.id, code: input.code })
    .max({ max_version: 'version' })
    .first();

  const nextVersion = (result?.max_version ?? 0) + 1;

  const [inserted] = await db<AgreementRow>('agreements')
    .insert({
      card_program_id: program.id,
      code: input.code,
      version: nextVersion,
      title: input.title,
      pdf_url: input.pdf_url,
    })
    .returning(['id', 'card_program_id', 'code', 'version', 'title', 'pdf_url', 'published_at']);

  if (!inserted) {
    throw new Error('Insert returned no row');
  }

  return {
    ...inserted,
    card_program: { id: program.id, code: program.code, name: program.name },
  };
}

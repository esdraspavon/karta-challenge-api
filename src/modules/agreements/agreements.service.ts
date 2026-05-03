import { db } from '../../config/db';
import { NotFound } from '../../utils/errors';

interface AgreementRow {
  id: number;
  card_program_id: number;
  code: string;
  version: number;
  title: string;
  pdf_url: string;
  published_at: string;
}

interface SignatureRow {
  id: number;
  user_id: number;
  agreement_id: number;
  pdf_url_snapshot: string;
  signed_at: string;
}

interface UserRow {
  id: number;
  card_program_id: number;
}

async function getUserOrThrow(userId: number): Promise<UserRow> {
  const user = await db<UserRow>('users').where({ id: userId }).first();
  if (!user) throw NotFound('User not found');
  return user;
}

export async function getPendingForUser(userId: number) {
  const user = await getUserOrThrow(userId);

  // latest version per (card_program_id, code) for the user's program,
  // excluding ones the user already signed.
  const rows = await db<AgreementRow>('agreements as a')
    .innerJoin(
      db('agreements')
        .select('card_program_id', 'code')
        .max('version as max_version')
        .where('card_program_id', user.card_program_id)
        .groupBy('card_program_id', 'code')
        .as('latest'),
      function joinOn() {
        this.on('a.card_program_id', '=', 'latest.card_program_id')
          .andOn('a.code', '=', 'latest.code')
          .andOn('a.version', '=', 'latest.max_version');
      },
    )
    .leftJoin('signatures as s', function joinOn() {
      this.on('s.agreement_id', '=', 'a.id').andOn('s.user_id', '=', db.raw('?', [userId]));
    })
    .innerJoin('card_programs as cp', 'cp.id', 'a.card_program_id')
    .whereNull('s.id')
    .where('a.card_program_id', user.card_program_id)
    .select(
      'a.id',
      'a.card_program_id',
      'cp.code as card_program_code',
      'cp.name as card_program_name',
      'a.code',
      'a.version',
      'a.title',
      'a.pdf_url',
      'a.published_at',
    )
    .orderBy(['a.code', { column: 'a.version', order: 'desc' }]);

  return rows.map((r: AgreementRow & { card_program_code: string; card_program_name: string }) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    version: r.version,
    pdf_url: r.pdf_url,
    published_at: r.published_at,
    card_program: {
      id: r.card_program_id,
      code: r.card_program_code,
      name: r.card_program_name,
    },
  }));
}

export async function signAgreement(userId: number, agreementId: number) {
  const user = await getUserOrThrow(userId);

  const agreement = await db<AgreementRow>('agreements').where({ id: agreementId }).first();
  if (!agreement || agreement.card_program_id !== user.card_program_id) {
    throw NotFound('Agreement not found for this user');
  }

  const existing = await db<SignatureRow>('signatures')
    .where({ user_id: userId, agreement_id: agreementId })
    .first();
  if (existing) {
    return formatSignature(existing, agreement);
  }

  try {
    const [inserted] = await db<SignatureRow>('signatures')
      .insert({
        user_id: userId,
        agreement_id: agreementId,
        pdf_url_snapshot: agreement.pdf_url,
      })
      .returning(['id', 'user_id', 'agreement_id', 'pdf_url_snapshot', 'signed_at']);
    if (!inserted) throw new Error('Insert returned no row');
    return formatSignature(inserted, agreement);
  } catch (err) {
    // Race-condition fallback: someone else created the row between our SELECT and INSERT.
    if (isUniqueConstraintError(err)) {
      const found = await db<SignatureRow>('signatures')
        .where({ user_id: userId, agreement_id: agreementId })
        .first();
      if (found) return formatSignature(found, agreement);
    }
    throw err;
  }
}

export async function getSignedForUser(userId: number) {
  await getUserOrThrow(userId);
  const rows = await db('signatures as s')
    .join('agreements as a', 'a.id', 's.agreement_id')
    .join('card_programs as cp', 'cp.id', 'a.card_program_id')
    .where('s.user_id', userId)
    .select(
      's.id as signature_id',
      's.signed_at',
      's.pdf_url_snapshot',
      'a.id as agreement_id',
      'a.code',
      'a.title',
      'a.version',
      'cp.code as card_program_code',
      'cp.name as card_program_name',
    )
    .orderBy('s.signed_at', 'desc');

  return rows.map((r: {
    signature_id: number;
    signed_at: string;
    pdf_url_snapshot: string;
    agreement_id: number;
    code: string;
    title: string;
    version: number;
    card_program_code: string;
    card_program_name: string;
  }) => ({
    signature_id: r.signature_id,
    agreement_id: r.agreement_id,
    code: r.code,
    title: r.title,
    version: r.version,
    signed_at: r.signed_at,
    pdf_url: r.pdf_url_snapshot, // snapshot — not the agreement's current pdf_url
    card_program: { code: r.card_program_code, name: r.card_program_name },
  }));
}

function formatSignature(sig: SignatureRow, agreement: AgreementRow) {
  return {
    id: sig.id,
    agreement_id: sig.agreement_id,
    signed_at: sig.signed_at,
    pdf_url_snapshot: sig.pdf_url_snapshot,
    agreement: {
      id: agreement.id,
      code: agreement.code,
      version: agreement.version,
      title: agreement.title,
    },
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; message?: string };
  return e.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(e.message ?? '');
}

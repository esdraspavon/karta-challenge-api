import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('agreements').del();
  await knex('agreements').insert([
    {
      card_program_id: 1,
      code: 'cardholder_agreement',
      version: 1,
      title: 'Cardholder Agreement',
      pdf_url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    },
    {
      card_program_id: 1,
      code: 'privacy_policy',
      version: 1,
      title: 'Privacy Policy',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      card_program_id: 2,
      code: 'cardholder_agreement',
      version: 1,
      title: 'Cardholder Agreement',
      pdf_url: 'https://bitcoin.org/bitcoin.pdf',
    },
    {
      card_program_id: 2,
      code: 'privacy_policy',
      version: 1,
      title: 'Privacy Policy',
      pdf_url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
    },
  ]);
}

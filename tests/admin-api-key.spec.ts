import { expect } from 'chai';
import request from 'supertest';
import { app, db, ADMIN_API_KEY } from './helpers/setup';

describe('Admin API key auth on POST /admin/agreements', () => {
  const validBody = {
    card_program_code: 'MASTERCARD_KARTA_METAL',
    code: 'cardholder_agreement',
    title: 'Cardholder Agreement',
    pdf_url: 'https://example.com/cardholder-v2.pdf',
  };

  it('rejects requests without X-API-Key with 401', async () => {
    const res = await request(app).post('/admin/agreements').send(validBody);
    expect(res.status).to.equal(401);
  });

  it('rejects requests with an invalid X-API-Key with 401', async () => {
    const res = await request(app).post('/admin/agreements').set('X-API-Key', 'wrong-key').send(validBody);
    expect(res.status).to.equal(401);
  });

  it('accepts a valid X-API-Key, persists a new version, and returns 201', async () => {
    const before = await db('agreements')
      .where({ card_program_id: 1, code: 'cardholder_agreement' })
      .count<{ n: number }[]>('* as n')
      .first();
    expect(before?.n).to.equal(1);

    const res = await request(app).post('/admin/agreements').set('X-API-Key', ADMIN_API_KEY).send(validBody);
    expect(res.status).to.equal(201);
    expect(res.body.version).to.equal(2);

    const after = await db('agreements')
      .where({ card_program_id: 1, code: 'cardholder_agreement' })
      .count<{ n: number }[]>('* as n')
      .first();
    expect(after?.n).to.equal(2);
  });
});

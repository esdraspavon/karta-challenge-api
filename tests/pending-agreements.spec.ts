import { expect } from 'chai';
import request from 'supertest';
import { app, db, ADMIN_API_KEY } from './helpers/setup';

async function loginAlice(): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'alice@karta.test', password: 'Password1!' });
  expect(res.status).to.equal(200);
  return res.body.token as string;
}

describe('GET /me/pending-agreements', () => {
  it('returns the latest version of every agreement of the user program when nothing is signed', async () => {
    const token = await loginAlice();
    const res = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
    const codes = (res.body as Array<{ code: string }>).map((a) => a.code).sort();
    expect(codes).to.deep.equal(['cardholder_agreement', 'privacy_policy']);
    for (const a of res.body) {
      expect(a.version).to.equal(1);
      expect(a.card_program.code).to.equal('MASTERCARD_KARTA_METAL');
    }
  });

  it('hides an agreement after the user signs it', async () => {
    const token = await loginAlice();
    const list1 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    const cardholder = (list1.body as Array<{ id: number; code: string }>).find((a) => a.code === 'cardholder_agreement');
    expect(cardholder).to.exist;
    const signRes = await request(app)
      .post(`/agreements/${cardholder!.id}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(signRes.status).to.equal(201);

    const list2 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    expect(list2.body).to.have.lengthOf(1);
    expect((list2.body as Array<{ code: string }>)[0]!.code).to.equal('privacy_policy');
  });

  it('reappears as v2 when admin publishes a new version of an already-signed agreement', async () => {
    const token = await loginAlice();
    const list1 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    const cardholder = (list1.body as Array<{ id: number; code: string }>).find((a) => a.code === 'cardholder_agreement')!;
    await request(app).post(`/agreements/${cardholder.id}/sign`).set('Authorization', `Bearer ${token}`);

    // admin publishes v2
    const pub = await request(app)
      .post('/admin/agreements')
      .set('X-API-Key', ADMIN_API_KEY)
      .send({
        card_program_code: 'MASTERCARD_KARTA_METAL',
        code: 'cardholder_agreement',
        title: 'Cardholder Agreement',
        pdf_url: 'https://example.com/cardholder-v2.pdf',
      });
    expect(pub.status).to.equal(201);
    expect(pub.body.version).to.equal(2);

    const list2 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    expect(list2.body).to.have.lengthOf(2);
    const v2 = (list2.body as Array<{ code: string; version: number }>).find((a) => a.code === 'cardholder_agreement')!;
    expect(v2.version).to.equal(2);
  });

  it('shows a brand-new agreement code as pending without affecting already-signed ones', async () => {
    const token = await loginAlice();
    const list1 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    const privacy = (list1.body as Array<{ id: number; code: string }>).find((a) => a.code === 'privacy_policy')!;
    await request(app).post(`/agreements/${privacy.id}/sign`).set('Authorization', `Bearer ${token}`);

    // admin publishes a new code
    await request(app)
      .post('/admin/agreements')
      .set('X-API-Key', ADMIN_API_KEY)
      .send({
        card_program_code: 'MASTERCARD_KARTA_METAL',
        code: 'esign_consent',
        title: 'E-Sign Consent',
        pdf_url: 'https://example.com/esign.pdf',
      })
      .expect(201);

    const list2 = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    const codes = (list2.body as Array<{ code: string }>).map((a) => a.code).sort();
    expect(codes).to.deep.equal(['cardholder_agreement', 'esign_consent']);
    // signed privacy_policy is preserved in history
    const signed = await request(app).get('/me/signed-agreements').set('Authorization', `Bearer ${token}`);
    const signedCodes = (signed.body as Array<{ code: string }>).map((s) => s.code);
    expect(signedCodes).to.include('privacy_policy');
    void db; // keep import alive
  });
});

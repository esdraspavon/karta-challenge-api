import { expect } from 'chai';
import request from 'supertest';
import { app, db } from './helpers/setup';

describe('PDF URL snapshot — /me/signed-agreements is immutable to later agreement edits', () => {
  it('returns the original pdf_url even after the agreement row is mutated in the DB', async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@karta.test', password: 'Password1!' });
    expect(login.status).to.equal(200);
    const token = login.body.token as string;

    const pending = await request(app)
      .get('/me/pending-agreements')
      .set('Authorization', `Bearer ${token}`);
    const target = (pending.body as Array<{ id: number; code: string; pdf_url: string }>).find(
      (a) => a.code === 'cardholder_agreement',
    );
    expect(target, 'cardholder_agreement should be pending for alice').to.exist;
    const originalUrl = target!.pdf_url;

    const signRes = await request(app)
      .post(`/agreements/${target!.id}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(signRes.status).to.equal(201);
    expect(signRes.body.pdf_url_snapshot).to.equal(originalUrl);

    // simulate someone editing the agreement's pdf_url directly in the DB
    // (could be a migration, a manual fix, or a bad actor with DB access).
    const mutatedUrl = 'https://example.com/post-sign-mutation.pdf';
    const updated = await db('agreements').where({ id: target!.id }).update({ pdf_url: mutatedUrl });
    expect(updated, 'one row should have been updated').to.equal(1);

    const signed = await request(app)
      .get('/me/signed-agreements')
      .set('Authorization', `Bearer ${token}`);
    expect(signed.status).to.equal(200);
    const entry = (signed.body as Array<{ agreement_id: number; pdf_url: string }>).find(
      (s) => s.agreement_id === target!.id,
    );
    expect(entry, 'history entry must exist for the signed agreement').to.exist;
    expect(entry!.pdf_url, 'history must show the URL the user saw at sign time').to.equal(originalUrl);
    expect(entry!.pdf_url, 'history must NOT show the post-sign mutation').to.not.equal(mutatedUrl);
  });
});

import { expect } from 'chai';
import request from 'supertest';
import { app, db } from './helpers/setup';

describe('POST /agreements/:id/sign — idempotency', () => {
  it('two consecutive calls with the same agreement produce a single signature row', async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@karta.test', password: 'Password1!' });
    expect(login.status).to.equal(200);
    const token = login.body.token as string;

    const pending = await request(app).get('/me/pending-agreements').set('Authorization', `Bearer ${token}`);
    const target = (pending.body as Array<{ id: number }>)[0]!;

    const r1 = await request(app).post(`/agreements/${target.id}/sign`).set('Authorization', `Bearer ${token}`);
    expect(r1.status).to.be.within(200, 299);

    const r2 = await request(app).post(`/agreements/${target.id}/sign`).set('Authorization', `Bearer ${token}`);
    expect(r2.status).to.be.within(200, 299);

    const count = await db('signatures')
      .where({ agreement_id: target.id, user_id: login.body.user.id })
      .count<{ n: number }[]>('* as n')
      .first();
    expect(count?.n).to.equal(1);
  });
});

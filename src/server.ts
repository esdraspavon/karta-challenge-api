import { env } from './config/env';
import { buildApp } from './app';

const app = buildApp();

app.listen(env.PORT, () => {
  console.log(`[karta-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

import { RequestHandler } from 'express';
import { ZodTypeAny, z } from 'zod';

type Source = 'body' | 'params' | 'query';

export function validate<T extends ZodTypeAny>(schema: T, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    (req as unknown as Record<Source, z.infer<T>>)[source] = result.data;
    next();
  };
}

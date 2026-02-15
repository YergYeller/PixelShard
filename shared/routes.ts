import { z } from 'zod';
import { insertRunSchema, runs, userStats, userUnlocks } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  game: {
    submitRun: {
      method: 'POST' as const,
      path: '/api/runs',
      input: insertRunSchema,
      responses: {
        201: z.custom<typeof runs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getLeaderboard: {
      method: 'GET' as const,
      path: '/api/leaderboard',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          username: z.string(),
          score: z.number(),
          characterId: z.string(),
          createdAt: z.string(), // serialized date
        })),
      },
    },
    getUnlocks: {
      method: 'GET' as const,
      path: '/api/unlocks',
      responses: {
        200: z.array(z.string()), // list of character IDs
        401: errorSchemas.unauthorized,
      },
    },
    unlockCharacter: {
      method: 'POST' as const,
      path: '/api/unlocks',
      input: z.object({ characterId: z.string() }),
      responses: {
        201: z.custom<typeof userUnlocks.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getStats: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.custom<typeof userStats.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type SubmitRunInput = z.infer<typeof api.game.submitRun.input>;
export type LeaderboardEntry = z.infer<typeof api.game.getLeaderboard.responses[200]>[0];

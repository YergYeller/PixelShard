import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import auth tables

export * from "./models/auth"; // Re-export auth tables

// === GAME TABLES ===

// Store run history
export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to auth.users.id
  characterId: text("character_id").notNull(),
  score: integer("score").notNull(),
  duration: integer("duration").notNull(), // in seconds
  coinsCollected: integer("coins_collected").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store unlocked characters (besides defaults)
export const userUnlocks = pgTable("user_unlocks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  characterId: text("character_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// We can store aggregate stats in a separate table or just query runs
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  totalCoins: integer("total_coins").default(0),
  totalRuns: integer("total_runs").default(0),
});

// === RELATIONS ===
export const runsRelations = relations(runs, ({ one }) => ({
  user: one(users, {
    fields: [runs.userId],
    references: [users.id],
  }),
}));

export const userUnlocksRelations = relations(userUnlocks, ({ one }) => ({
  user: one(users, {
    fields: [userUnlocks.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===
export const insertRunSchema = createInsertSchema(runs).omit({ 
  id: true, 
  createdAt: true,
  userId: true // set by backend from session
});

export const insertUnlockSchema = createInsertSchema(userUnlocks).omit({
  id: true,
  unlockedAt: true,
  userId: true
});

// === EXPLICIT TYPES ===
export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;

export type UserUnlock = typeof userUnlocks.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;

export type CreateRunRequest = InsertRun;

export type RunResponse = Run & {
  username?: string; // For leaderboards
};

export type UnlockResponse = {
  characterId: string;
  unlockedAt: string;
};

export type StatsResponse = UserStats;

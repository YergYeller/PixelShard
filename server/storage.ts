import { 
  runs, userUnlocks, userStats,
  type Run, type InsertRun, 
  type UserUnlock, type UserStats
} from "@shared/schema";
import { users } from "@shared/models/auth"; // Import users from auth models
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage"; // Import auth storage

export interface IStorage extends IAuthStorage {
  // Game methods
  createRun(run: InsertRun): Promise<Run>;
  getLeaderboard(limit?: number): Promise<(Run & { username: string })[]>;
  getUnlocks(userId: string): Promise<string[]>;
  unlockCharacter(userId: string, characterId: string): Promise<UserUnlock>;
  getUserStats(userId: string): Promise<UserStats>;
  updateUserStats(userId: string, coinsCollected: number): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  // === Auth Methods (Delegated or Re-implemented if needed) ===
  async getUser(id: string) {
    return authStorage.getUser(id);
  }

  async upsertUser(user: any) {
    return authStorage.upsertUser(user);
  }

  // === Game Methods ===
  async createRun(run: InsertRun): Promise<Run> {
    const [newRun] = await db.insert(runs).values(run).returning();
    return newRun;
  }

  async getLeaderboard(limit = 10): Promise<(Run & { username: string })[]> {
    // Join with users to get username
    const result = await db
      .select({
        id: runs.id,
        userId: runs.userId,
        characterId: runs.characterId,
        score: runs.score,
        duration: runs.duration,
        coinsCollected: runs.coinsCollected,
        createdAt: runs.createdAt,
        username: users.email // Using email as username for now, or nickname if available
      })
      .from(runs)
      .leftJoin(users, eq(runs.userId, users.id))
      .orderBy(desc(runs.score))
      .limit(limit);
    
    // Map null usernames to 'Unknown'
    return result.map(r => ({
      ...r,
      username: r.username || 'Unknown User'
    }));
  }

  async getUnlocks(userId: string): Promise<string[]> {
    const unlocks = await db
      .select()
      .from(userUnlocks)
      .where(eq(userUnlocks.userId, userId));
    return unlocks.map(u => u.characterId);
  }

  async unlockCharacter(userId: string, characterId: string): Promise<UserUnlock> {
    const [unlock] = await db
      .insert(userUnlocks)
      .values({ userId, characterId })
      .onConflictDoNothing() // Prevent duplicates
      .returning();
    
    if (!unlock) {
      // Return existing if already unlocked
      const [existing] = await db
        .select()
        .from(userUnlocks)
        .where(sql`${userUnlocks.userId} = ${userId} AND ${userUnlocks.characterId} = ${characterId}`);
      return existing;
    }
    return unlock;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    
    if (!stats) {
      // Create default stats
      const [newStats] = await db
        .insert(userStats)
        .values({ userId, totalCoins: 0, totalRuns: 0 })
        .returning();
      return newStats;
    }
    return stats;
  }

  async updateUserStats(userId: string, coinsCollected: number): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    
    const [updated] = await db
      .update(userStats)
      .set({
        totalCoins: (stats.totalCoins || 0) + coinsCollected,
        totalRuns: (stats.totalRuns || 0) + 1
      })
      .where(eq(userStats.userId, userId))
      .returning();
    
    return updated;
  }
}

export const storage = new DatabaseStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Game Routes ===

  // Submit Run
  app.post(api.game.submitRun.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;

      const input = api.game.submitRun.input.parse({
        ...req.body,
        userId // Force userId from session
      });

      const run = await storage.createRun(input);
      
      // Update stats side-effect
      await storage.updateUserStats(userId, input.coinsCollected);

      res.status(201).json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Get Leaderboard (Public)
  app.get(api.game.getLeaderboard.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  // Get Unlocks
  app.get(api.game.getUnlocks.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user.claims.sub;
    const unlocks = await storage.getUnlocks(userId);
    res.json(unlocks);
  });

  // Unlock Character
  app.post(api.game.unlockCharacter.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const { characterId } = req.body;

      if (!characterId) return res.status(400).json({ message: "Missing characterId" });

      const unlock = await storage.unlockCharacter(userId, characterId);
      res.status(201).json(unlock);
    } catch (err) {
      res.status(500).json({ message: "Failed to unlock character" });
    }
  });

  // Get Stats
  app.get(api.game.getStats.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user.claims.sub;
    const stats = await storage.getUserStats(userId);
    res.json(stats);
  });

  return httpServer;
}

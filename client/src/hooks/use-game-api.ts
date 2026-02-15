import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SubmitRunInput, type LeaderboardEntry, type UnlockResponse, type StatsResponse } from "@shared/routes";
import { useAuth } from "./use-auth";

// ============================================
// GAME API HOOKS
// ============================================

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: [api.game.getLeaderboard.path],
    queryFn: async () => {
      const res = await fetch(api.game.getLeaderboard.path);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.game.getLeaderboard.responses[200].parse(await res.json());
    },
  });
}

export function useUnlocks() {
  const { isAuthenticated } = useAuth();
  return useQuery<string[]>({
    queryKey: [api.game.getUnlocks.path],
    queryFn: async () => {
      const res = await fetch(api.game.getUnlocks.path, { credentials: "include" });
      if (res.status === 401) return []; // Return empty if not logged in
      if (!res.ok) throw new Error("Failed to fetch unlocks");
      return api.game.getUnlocks.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated, // Only fetch if logged in
  });
}

export function useUserStats() {
  const { isAuthenticated } = useAuth();
  return useQuery<StatsResponse | null>({
    queryKey: [api.game.getStats.path],
    queryFn: async () => {
      const res = await fetch(api.game.getStats.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.game.getStats.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated,
  });
}

export function useSubmitRun() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (data: SubmitRunInput) => {
      if (!isAuthenticated) return; // Don't submit if not logged in
      
      const validated = api.game.submitRun.input.parse(data);
      const res = await fetch(api.game.submitRun.path, {
        method: api.game.submitRun.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to submit run");
      }
      return api.game.submitRun.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.getLeaderboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.game.getStats.path] });
    },
  });
}

export function useUnlockCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (characterId: string) => {
      const res = await fetch(api.game.unlockCharacter.path, {
        method: api.game.unlockCharacter.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to unlock character");
      }
      return api.game.unlockCharacter.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.getUnlocks.path] });
    },
  });
}

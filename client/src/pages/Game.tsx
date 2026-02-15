import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameOverlay } from "@/components/ui/GameOverlay";
import { PixelButton } from "@/components/ui/PixelButton";
import { useSubmitRun } from "@/hooks/use-game-api";
import { motion } from "framer-motion";

export default function Game() {
  const [location, setLocation] = useLocation();
  const [gameOverStats, setGameOverStats] = useState<{ score: number; duration: number; coins: number } | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Get character from navigation state (mock for now, ideally passed via route params or context)
  const characterId = "commando"; // Default

  const submitRunMutation = useSubmitRun();

  const handleGameOver = (stats: { score: number; duration: number; coins: number }) => {
    setGameOverStats(stats);
    submitRunMutation.mutate({
      score: stats.score,
      duration: stats.duration,
      coinsCollected: stats.coins,
      characterId,
    });
  };

  const handleCoinCollect = (amount: number) => {
    setCurrentCoins(prev => prev + amount);
    setCurrentScore(prev => prev + (amount * 10));
  };

  // Escape to pause
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !gameOverStats) {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [gameOverStats]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-20" />
      
      <GameCanvas 
        characterId={characterId} 
        onGameOver={handleGameOver} 
        onCoinCollect={handleCoinCollect}
        isPaused={isPaused || !!gameOverStats}
      />

      {/* In-Game HUD */}
      {!gameOverStats && !isPaused && (
        <GameOverlay 
          score={currentScore} 
          coins={currentCoins} 
          hp={100} // Mock HP, should come from canvas state via callback in a real app
          maxHp={100} 
          characterName={characterId.toUpperCase()} 
        />
      )}

      {/* Pause Menu */}
      {isPaused && !gameOverStats && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="flex flex-col gap-6 text-center">
            <h2 className="text-4xl font-pixel text-white mb-4">PAUSED</h2>
            <PixelButton onClick={() => setIsPaused(false)}>Resume</PixelButton>
            <PixelButton variant="secondary" onClick={() => setLocation("/")}>Quit to Menu</PixelButton>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOverStats && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <div className="max-w-md w-full p-8 border border-white/10 bg-black/50 rounded-2xl">
            <h2 className="text-4xl font-pixel text-red-500 mb-8 text-center text-shadow-neon">DEFEATED</h2>
            
            <div className="space-y-4 mb-8 font-tech text-lg">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Score</span>
                <span className="text-primary font-bold">{gameOverStats.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Time Survived</span>
                <span className="text-white">{Math.floor(gameOverStats.duration / 60)}m {gameOverStats.duration % 60}s</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Coins Collected</span>
                <span className="text-yellow-400">{gameOverStats.coins}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <PixelButton onClick={() => window.location.reload()}>Try Again</PixelButton>
              <PixelButton variant="secondary" onClick={() => setLocation("/")}>Return to Base</PixelButton>
            </div>
            
            {submitRunMutation.isPending && (
                <p className="text-center text-xs text-white/40 mt-4 animate-pulse">Syncing run data...</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

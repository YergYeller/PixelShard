import { motion, AnimatePresence } from "framer-motion";
import { Coins, Heart, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GameOverlayProps {
  score: number;
  coins: number;
  hp: number;
  maxHp: number;
  characterName: string;
}

export function GameOverlay({ score, coins, hp, maxHp, characterName }: GameOverlayProps) {
  const hpPercent = (hp / maxHp) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Player Stats */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-white/10">
            <div className="w-12 h-12 bg-primary/20 rounded border border-primary flex items-center justify-center">
                {/* Character Icon Placeholder */}
                <span className="text-xs font-bold text-primary">{characterName.slice(0, 2)}</span>
            </div>
            <div className="flex flex-col w-48">
              <div className="flex justify-between text-xs uppercase tracking-wider mb-1">
                <span>{characterName}</span>
                <span className="text-primary">{Math.ceil(hp)}/{maxHp} HP</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: "100%" }}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Score & Coins */}
        <div className="flex gap-4">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-yellow-400">
            <Coins size={18} />
            <span className="font-pixel text-sm">{coins}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-primary">
            <Trophy size={18} />
            <span className="font-pixel text-sm">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom - Skills (Visual Only for now) */}
      <div className="flex justify-center gap-4">
        {['Q', 'W', 'E', 'R'].map((key) => (
            <div key={key} className="w-12 h-12 bg-black/60 border border-white/20 rounded flex items-center justify-center relative">
                <span className="absolute top-1 left-1 text-[10px] text-white/50">{key}</span>
                <div className="w-8 h-8 bg-white/5 rounded-sm"></div>
            </div>
        ))}
      </div>
    </div>
  );
}

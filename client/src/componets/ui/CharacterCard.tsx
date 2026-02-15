import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface CharacterCardProps {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUnlock?: () => void; // For dev purposes or manual unlock logic
}

export function CharacterCard({ id, name, description, isUnlocked, isSelected, onSelect }: CharacterCardProps) {
  return (
    <div 
      onClick={isUnlocked ? onSelect : undefined}
      className={cn(
        "relative aspect-[3/4] p-4 border-2 transition-all duration-300 group cursor-pointer overflow-hidden",
        isSelected 
          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105" 
          : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5",
        !isUnlocked && "opacity-50 cursor-not-allowed grayscale"
      )}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="text-right">
            {isSelected && <div className="inline-block w-2 h-2 bg-primary animate-pulse rounded-full" />}
        </div>

        <div className="space-y-2">
            <h3 className={cn("font-pixel text-sm uppercase", isSelected ? "text-primary text-shadow-neon" : "text-white")}>
                {isUnlocked ? name : "???"}
            </h3>
            <p className="text-[10px] text-white/60 font-tech leading-relaxed">
                {isUnlocked ? description : "Complete challenges to unlock this survivor."}
            </p>
        </div>
      </div>

      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <Lock className="w-8 h-8 text-white/30" />
        </div>
      )}

      {/* Selection Border Glow */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

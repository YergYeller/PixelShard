import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { PixelButton } from "@/components/ui/PixelButton";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white relative overflow-hidden">
      <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-20" />
      
      <div className="text-center space-y-8 relative z-10 max-w-md p-8 border border-white/10 bg-black/50 rounded-2xl backdrop-blur-md">
        <AlertTriangle className="w-24 h-24 text-primary mx-auto opacity-80 animate-pulse" />
        
        <div>
            <h1 className="text-4xl font-pixel mb-2 text-primary">404 ERROR</h1>
            <p className="text-white/50 font-mono tracking-widest text-xs">SIGNAL LOST // SECTOR UNKNOWN</p>
        </div>
        
        <p className="text-white/70 font-tech">
          The navigation coordinates you entered do not correspond to any known sector in this system.
        </p>

        <Link href="/">
          <PixelButton className="w-full">Initiate Emergency Warp</PixelButton>
        </Link>
      </div>
    </div>
  );
}

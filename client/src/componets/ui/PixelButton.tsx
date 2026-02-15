import { cn } from "@/lib/utils";
import React from "react";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function PixelButton({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  ...props 
}: PixelButtonProps) {
  
  const variants = {
    primary: "border-primary/50 text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    secondary: "border-white/20 text-white/80 hover:bg-white/5 hover:border-white/40",
    danger: "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]",
    ghost: "border-transparent text-white/60 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-3 py-2 text-[10px]",
    md: "px-6 py-4 text-xs",
    lg: "px-8 py-6 text-sm"
  };

  return (
    <button 
      className={cn(
        "font-pixel uppercase tracking-wider transition-all duration-200 border-2 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

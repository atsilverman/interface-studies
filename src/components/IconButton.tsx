import { type ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  filled?: boolean;
  hoverTone?: "play" | "pause" | "reset";
};

const hoverToneClass = {
  play: "hover:bg-emerald-500 hover:text-white hover:ring-emerald-500",
  pause: "hover:bg-amber-400 hover:text-zinc-900 hover:ring-amber-400",
  reset: "hover:bg-red-500 hover:text-white hover:ring-red-500",
} as const;

export function IconButton({ label, filled, hoverTone, className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex items-center justify-center rounded-full transition-colors ${
        className.includes("size-") ? "" : "size-9"
      } ${
        filled ? "bg-zinc-900 text-white" : "text-zinc-500 ring-1 ring-zinc-200"
      } ${hoverTone ? hoverToneClass[hoverTone] : filled ? "hover:bg-zinc-800" : "hover:text-zinc-900"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

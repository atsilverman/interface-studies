import { type ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  filled?: boolean;
};

export function IconButton({ label, filled, className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex size-8 items-center justify-center rounded-full transition-colors ${
        filled
          ? "bg-zinc-900 text-white hover:bg-zinc-800"
          : "text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true">
      <path d="M2.2 1.15c0-.55.6-.9 1.07-.64l6.2 3.35c.48.26.48 1.02 0 1.28l-6.2 3.35c-.47.26-1.07-.09-1.07-.64V1.15Z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x="1.4" y="1.2" width="2.4" height="7.6" rx="0.7" />
      <rect x="6.2" y="1.2" width="2.4" height="7.6" rx="0.7" />
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.1 6A3.9 3.9 0 1 0 4 2.35"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M1.6 3.55 2.2 2.1 3.7 2.55" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

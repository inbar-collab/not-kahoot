"use client";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "quiet";
type Size = "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold text-ink-950 hover:bg-gold-soft active:bg-gold-deep disabled:bg-ink-700 disabled:text-mute shadow-[0_8px_30px_-12px_rgb(214_176_107/0.6)] disabled:shadow-none",
  secondary:
    "border-2 border-gold/70 text-gold-soft hover:bg-gold/10 active:bg-gold/20 disabled:border-ink-600 disabled:text-ink-500",
  ghost: "bg-ink-800 text-cream hover:bg-ink-700 active:bg-ink-600 disabled:text-ink-500 disabled:bg-ink-850",
  quiet: "text-mute underline-offset-4 hover:text-cream hover:underline disabled:text-ink-500",
};

const SIZES: Record<Size, string> = {
  md: "min-h-[52px] px-5 text-lg rounded-2xl",
  lg: "min-h-[64px] px-6 text-xl rounded-2xl",
  xl: "min-h-[76px] px-8 text-2xl rounded-3xl",
};

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  busy = false,
  children,
  disabled,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex select-none items-center justify-center gap-2 font-bold transition-colors duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${variant === "quiet" ? "min-h-[44px] px-2 text-base" : SIZES[size]} ${className}`}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent ${className}`}
    />
  );
}

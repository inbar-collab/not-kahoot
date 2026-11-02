"use client";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "quiet";
type Size = "md" | "lg" | "xl";

// Primary and ghost buttons are "physical": a darker bottom edge that the
// button presses into (see .btn-* in globals.css).
const VARIANTS: Record<Variant, string> = {
  primary: "btn-press btn-primary",
  secondary: "border-2 border-gold/70 text-gold-soft hover:bg-gold/10 active:bg-gold/20 disabled:border-ink-600 disabled:text-ink-500",
  ghost: "btn-press btn-ghost",
  quiet: "text-mute underline-offset-4 hover:text-cream hover:underline disabled:text-ink-500",
};

const SIZES: Record<Size, string> = {
  md: "min-h-[52px] px-5 text-lg rounded-2xl",
  lg: "min-h-[62px] px-6 text-xl rounded-2xl",
  xl: "min-h-[74px] px-8 text-2xl rounded-[1.4rem]",
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
      className={`inline-flex select-none items-center justify-center gap-2 font-extrabold transition duration-100 disabled:cursor-not-allowed ${VARIANTS[variant]} ${variant === "quiet" ? "min-h-[44px] px-2 text-base" : SIZES[size]} ${className}`}
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

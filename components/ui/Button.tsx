import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-colors rounded-lg disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

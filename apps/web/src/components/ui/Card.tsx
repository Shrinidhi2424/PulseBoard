import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-slate-900/80 border border-slate-800 text-slate-100 backdrop-blur-sm",
  elevated: "bg-slate-850 border border-slate-750 text-slate-100 shadow-lg shadow-black/40",
  interactive:
    "bg-slate-900 border border-slate-800 text-slate-100 hover:border-slate-700 hover:shadow-md transition-all duration-150 cursor-pointer",
  subtle: "bg-slate-900/40 border border-slate-850 text-slate-200",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card: React.FC<CardProps> = ({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

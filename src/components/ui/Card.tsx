import type { HTMLAttributes, ReactNode } from "react";

// ===================================
// Types
// ===================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

// ===================================
// Component
// ===================================

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  // Base styles
  const baseStyles = "rounded-xl bg-white dark:bg-gray-800";

  // Variant styles
  const variantStyles = {
    default: "shadow-sm",
    elevated: "shadow-lg",
    outlined: "border border-gray-200 dark:border-gray-700",
  };

  // Padding styles
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  return (
    <div className={combinedStyles} {...props}>
      {children}
    </div>
  );
}

// ===================================
// Card Header
// ===================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// ===================================
// Card Title
// ===================================

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
}

export function CardTitle({
  children,
  as: Tag = "h2",
  className = "",
  ...props
}: CardTitleProps) {
  return (
    <Tag
      className={`text-xl font-semibold text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ===================================
// Card Description
// ===================================

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({
  children,
  className = "",
  ...props
}: CardDescriptionProps) {
  return (
    <p className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

// ===================================
// Card Content
// ===================================

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

// ===================================
// Card Footer
// ===================================

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`mt-6 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;

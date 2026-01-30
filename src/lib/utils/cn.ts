// Utility function for conditionally joining classNames
// Commonly used pattern in Tailwind CSS projects

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

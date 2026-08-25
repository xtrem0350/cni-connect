import { cn } from "@/lib/utils";

interface Icon3DProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

export function Icon3D({ src, alt, size = "md", className }: Icon3DProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain drop-shadow-lg transition-transform duration-200 hover:scale-110", sizes[size], className)}
      loading="lazy"
    />
  );
}

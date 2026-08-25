import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ImageBannerProps {
  src: string;
  alt: string;
  className?: string;
  height?: string;
  overlay?: boolean;
  children?: ReactNode;
}

export function ImageBanner({
  src,
  alt,
  className,
  height = "h-48 md:h-64",
  overlay = true,
  children,
}: ImageBannerProps) {
  return (
    <div className={cn("group relative w-full overflow-hidden rounded-3xl shadow-sm", height, className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {overlay ? (
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent"
          aria-hidden
        />
      ) : null}
      {children ? (
        <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 text-white sm:p-7">
          {children}
        </div>
      ) : null}
    </div>
  );
}

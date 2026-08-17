type HeroBannerProps = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
};

export function HeroBanner({ imageUrl, title, subtitle }: HeroBannerProps) {
  if (imageUrl) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <img
          src={imageUrl}
          alt={title ?? "Bannière de section"}
          className="h-48 w-full rounded-3xl object-cover sm:h-56"
        />
        {title ? (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent p-5">
            <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-center text-3xl font-bold md:text-4xl">{title ?? "Retrouve CNI"}</h1>
        {subtitle ? <p className="mt-2 text-center text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

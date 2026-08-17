import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, CalendarDays } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

type DocumentCardProps = {
  title: string;
  status: "actif" | "matché" | "restitué" | "inactif";
  location: string;
  date: string;
  href?: string;
};

export function DocumentCard({ title, status, location, date, href = "/declarations" }: DocumentCardProps) {
  return (
    <article className="surface-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" aria-hidden />
          {location}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {date}
        </div>
      </div>

      <Link to={href} className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Voir le détail
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}

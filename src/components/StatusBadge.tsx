type StatusBadgeProps = {
  status: "actif" | "matché" | "restitué" | "inactif";
};

const styles = {
  actif: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  matché: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  restitué: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  inactif: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = {
    actif: "Actif",
    matché: "Matché",
    restitué: "Restitué",
    inactif: "Inactif",
  }[status];

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{label}</span>;
}

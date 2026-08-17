import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — Retrouve CNI 2026" },
      { name: "description", content: "Consultez votre profil et votre historique." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-5">
        <div className="surface-card flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14">
            <AvatarImage src="" alt="Avatar utilisateur" />
            <AvatarFallback>UC</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">Utilisateur Connecté</h1>
            <p className="text-sm text-muted-foreground">Téléphone vérifié</p>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-semibold">Informations</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>Nom : Utilisateur Connecté</p>
            <p>Téléphone : +225 07 00 00 00 00</p>
            <p>Statut : Vérifié</p>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-semibold">Historique des paiements</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>500 F — Paiement de mise en relation — 12 août 2026</li>
            <li>0 F — Déclaration gratuite — 08 août 2026</li>
          </ul>
        </div>

        <Button variant="outline" className="w-full">
          Se déconnecter
        </Button>
      </div>
    </AppShell>
  );
}

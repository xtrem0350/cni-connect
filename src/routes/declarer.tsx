import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/services/authService";

export const Route = createFileRoute("/declarer")({
  head: () => ({
    meta: [
      { title: "Déclarer un document — Retrouve CNI 2026" },
      { name: "description", content: "Déclarez un document perdu ou trouvé en quelques étapes." },
    ],
  }),
  component: DeclarerPage,
});

function DeclarerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ status?: string } | null>(null);
  const [type, setType] = useState("cni");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    getUserProfile(user.id)
      .then(({ data }) => {
        setUserProfile(data ?? null);
      })
      .catch(() => setUserProfile(null));
  }, [user]);

  const defaultType = userProfile?.status || "perdu";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/dashboard" });
    }, 600);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Déclarer un document</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sélectionnez le type de document puis enregistrez votre déclaration.
        </p>

        <form onSubmit={handleSubmit} className="surface-card mt-6 space-y-5 p-5">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Type de pièce</Label>
            <RadioGroup value={type} onValueChange={setType} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="cni" value="cni" />
                <Label htmlFor="cni">CNI</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="passeport" value="passeport" />
                <Label htmlFor="passeport">Passeport</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <strong>Mode :</strong> {defaultType === "perdu" ? "📄 J'ai perdu un document" : "📄 J'ai trouvé un document"}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birth-date">Date de naissance</Label>
              <Input id="birth-date" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth-place">Lieu de naissance</Label>
              <Input id="birth-place" placeholder="Abidjan" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="issue-date">Date de délivrance</Label>
              <Input id="issue-date" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-place">Lieu de délivrance</Label>
              <Input id="issue-place" placeholder="Yopougon" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-number">Numéro de pièce</Label>
            <Input id="document-number" placeholder="Numéro du document" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Déclaration en cours..." : "Déclarer"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

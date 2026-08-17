import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/signalement")({
  head: () => ({
    meta: [
      { title: "Signaler un abus — Retrouve CNI 2026" },
      {
        name: "description",
        content:
          "Fausse déclaration, information incorrecte ou spam : signalez-le, notre équipe répond sous 24h.",
      },
      { property: "og:title", content: "Signaler un abus — Retrouve CNI 2026" },
      { property: "og:description", content: "Modération humaine, réponse sous 24h." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Signalement,
});

const RAISONS = [
  { value: "fausse_declaration", label: "Fausse déclaration" },
  { value: "info_incorrecte", label: "Information incorrecte" },
  { value: "spam", label: "Spam ou arnaque" },
];

function Signalement() {
  const { user } = useAuth();
  const [raison, setRaison] = useState("fausse_declaration");
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-12 text-center">
          <h2 className="text-xl font-bold">🔒 Connexion requise</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous devez être connecté pour signaler un abus.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  async function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      toast.error("Connexion requise", { description: "Vous devez être connecté pour signaler." });
      return;
    }

    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error } = await supabase.from("signalements").insert({
      raison,
      details: String(form.get("details") ?? ""),
      email_contact: String(form.get("email") ?? ""),
      user_id: user.id,
    });
    setLoading(false);
    if (error) {
      toast.error("Envoi impossible", { description: error.message });
      return;
    }
    setEnvoye(true);
    toast.success("Signalement envoyé", { description: "Nous revenons vers vous sous 24h." });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">Signaler un abus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque signalement est examiné par un humain. Réponse garantie sous 24h.
        </p>

        {envoye ? (
          <div className="surface-card mt-6 p-6 text-sm">
            <p className="font-semibold text-primary">Merci, c'est bien reçu.</p>
            <p className="mt-2 text-muted-foreground">
              Notre équipe traite votre signalement et vous répond sous 24h.
            </p>
          </div>
        ) : (
          <form onSubmit={envoyer} className="surface-card mt-6 space-y-5 p-5">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Motif du signalement</legend>
              <RadioGroup value={raison} onValueChange={setRaison} className="gap-3">
                {RAISONS.map((item) => (
                  <div key={item.value} className="flex items-center gap-2">
                    <RadioGroupItem id={item.value} value={item.value} />
                    <Label htmlFor={item.value} className="font-normal">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="details">Détails</Label>
              <Textarea id="details" name="details" rows={5} required maxLength={1500} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email de contact (optionnel)</Label>
              <Input id="email" name="email" type="email" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Envoyer le signalement
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

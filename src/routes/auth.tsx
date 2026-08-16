import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Retrouve CNI 2026" },
      {
        name: "description",
        content: "Connectez-vous ou créez un compte pour déclarer un document perdu ou trouvé.",
      },
      { property: "og:title", content: "Connexion — Retrouve CNI 2026" },
      { property: "og:description", content: "Accédez à vos déclarations et à vos mises en relation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.navigate({ to: "/dashboard" });
  }, [user, router]);

  async function connexion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error("Connexion impossible", { description: error.message });
      return;
    }
    router.navigate({ to: "/dashboard" });
  }

  async function inscription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { nom: String(form.get("nom") ?? ""), telephone: String(form.get("telephone") ?? "") },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }
    toast.success("Compte créé", { description: "Vous pouvez maintenant déclarer un document." });
    router.navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">Votre espace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un compte permet de suivre vos déclarations et d'accéder au chat sécurisé.
        </p>

        <Tabs defaultValue="connexion" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connexion">Connexion</TabsTrigger>
            <TabsTrigger value="inscription">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="connexion">
            <form onSubmit={connexion} className="surface-card space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="email-connexion">Email</Label>
                <Input id="email-connexion" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-connexion">Mot de passe</Label>
                <Input
                  id="password-connexion"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Se connecter
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="inscription">
            <form onSubmit={inscription} className="surface-card space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom complet</Label>
                <Input id="nom" name="nom" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone">Téléphone (WhatsApp)</Label>
                <Input id="telephone" name="telephone" inputMode="tel" placeholder="+225 ..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-inscription">Email</Label>
                <Input id="email-inscription" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-inscription">Mot de passe</Label>
                <Input
                  id="password-inscription"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Créer mon compte
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

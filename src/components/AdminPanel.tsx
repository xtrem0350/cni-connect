import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase";

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingDatabase, setResettingDatabase] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        "ATTENTION : toutes les données de test seront supprimées, y compris les comptes Auth. Continuer ?",
      ) ||
      !window.confirm("Dernière confirmation : cette suppression est irréversible.")
    ) {
      return;
    }

    setResettingDatabase(true);
    try {
      const { error } = await supabase.rpc("reset_test_database", { reset_code: "@Cni" });
      if (error) throw error;
      window.sessionStorage.clear();
      window.localStorage.clear();
      toast.success("Base de test vidée. Rechargement de l'application...");
      window.setTimeout(() => window.location.assign("/"), 800);
    } catch (error) {
      console.error("[admin] Échec de la remise à zéro de la base", error);
      toast.error("Impossible de vider la base. Exécutez d'abord la migration Supabase.");
    } finally {
      setResettingDatabase(false);
    }
  };

  // Inscription Admin
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "admin" },
        },
      });
      if (error) throw error;
      toast.success("✅ Compte admin créé avec succès !");
      setEmail("");
      setPassword("");
      setActiveTab("login");
    } catch (error: unknown) {
      toast.error(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Connexion Admin
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("✅ Connexion réussie !");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: unknown) {
      toast.error(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">🔑 Connexion</TabsTrigger>
          <TabsTrigger value="signup">👤 Inscription</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-primary text-primary-foreground"
            >
              {loading ? "⏳ Connexion..." : "🔐 Se connecter"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Mot de passe</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-primary text-primary-foreground"
            >
              {loading ? "⏳ Création..." : "📝 Créer un compte admin"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="mt-6 space-y-2 border-t border-red-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Outil de test temporaire
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => void handleResetDatabase()}
          disabled={resettingDatabase}
        >
          {resettingDatabase ? "Suppression en cours..." : "Vider toute la base de test"}
        </Button>
      </div>

      <Button variant="ghost" onClick={onClose} className="w-full mt-4 text-sm text-gray-500">
        ← Retour
      </Button>
    </div>
  );
}

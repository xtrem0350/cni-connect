import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const getInitialStatus = (): "perdu" | "trouve" => {
  if (typeof window === "undefined") return "perdu";
  const value = new URLSearchParams(window.location.search).get("status");
  return value === "trouve" ? "trouve" : "perdu";
};

const pad = (value: number) => String(value).padStart(2, "0");

function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"perdu" | "trouve">(getInitialStatus);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeFromDB, setCodeFromDB] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.navigate({ to: "/dashboard" });
    return null;
  }

  const generateCode = () => {
    const now = new Date();
    const code = `${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${status === "perdu" ? "P" : "T"}`;
    setGeneratedCode(code);
    setEnteredCode(code);
    sessionStorage.setItem("new_phone", phone);
    sessionStorage.setItem("new_code", code);
    sessionStorage.setItem("new_status", status);
    return code;
  };

  const checkPhone = async () => {
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro WhatsApp");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("auth_code, status, id, phone")
        .eq("phone", phone)
        .maybeSingle();

      if (error) {
        console.error("Erreur Supabase:", error);
        toast.error("Erreur de vérification du numéro");
        return;
      }

      if (data) {
        setIsNewUser(false);
        setCodeFromDB(String(data.auth_code ?? ""));
        setStatus((data.status as "perdu" | "trouve") ?? status);
        setGeneratedCode("");
        setEnteredCode("");
        setStep("code");
        toast.info("Bienvenue ! Entrez votre code");
        return;
      }

      const newCode = generateCode();
      setIsNewUser(true);
      setCodeFromDB("");
      setGeneratedCode(newCode);
      setEnteredCode(newCode);
      setStatus(status);
      setStep("code");
      toast.info("Nouveau citoyen ! Code généré");
    } catch (e) {
      console.error("Erreur:", e);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!phone.trim()) {
      toast.error("Entrez votre numéro WhatsApp");
      return;
    }

    setLoading(true);

    try {
      if (isNewUser) {
        if (!generatedCode) {
          toast.error("Générez d’abord votre code");
          return;
        }

        const { error } = await supabase.from("profiles").insert({
          phone,
          auth_code: generatedCode,
          status,
          is_admin: false,
        });

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        if (enteredCode !== codeFromDB) {
          toast.error("Code incorrect");
          return;
        }
      }

      sessionStorage.removeItem("new_phone");
      sessionStorage.removeItem("new_code");
      sessionStorage.removeItem("new_status");
      toast.success("Connexion réussie");
      router.navigate({ to: "/dashboard" });
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const codeInput = (
    <Input
      placeholder={isNewUser === false ? "Entrez votre code" : "Saisir le code"}
      value={enteredCode}
      onChange={(event) => setEnteredCode(event.target.value.toUpperCase())}
      maxLength={9}
    />
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-5 py-4">
        <HeroBanner title="Identifiez-vous" subtitle="Entrez votre numéro WhatsApp" />

        {step === "phone" ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Mode sélectionné : {status === "perdu" ? "📄 J'ai perdu" : "📄 J'ai trouvé"}</p>
            <Input
              placeholder="+225 01 23 45 67"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Button className="w-full" onClick={checkPhone} disabled={loading}>
              {loading ? "Vérification..." : "Vérifier le numéro"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            {isNewUser === false ? (
              <>
                <p className="text-sm text-muted-foreground">Si déjà inscrit, entrez votre code.</p>
                {codeInput}
              </>
            ) : isNewUser === true ? (
              <>
                {!generatedCode ? (
                  <>
                    <p className="text-sm text-muted-foreground">Aucun compte trouvé pour ce numéro. Générez votre code d’identification.</p>
                    <Button className="w-full" onClick={generateCode}>
                      Générer mon code
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Votre code a été généré une seule fois.</p>
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/10 p-5 text-center">
                      <p className="font-mono text-4xl font-bold tracking-[0.2em] text-primary">{generatedCode}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        if (!generatedCode) return;
                        try {
                          await navigator.clipboard.writeText(generatedCode);
                          toast.success("Code copié !");
                        } catch {
                          toast.error("Copie impossible dans ce navigateur");
                        }
                      }}
                    >
                      Copier le code
                    </Button>
                    {codeInput}
                  </>
                )}
              </>
            ) : null}

            <Button className="w-full" onClick={handleConnect} disabled={loading}>
              {loading ? "Vérification..." : "S'identifier"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setStep("phone")}>
              Retour
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}


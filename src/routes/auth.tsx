import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { sendOTP, verifyOTP } from "@/services/authService";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const getInitialStatus = (): "perdu" | "trouve" => {
  if (typeof window === "undefined") return "perdu";
  const value = new URLSearchParams(window.location.search).get("status");
  return value === "trouve" ? "trouve" : "perdu";
};

function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"perdu" | "trouve">(getInitialStatus);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.navigate({ to: "/dashboard" });
    return null;
  }

  const checkPhone = async () => {
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro WhatsApp");
      return;
    }

    setLoading(true);

    const result = await sendOTP(phone.trim());
    setLoading(false);
    if (!result.success) {
      toast.error("Envoi du code impossible", { description: result.error });
      return;
    }
    setIsNewUser(true);
    setStep("code");
    toast.success("Code envoyé", { description: "Consultez votre SMS de vérification." });
  };

  const handleConnect = async () => {
    if (!phone.trim()) {
      toast.error("Entrez votre numéro WhatsApp");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(phone.trim(), enteredCode.trim(), status);
      if (!result.success) {
        toast.error("Code incorrect", { description: result.error });
        return;
      }

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
                <p className="text-sm text-muted-foreground">Un code de vérification vient d’être envoyé à ce numéro.</p>
                {codeInput}
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


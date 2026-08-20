import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/PhoneInput";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";
import { formatPhoneForSupabase, isValidPhone } from "@/utils/phone";

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
  const [phone, setPhone] = useState("+225");
  const [status, setStatus] = useState<"perdu" | "trouve">(getInitialStatus);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeFromDB, setCodeFromDB] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.navigate({ to: "/dashboard" });
    return null;
  }

  const generateCode = () => {
    const now = new Date();
    const datePart = [now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((part) => String(part).padStart(2, "0"))
      .join("");
    return `${datePart}${status === "perdu" ? "P" : "T"}`;
  };

  const checkPhone = async () => {
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro WhatsApp");
      return;
    }

    const formattedPhone = formatPhoneForSupabase(phone);
    if (!isValidPhone(formattedPhone)) {
      toast.error("Numéro invalide. Format : +225XXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("auth_code, status, id, phone")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setIsNewUser(false);
        setCodeFromDB(data.auth_code ?? "");
        toast.info("Bienvenue ! Entrez votre code");
      } else {
        const newCode = generateCode();
        setIsNewUser(true);
        setGeneratedCode(newCode);
        setEnteredCode(newCode);
        toast.info("Nouveau citoyen ! Votre code a été généré");
      }
      setStep("code");
    } catch (error) {
      console.error("Erreur Supabase:", error);
      toast.error("Erreur de vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (isNewUser && enteredCode !== generatedCode) {
      toast.error("Code incorrect");
      return;
    }

    if (!isNewUser && enteredCode !== codeFromDB) {
      toast.error("Code incorrect");
      return;
    }

    const formattedPhone = formatPhoneForSupabase(phone);
    if (!isValidPhone(formattedPhone)) {
      toast.error("Numéro invalide. Format : +225XXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      if (isNewUser) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            phone: formattedPhone,
            status,
            citizen_code: generatedCode,
            auth_code: enteredCode,
          });

        if (insertError) {
          console.error("Erreur de création du profil:", insertError);
          if (insertError?.code === "23505") {
            toast.error("Ce numéro est déjà enregistré");
          } else {
            toast.error("Erreur lors de la création du compte");
          }
          return;
        }
        toast.success("Compte créé avec succès");
      } else {
        toast.success("Connexion réussie");
      }

      sessionStorage.setItem("user_phone", formattedPhone);
      sessionStorage.setItem("user_status", status);
      router.navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Erreur de connexion:", error);
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
            <p className="text-sm text-muted-foreground">
              Mode sélectionné : {status === "perdu" ? "📄 J'ai perdu" : "📄 J'ai trouvé"}
            </p>
            <PhoneInput value={phone} onChange={setPhone} defaultCountry="CI" />
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
                <p className="text-sm text-muted-foreground">
                  Notez ce code pour vos prochaines connexions.
                </p>
                <p className="rounded-lg bg-primary/10 p-4 text-center font-mono text-2xl font-bold text-primary">
                  {generatedCode}
                </p>
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

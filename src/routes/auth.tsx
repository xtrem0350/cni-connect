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
      // Email technique dérivé du numéro WhatsApp (Phone signups désactivé)
      const email = `${formattedPhone.replace("+", "")}@cni-connect.ci`;
      const password = isNewUser ? generatedCode : codeFromDB;

      if (isNewUser) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: formattedPhone,
              status,
              citizen_code: generatedCode,
            },
          },
        });

        if (signUpError) {
          console.error("SignUp error:", signUpError);
          if (signUpError.message.toLowerCase().includes("already registered")) {
            toast.error("Ce numéro est déjà enregistré");
          } else {
            toast.error(signUpError.message);
          }
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.error("SignIn error:", signInError);
          toast.error("Compte créé. Confirmation email requise : désactivez-la dans Supabase.");
          return;
        }

        toast.success("Compte créé avec succès");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.error("SignIn error:", signInError);
          toast.error("Erreur de connexion");
          return;
        }

        toast.success("Connexion réussie");
      }

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

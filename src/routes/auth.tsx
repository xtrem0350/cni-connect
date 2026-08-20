import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+225");
  const [nom, setNom] = useState("");
  const [status, setStatus] = useState<"perdu" | "trouve">(getInitialStatus);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeFromDB, setCodeFromDB] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) void router.navigate({ to: "/dashboard" });
  }, [router, user]);

  if (user) return null;

  const generateCode = () => {
    const now = new Date();
    const datePart = [now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((part) => String(part).padStart(2, "0"))
      .join("");
    return `${datePart}${status === "perdu" ? "P" : "T"}`;
  };

  const checkPhone = async () => {
    console.log("🚀 [auth] checkPhone DEBUT");
    console.log("📞 [auth] phone saisi brut:", phone);
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro WhatsApp");
      return;
    }

    const formattedPhone = formatPhoneForSupabase(phone);
    console.log("📞 [auth] phone formaté:", formattedPhone);
    if (!isValidPhone(formattedPhone)) {
      toast.error("Numéro invalide. Format : +225XXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      console.log("📡 [auth] Vérification existence dans profiles...");
      const { data, error } = await supabase
        .from("profiles")
        .select("auth_code, status, id, phone")
        .eq("phone", formattedPhone)
        .maybeSingle();

      console.log("📦 [auth] Résultat vérification:", { data, error });

      if (error) {
        console.error("❌ [auth] ERREUR SUPABASE:", error);
        toast.error("Erreur de vérification");
        return;
      }

      if (data) {
        console.log("✅ [auth] Citoyen EXISTANT, status:", data.status);
        console.log("🔑 [auth] auth_code existant:", data.auth_code);
        setIsNewUser(false);
        if (data.status !== status) {
          console.log("🔄 [auth] Changement de statut:", data.status, "→", status);
          const newCode = generateCode();
          console.log("🔑 [auth] Nouveau code généré:", newCode);
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ status, auth_code: newCode, citizen_code: newCode })
            .eq("phone", formattedPhone);
          if (updateError) throw updateError;
          setCodeFromDB(newCode);
          setEnteredCode(newCode);
          console.log("📝 [auth] Nouveau code pré-rempli:", newCode);
        } else {
          console.log("✅ [auth] Même statut, code existant:", data.auth_code);
          setCodeFromDB(data.auth_code ?? "");
          setEnteredCode(data.auth_code ?? "");
          console.log("📝 [auth] Code pré-rempli:", data.auth_code);
        }
        toast.info("Bienvenue ! Entrez votre code");
      } else {
        console.log("🆕 [auth] Nouveau citoyen");
        const newCode = generateCode();
        console.log("🔑 [auth] Code généré:", newCode);
        setIsNewUser(true);
        setGeneratedCode(newCode);
        setEnteredCode(newCode);
        toast.info("Nouveau citoyen ! Votre code a été généré");
      }
      setStep("code");
      console.log("🔄 [auth] Passage à l'étape code");
    } catch (error) {
      console.error("❌ [auth] ERREUR:", error);
      toast.error("Erreur de vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    console.log("🚀 [auth] handleConnect DEBUT");
    console.log("📞 [auth] phone:", phone);
    console.log("🔑 [auth] enteredCode:", enteredCode);
    console.log("👤 [auth] isNewUser:", isNewUser);
    console.log("📋 [auth] status:", status);
    if (isNewUser && enteredCode !== generatedCode) {
      toast.error("Code incorrect");
      return;
    }

    if (!isNewUser && enteredCode !== codeFromDB) {
      toast.error("Code incorrect");
      return;
    }

    const formattedPhone = formatPhoneForSupabase(phone);
    console.log("📞 [auth] phone formaté:", formattedPhone);
    if (!isValidPhone(formattedPhone)) {
      toast.error("Numéro invalide. Format : +225XXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      if (isNewUser) {
        console.log("📝 [auth] Création nouveau profil...");
        const profilePayload = {
          phone: formattedPhone,
          nom: nom.trim() || null,
          telephone: formattedPhone,
          status,
          citizen_code: generatedCode,
          auth_code: enteredCode,
        };
        let { error: insertError } = await supabase.from("profiles").insert(profilePayload);

        if (insertError?.code === "PGRST204") {
          console.warn(
            "⚠️ [auth] Colonnes nom/telephone absentes, nouvelle tentative avec le schéma historique",
          );
          const fallbackInsert = await supabase.from("profiles").insert({
            phone: formattedPhone,
            status,
            citizen_code: generatedCode,
            auth_code: enteredCode,
          });
          insertError = fallbackInsert.error;
        }

        if (insertError) {
          console.error("❌ [auth] ERREUR INSERT:", insertError);
          if (insertError?.code === "23505") {
            toast.error("Ce numéro est déjà enregistré");
          } else {
            toast.error("Erreur lors de la création du compte");
          }
          return;
        }
        console.log("✅ [auth] Profil créé avec succès");
        toast.success("Compte créé avec succès");
      } else {
        console.log("✅ [auth] Citoyen existant, connexion directe");
        toast.success("Connexion réussie");
      }

      console.log("💾 [auth] Sauvegarde sessionStorage...");
      sessionStorage.setItem("user_phone", formattedPhone);
      sessionStorage.setItem("user_status", status);
      console.log("✅ [auth] Session sauvegardée");
      console.log("🔄 [auth] Actualisation du profil avant navigation");
      await refreshProfile();
      console.log("🔄 [auth] Redirection vers /dashboard");
      await router.navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("❌ [auth] Erreur:", error);
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
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom (optionnel)</Label>
                  <Input
                    id="nom"
                    placeholder="Votre nom complet"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                  />
                </div>
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

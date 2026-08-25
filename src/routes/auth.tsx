import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneInput } from "@/components/PhoneInput";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";
import { formatPhoneForSupabase, isValidPhone } from "@/utils/phone";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const getInitialStatus = (): "vault" | "perdu" | "trouve" => {
  if (typeof window === "undefined") return "vault";
  const value = new URLSearchParams(window.location.search).get("status");
  if (value === "trouve" || value === "perdu") return value;
  return "vault";
};

function AuthPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+225");
  const [nom, setNom] = useState("");
  const [status, setStatus] = useState<"vault" | "perdu" | "trouve">(getInitialStatus);
  const [inscriptionType, setInscriptionType] = useState<"vault" | "perdu" | "trouve">(
    getInitialStatus(),
  );
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeFromDB, setCodeFromDB] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) void router.navigate({ to: "/dashboard" });
  }, [router, user]);

  if (user) return null;

  useEffect(() => {
    setStatus(inscriptionType);
  }, [inscriptionType]);

  const generateCode = () => {
    const now = new Date();
    const datePart = [now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((part) => String(part).padStart(2, "0"))
      .join("");
    const suffix = status === "perdu" ? "P" : status === "trouve" ? "T" : "V";
    return `${datePart}${suffix}`;
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
        .select("auth_code, auth_code_perdu, auth_code_trouve, status, id, phone")
        .eq("phone", formattedPhone)
        .maybeSingle();

      console.log("📦 [auth] Résultat vérification:", { data, error });

      if (error) {
        console.error("❌ [auth] ERREUR SUPABASE:", error);
        toast.error("Erreur de vérification");
        return;
      }

      if (data) {
        const existingProfile: {
          status?: "vault" | "perdu" | "trouve" | null;
          auth_code?: string | null;
          auth_code_perdu?: string | null;
          auth_code_trouve?: string | null;
          id?: string;
          phone?: string | null;
        } = data as {
          status?: "vault" | "perdu" | "trouve" | null;
          auth_code?: string | null;
          auth_code_perdu?: string | null;
          auth_code_trouve?: string | null;
          id?: string;
          phone?: string | null;
        };

        console.log("✅ [auth] Citoyen EXISTANT, status:", existingProfile.status);
        const selectedCode =
          status === "perdu"
            ? existingProfile.auth_code_perdu ?? existingProfile.auth_code ?? ""
            : status === "trouve"
              ? existingProfile.auth_code_trouve ?? existingProfile.auth_code ?? ""
              : existingProfile.auth_code ?? "";
        setIsNewUser(false);

        if (selectedCode) {
          console.log("✅ [auth] Code existant pour ce statut:", selectedCode);
          setCodeFromDB(selectedCode);
          setEnteredCode(selectedCode);
        } else {
          console.log("🔄 [auth] Aucun code pour ce statut, génération d'un nouveau code");
          const newCode = generateCode();
          const updatePayload: {
            status: "vault" | "perdu" | "trouve";
            citizen_code: string;
            auth_code_perdu?: string;
            auth_code_trouve?: string;
            auth_code?: string;
          } = { status, citizen_code: newCode };
          if (status === "perdu") updatePayload.auth_code_perdu = newCode;
          else if (status === "trouve") updatePayload.auth_code_trouve = newCode;
          else updatePayload.auth_code = newCode;

          const { error: updateError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("phone", formattedPhone);
          if (updateError) throw updateError;
          setCodeFromDB(newCode);
          setEnteredCode(newCode);
          console.log("📝 [auth] Nouveau code pré-rempli:", newCode);
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
        const profilePayload: {
          phone: string;
          nom?: string | null;
          telephone: string;
          status: "vault" | "perdu" | "trouve";
          citizen_code: string;
          auth_code_perdu?: string;
          auth_code_trouve?: string;
          auth_code?: string;
        } = {
          phone: formattedPhone,
          nom: nom.trim() || null,
          telephone: formattedPhone,
          status,
          citizen_code: generatedCode,
        };

        if (status === "perdu") {
          profilePayload.auth_code_perdu = enteredCode;
        } else if (status === "trouve") {
          profilePayload.auth_code_trouve = enteredCode;
        } else {
          profilePayload.auth_code = enteredCode;
        }

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
            <div className="space-y-3">
              <Label>Que souhaitez-vous faire ?</Label>
              <RadioGroup value={inscriptionType} onValueChange={(value) => setInscriptionType(value as "vault" | "perdu" | "trouve")}>
                <div className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value="vault" id="vault" />
                  <Label htmlFor="vault" className="cursor-pointer font-normal">
                    <span className="mr-2 text-xl">🔒</span>
                    Créer mon coffre fort
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value="perdu" id="perdu" />
                  <Label htmlFor="perdu" className="cursor-pointer font-normal">
                    <span className="mr-2 text-xl">😔</span>
                    Déclarer une perte
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value="trouve" id="trouve" />
                  <Label htmlFor="trouve" className="cursor-pointer font-normal">
                    <span className="mr-2 text-xl">😊</span>
                    Déclarer une trouvaille
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <p className="text-sm text-muted-foreground">
              Mode sélectionné : {status === "vault" ? "🔒 Coffre fort" : status === "perdu" ? "📄 J'ai perdu" : "📄 J'ai trouvé"}
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

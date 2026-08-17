import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import telImage from "@/assets/images/tel.jpg";
import { AppShell } from "@/components/AppShell";
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

function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"perdu" | "trouve">(getInitialStatus);
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.navigate({ to: "/dashboard" });
    return null;
  }

  const generateCode = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const st = status === "perdu" ? "P" : "T";
    return `${d}${h}${m}${s}${st}`;
  };

  const handleReceiveCode = () => {
    if (!phone.trim()) {
      toast.error("Entrez votre numéro WhatsApp");
      return;
    }

    const code = generateCode();
    setGeneratedCode(code);
    sessionStorage.setItem("auth_code", code);
    sessionStorage.setItem("auth_phone", phone);
    sessionStorage.setItem("auth_status", status);
    setStep("code");
    toast.success(`Code: ${code}`);
  };

  const handleVerifyCode = async () => {
    if (enteredCode !== generatedCode) {
      toast.error("Code incorrect");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("profiles")
          .update({ status, auth_code: enteredCode })
          .eq("id", existing.id);
      } else {
        await supabase.from("profiles").insert({ phone, status, auth_code: enteredCode });
      }

      toast.success("Connexion réussie");
      sessionStorage.clear();
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <AppShell>
        <div className="mx-auto max-w-md p-4">
          <img src={telImage} alt="Vérification par téléphone" className="mb-4 h-36 w-full rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold">Votre code</h1>
          <p className="text-sm text-muted-foreground">Notez ce code pour vos prochaines connexions</p>
          <div className="mt-6 rounded-lg border-2 border-primary/20 bg-primary/10 p-6 text-center">
            <div className="relative">
              <p className="font-mono text-5xl font-bold tracking-widest text-primary">{generatedCode}</p>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0"
                onClick={() => {
                  if (!generatedCode) return;
                  void navigator.clipboard.writeText(generatedCode);
                  toast.success("Code copié !");
                }}
              >
                📋 Copier
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Format: JJHHMMSS + P/T</p>
          <Input
            className="mt-4"
            placeholder="Saisir le code"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
            maxLength={9}
          />
          <Button className="mt-4 w-full" onClick={handleVerifyCode} disabled={loading}>
            {loading ? "Vérification..." : "✅ Vérifier"}
          </Button>
          <Button variant="outline" className="mt-2 w-full" onClick={() => setStep("phone")}>
            Retour
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md p-4">
        <img src={telImage} alt="Connexion par téléphone" className="mb-4 h-36 w-full rounded-2xl object-cover" />
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-sm text-muted-foreground">Entrez votre numéro WhatsApp</p>
        <Input
          className="mt-4"
          placeholder="+225 01 23 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
          Mode sélectionné : {status === "perdu" ? "📄 J'ai perdu un document" : "📄 J'ai trouvé un document"}
        </p>
        <Button className="mt-6 w-full" onClick={handleReceiveCode}>
          📨 Recevoir mon code
        </Button>
      </div>
    </AppShell>
  );
}


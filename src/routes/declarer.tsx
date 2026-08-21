import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { createDeclaration, updateDeclaration } from "@/services/declarationService";
import { supabase } from "@/integrations/supabase";
import { hashNumero } from "@/lib/documents";

export const Route = createFileRoute("/declarer")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { type?: "perdu" | "trouve"; id?: string } => ({
    ...(search["type"] === "trouve" || search["type"] === "perdu"
      ? { type: search["type"] as "perdu" | "trouve" }
      : {}),
    ...(typeof search["id"] === "string" ? { id: search["id"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Déclarer un document — Retrouve CNI 2026" },
      { name: "description", content: "Déclarez un document perdu ou trouvé en quelques étapes." },
    ],
  }),
  component: DeclarerPage,
});

const minBirthDate = `${new Date().getFullYear() - 80}-01-01`;
const maxBirthDate = "2026-12-31";

function DeclarerPage() {
  const navigate = useNavigate();
  const { userId, userProfile } = useAuth();
  const [type, setType] = useState<"perdu" | "trouve">("perdu");
  const [documentType, setDocumentType] = useState("CNI");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    dateNaissance: "",
    lieuNaissance: "",
    dateDelivrance: "",
    typeDocument: "CNI",
    numeroPiece: "",
    nom: "",
    prenom: "",
    communePerte: "",
  });

  const formatDateForSupabase = (value: string) => {
    if (!value) return null;
    const cleaned = value.trim();

    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (
        date.getUTCFullYear() === Number(year) &&
        date.getUTCMonth() === Number(month) - 1 &&
        date.getUTCDate() === Number(day)
      ) {
        return `${year}-${month}-${day}`;
      }
      return null;
    }

    const frMatch = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (frMatch) {
      const [, day, month, year] = frMatch;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (
        date.getUTCFullYear() === Number(year) &&
        date.getUTCMonth() === Number(month) - 1 &&
        date.getUTCDate() === Number(day)
      ) {
        return `${year}-${month}-${day}`;
      }
      return null;
    }

    return null;
  };

  const formatDateForInput = (value: string | null | undefined) => {
    if (!value) return "";
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
    const frMatch = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (frMatch) {
      const [, day, month, year] = frMatch;
      return `${day}/${month}/${year}`;
    }
    return value;
  };

  const sanitizeDateInput = (value: string) => value.replace(/[^0-9/]/g, "");

  useEffect(() => {
    if (!userId) return;

    const params = new URLSearchParams(window.location.search);
    const requestedType = params.get("type");
    if (requestedType === "perdu" || requestedType === "trouve") {
      setType(requestedType);
    } else {
      setType((userProfile?.status as "perdu" | "trouve" | null) ?? "perdu");
    }
    const declarationId = params.get("id");
    if (!declarationId) {
      return;
    }

    void (async () => {
      const { data } = await supabase
        .from("declarations")
        .select("*")
        .eq("id", declarationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!data) return;

      const legacyNomPorteur = typeof data.nom_porteur === "string" ? data.nom_porteur : "";
      const legacyParts = legacyNomPorteur.trim().split(/\s+/).filter(Boolean);

      setEditingId(declarationId);
      setType((data.type as "perdu" | "trouve") ?? "perdu");
      setDocumentType((data.type_document as string) ?? "CNI");
      setForm({
        dateNaissance: formatDateForInput(data.date_naissance),
        lieuNaissance: data.lieu_naissance ?? "",
        dateDelivrance: formatDateForInput(data.date_delivrance),
        typeDocument: (data.type_document as string) ?? "CNI",
        numeroPiece: "",
        nom: (data.nom as string | null) ?? (legacyParts.length > 1 ? legacyParts.slice(0, -1).join(" ") : legacyParts[0] ?? "") ?? "",
        prenom: (data.prenom as string | null) ?? (legacyParts.length > 1 ? legacyParts[legacyParts.length - 1] : "") ?? "",
        communePerte: data.lieu_perte_trouvaille ?? "",
      });
    })();
  }, [userId, userProfile]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const isFormValid =
    form.nom.trim() !== "" &&
    form.prenom.trim() !== "" &&
    form.dateNaissance.trim() !== "" &&
    form.lieuNaissance.trim() !== "" &&
    form.dateDelivrance.trim() !== "" &&
    documentType.trim() !== "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    if (
      !form.dateNaissance ||
      !form.lieuNaissance ||
      !form.dateDelivrance ||
      !form.typeDocument ||
      !form.nom.trim() ||
      !form.prenom.trim()
    ) {
      toast.error("Veuillez compléter tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const dateNaissance = formatDateForSupabase(form.dateNaissance);
      const dateDelivrance = formatDateForSupabase(form.dateDelivrance);

      if (!dateNaissance || !dateDelivrance) {
        toast.error("Les dates doivent être au format JJ/MM/AAAA");
        return;
      }

      const numeroHash = form.numeroPiece.trim() ? await hashNumero(form.numeroPiece) : null;
      const payload: Record<string, unknown> = {
        user_id: userId,
        type,
        type_document: documentType,
        numero_hash: numeroHash,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        date_naissance: dateNaissance,
        lieu_naissance: form.lieuNaissance,
        date_delivrance: dateDelivrance,
        lieu_perte_trouvaille: form.communePerte || null,
        statut: "actif",
      };

      if (editingId) {
        const { error } = await updateDeclaration(editingId, payload);
        if (error) {
          if (error.message.includes("nom") || error.message.includes("prenom")) {
            toast.error("Le schéma Supabase n'est pas à jour. Exécutez la migration des déclarations.");
            console.error("[declarer] schéma obsolète pour les colonnes nom/prenom", error);
            return;
          }
          throw error;
        }
      } else {
        const { error } = await createDeclaration(payload);

        if (error) {
          if (error.message.includes("nom") || error.message.includes("prenom")) {
            toast.error("Le schéma Supabase n'est pas à jour. Exécutez la migration des déclarations.");
            console.error("[declarer] schéma obsolète pour les colonnes nom/prenom", error);
            return;
          }

          if (error?.code === "PGRST204" && error.message.includes("lieu_perte_trouvaille")) {
            console.warn(
              "⚠️ [declarer] Colonne lieu_perte_trouvaille absente, nouvelle tentative sans cette colonne",
            );
            const fallbackPayload: Record<string, unknown> = { ...payload };
            delete fallbackPayload.lieu_perte_trouvaille;
            const fallback = await createDeclaration(fallbackPayload);
            if (fallback.error) throw fallback.error;
            return;
          }

          throw error;
        }
      }

      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.error("Impossible d'enregistrer la déclaration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <HeroBanner
          imageUrl="https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1400&q=80"
          title="Déclarer un document"
        />

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Plus vous remplissez de champs, plus vite vous trouverez votre document !
        </div>

        <form onSubmit={handleSubmit} className="surface-card mt-0 space-y-5 p-5">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Type de document</Label>
            <RadioGroup value={documentType} onValueChange={setDocumentType} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="cni" value="CNI" />
                <Label htmlFor="cni">CNI</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="passeport" value="Passeport" />
                <Label htmlFor="passeport">Passeport</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Type de déclaration :{" "}
            <span className="font-semibold text-foreground">
              {type === "perdu" ? "Document perdu" : "Document trouvé"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birth-date">Date de naissance * (JJ/MM/AAAA)</Label>
              <Input
                id="birth-date"
                type="text"
                inputMode="numeric"
                placeholder="01/01/1990"
                value={form.dateNaissance}
                onChange={(event) => handleChange("dateNaissance", sanitizeDateInput(event.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth-place">Lieu de naissance *</Label>
              <Input
                id="birth-place"
                placeholder="Abidjan"
                value={form.lieuNaissance}
                onChange={(event) => handleChange("lieuNaissance", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="issue-date">Date de délivrance * (JJ/MM/AAAA)</Label>
              <Input
                id="issue-date"
                type="text"
                inputMode="numeric"
                placeholder="15/06/2020"
                value={form.dateDelivrance}
                onChange={(event) => handleChange("dateDelivrance", sanitizeDateInput(event.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="document-type">Type de pièce *</Label>
              <Input
                id="document-type"
                value={form.typeDocument}
                onChange={(event) => handleChange("typeDocument", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="document-number">Numéro de pièce (optionnel)</Label>
              <Input
                id="document-number"
                placeholder="Numéro du document"
                value={form.numeroPiece}
                onChange={(event) => handleChange("numeroPiece", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Nom du titulaire"
                value={form.nom}
                onChange={(event) => handleChange("nom", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstname">Prénom *</Label>
              <Input
                id="firstname"
                placeholder="Prénom"
                value={form.prenom}
                onChange={(event) => handleChange("prenom", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lost-area">Commune de perte</Label>
              <Input
                id="lost-area"
                placeholder="Yopougon"
                value={form.communePerte}
                onChange={(event) => handleChange("communePerte", event.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !userId || !isFormValid}>
            {loading ? "Déclaration en cours..." : editingId ? "Mettre à jour" : "Déclarer"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

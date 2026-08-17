import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { createDeclaration, updateDeclaration } from "@/services/declarationService";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/declarer")({
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
  const { user, userProfile } = useAuth();
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

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const declarationId = params.get("id");
    if (!declarationId) {
      setType((userProfile?.status as "perdu" | "trouve" | null) ?? "perdu");
      return;
    }

    void (async () => {
      const { data } = await supabase
        .from("declarations")
        .select("*")
        .eq("id", declarationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) return;

      setEditingId(declarationId);
      setType((data.type as "perdu" | "trouve") ?? "perdu");
      setDocumentType((data.type_document as string) ?? "CNI");
      setForm({
        dateNaissance: data.date_naissance ?? "",
        lieuNaissance: data.lieu_naissance ?? "",
        dateDelivrance: data.date_delivrance ?? "",
        typeDocument: (data.type_document as string) ?? "CNI",
        numeroPiece: "",
        nom: data.nom_porteur ?? "",
        prenom: "",
        communePerte: data.lieu_perte_trouvaille ?? "",
      });
    })();
  }, [user, userProfile]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!form.dateNaissance || !form.lieuNaissance || !form.dateDelivrance || !form.typeDocument) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: user.id,
        type,
        type_document: form.typeDocument,
        numero_hash: form.numeroPiece || "",
        nom_porteur: form.nom || form.prenom || null,
        date_naissance: form.dateNaissance,
        lieu_naissance: form.lieuNaissance,
        date_delivrance: form.dateDelivrance,
        lieu_perte_trouvaille: form.communePerte || null,
        statut: "actif",
      };

      if (editingId) {
        await updateDeclaration(editingId, payload);
      } else {
        await createDeclaration(payload);
      }

      navigate({ to: "/dashboard" });
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

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Je déclare que le document est</Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as "perdu" | "trouve")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="perdu" value="perdu" />
                <Label htmlFor="perdu">Perdu</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="trouve" value="trouve" />
                <Label htmlFor="trouve">Trouvé</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birth-date">Date de naissance *</Label>
              <Input
                id="birth-date"
                type="date"
                value={form.dateNaissance}
                onChange={(event) => handleChange("dateNaissance", event.target.value)}
                min={minBirthDate}
                max={maxBirthDate}
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
              <Label htmlFor="issue-date">Date de délivrance *</Label>
              <Input
                id="issue-date"
                type="date"
                value={form.dateDelivrance}
                onChange={(event) => handleChange("dateDelivrance", event.target.value)}
                min={minBirthDate}
                max={maxBirthDate}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="document-type">Type de document *</Label>
              <Input id="document-type" value={form.typeDocument} onChange={(event) => handleChange("typeDocument", event.target.value)} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="document-number">Numéro de pièce</Label>
              <Input
                id="document-number"
                placeholder="Numéro du document"
                value={form.numeroPiece}
                onChange={(event) => handleChange("numeroPiece", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="Nom du titulaire" value={form.nom} onChange={(event) => handleChange("nom", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstname">Prénom</Label>
              <Input id="firstname" placeholder="Prénom" value={form.prenom} onChange={(event) => handleChange("prenom", event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lost-area">Commune de perte</Label>
              <Input id="lost-area" placeholder="Yopougon" value={form.communePerte} onChange={(event) => handleChange("communePerte", event.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !user}>
            {loading ? "Déclaration en cours..." : editingId ? "Mettre à jour" : "Déclarer"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

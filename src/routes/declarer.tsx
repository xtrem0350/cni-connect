import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon3D } from "@/components/Icon3D";
import { ImageBanner } from "@/components/ImageBanner";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { createDeclaration, updateDeclaration } from "@/services/declarationService";
import { getDocumentForDeclaration, type VaultDocument } from "@/services/vaultService";
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [vaultDocument, setVaultDocument] = useState<VaultDocument | null>(null);
  const [useVaultDocument, setUseVaultDocument] = useState(false);
  const [form, setForm] = useState({
    dateNaissance: "",
    dateDelivrance: "",
    lieuNaissance: "",
    periodeDebut: "",
    periodeFin: "",
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

    const frMatch = cleaned.match(new RegExp("^(\\d{2})[/-](\\d{2})[/-](\\d{4})$"));
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
    const frMatch = value.match(new RegExp("^(\\d{2})[/-](\\d{2})[/-](\\d{4})$"));
    if (frMatch) {
      const [, day, month, year] = frMatch;
      return `${day}/${month}/${year}`;
    }
    return value;
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    return [day, month, year].filter(Boolean).join("/");
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview("");
    setPhotoPath(null);
  };

  const uploadPhoto = async (file: File, currentUserId: string) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `declarations/${currentUserId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("documents").upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return filePath;
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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
        dateDelivrance:
          data.type === "trouve" ? formatDateForInput(data.date_delivrance) : "",
        lieuNaissance: data.lieu_naissance ?? "",
        periodeDebut: (data.periode_debut as string | null) ?? data.date_delivrance?.slice(0, 4) ?? "",
        periodeFin: (data.periode_fin as string | null) ?? data.date_delivrance?.slice(0, 4) ?? "",
        typeDocument: (data.type_document as string) ?? "CNI",
        numeroPiece: "",
        nom:
          (data.nom as string | null) ??
          (legacyParts.length > 1 ? legacyParts.slice(0, -1).join(" ") : (legacyParts[0] ?? "")) ??
          "",
        prenom:
          (data.prenom as string | null) ??
          (legacyParts.length > 1 ? legacyParts[legacyParts.length - 1] : "") ??
          "",
        communePerte: data.lieu_perte_trouvaille ?? "",
      });
      const existingPhotoPath = typeof data.photo_url === "string" ? data.photo_url : "";
      setPhotoPath(existingPhotoPath || null);
      if (existingPhotoPath) {
        const { data: signedPhoto } = await supabase.storage
          .from("documents")
          .createSignedUrl(existingPhotoPath, 300);
        if (signedPhoto?.signedUrl) setPhotoPreview(signedPhoto.signedUrl);
      }
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
    documentType.trim() !== "" &&
    (type === "perdu"
      ? form.periodeDebut.trim() !== "" &&
        form.periodeFin.trim() !== "" &&
        Number(form.periodeFin) >= Number(form.periodeDebut)
      : Boolean(form.dateDelivrance.trim() && (photo || photoPath || photoPreview)));

  useEffect(() => {
    if (type !== "perdu" || !userId) return;

    const checkVault = async () => {
      try {
        const doc = await getDocumentForDeclaration(userId, documentType || form.typeDocument);
        if (doc) {
          setVaultDocument(doc);
          setUseVaultDocument(false);
        }
      } catch (error) {
        console.error("Erreur vérification coffre:", error);
      }
    };

    void checkVault();
  }, [userId, type, documentType, form.typeDocument]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    if (
      !form.dateNaissance ||
      !form.lieuNaissance ||
      !form.typeDocument ||
      !form.nom.trim() ||
      !form.prenom.trim() ||
      (type === "perdu" && (!form.periodeDebut || !form.periodeFin)) ||
      (type === "trouve" && (!form.dateDelivrance || (!photo && !photoPath)))
    ) {
      toast.error("Veuillez compléter tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const dateNaissance = formatDateForSupabase(form.dateNaissance);
      const periodeDebut = Number(form.periodeDebut);
      const periodeFin = Number(form.periodeFin);
      const dateDelivrance =
        type === "trouve" ? formatDateForSupabase(form.dateDelivrance) : null;

      console.log("[declarer] Dates de déclaration", {
        naissanceBrute: form.dateNaissance,
        naissanceFormatee: dateNaissance,
        periodeDebut: form.periodeDebut,
        periodeFin: form.periodeFin,
      });

      if (
        !dateNaissance ||
        (type === "perdu" &&
          (!Number.isInteger(periodeDebut) ||
            !Number.isInteger(periodeFin) ||
            periodeDebut < new Date().getFullYear() - 30 ||
            periodeFin > new Date().getFullYear() ||
            periodeFin < periodeDebut)) ||
        (type === "trouve" && !dateDelivrance)
      ) {
        toast.error(
          type === "trouve"
            ? "Veuillez saisir une date de délivrance valide (JJ/MM/AAAA)"
            : "Veuillez sélectionner une période de délivrance valide",
        );
        return;
      }

      const numeroHash = form.numeroPiece.trim() ? await hashNumero(form.numeroPiece) : null;
      const uploadedPhotoPath = photo ? await uploadPhoto(photo, userId) : photoPath;
      const payload: Record<string, unknown> = {
        user_id: userId,
        type,
        type_document: documentType,
        numero_hash: numeroHash,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        date_naissance: dateNaissance,
        lieu_naissance: form.lieuNaissance,
        date_delivrance: type === "trouve" ? dateDelivrance : `${periodeDebut}-01-01`,
        periode_debut: type === "perdu" ? String(periodeDebut) : null,
        periode_fin: type === "perdu" ? String(periodeFin) : null,
        lieu_perte_trouvaille: form.communePerte || null,
        photo_url: uploadedPhotoPath,
        vault_document_id: type === "perdu" && useVaultDocument ? vaultDocument?.id ?? null : null,
        statut: "actif",
      };

      if (editingId) {
        const { error } = await updateDeclaration(editingId, payload);
        if (error) {
          if (error.message.includes("nom") || error.message.includes("prenom")) {
            toast.error(
              "Le schéma Supabase n'est pas à jour. Exécutez la migration des déclarations.",
            );
            console.error("[declarer] schéma obsolète pour les colonnes nom/prenom", error);
            return;
          }
          throw error;
        }
      } else {
        const { error } = await createDeclaration(payload);

        if (error) {
          if (error.message.includes("nom") || error.message.includes("prenom")) {
            toast.error(
              "Le schéma Supabase n'est pas à jour. Exécutez la migration des déclarations.",
            );
            console.error("[declarer] schéma obsolète pour les colonnes nom/prenom", error);
            return;
          }

          if (error?.code === "PGRST204" && error.message.includes("lieu_perte_trouvaille")) {
            console.warn(
              "⚠️ [declarer] Colonne lieu_perte_trouvaille absente, nouvelle tentative sans cette colonne",
            );
            const fallbackPayload: Record<string, unknown> = { ...payload };
            delete fallbackPayload["lieu_perte_trouvaille"];
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
        <ImageBanner src={IMAGES.declaration} alt="Documents administratifs" overlayOpacity={60}>
          <div className="flex items-center gap-3">
            <Icon3D
              src="https://cdn-icons-png.flaticon.com/512/870/870091.png"
              alt="Document"
              size="lg"
              className="drop-shadow-[0_8px_20px_rgba(96,165,250,0.35)]"
            />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Déclarer un document</h1>
              <p className="text-sm opacity-90">Perdu ou trouvé, en quelques étapes</p>
            </div>
          </div>
        </ImageBanner>

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
                onChange={(event) =>
                  handleChange("dateNaissance", formatDateInput(event.target.value))
                }
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

          {type === "perdu" && vaultDocument ? (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/599/599683.png"
                  alt="Coffre"
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Document trouvé dans votre coffre</p>
                  <p className="text-sm text-muted-foreground">{vaultDocument.document_name}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseVaultDocument(true);
                    setForm((current) => ({ ...current, numeroPiece: current.numeroPiece || vaultDocument.document_name }));
                    setDocumentType(vaultDocument.document_type || documentType);
                    toast.success("Document lié à la déclaration");
                  }}
                >
                  Utiliser
                </Button>
              </div>
            </div>
          ) : null}

          {type === "perdu" && !vaultDocument && (
            <div className="space-y-2">
              <Label htmlFor="lost-document-photo">Photo du document (optionnelle)</Label>
              <div className="rounded-lg border-2 border-dashed p-4 text-center">
                {photoPreview ? (
                  <div className="space-y-3">
                    <img src={photoPreview} alt="Aperçu du document perdu" className="mx-auto max-h-64 rounded-lg object-contain" />
                    <Button type="button" variant="destructive" size="sm" onClick={clearPhoto}>Retirer la photo</Button>
                  </div>
                ) : (
                  <>
                    <Icon3D src="https://cdn-icons-png.flaticon.com/512/5968/5968517.png" alt="Photo" size="lg" className="mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">Ajoutez une photo pour faciliter l'identification</p>
                    <Input id="lost-document-photo" type="file" accept="image/*" onChange={handlePhotoChange} className="mx-auto mt-3 max-w-sm cursor-pointer" />
                  </>
                )}
              </div>
            </div>
          )}

          {type === "perdu" ? (
          <div className="space-y-2">
            <Label>Période de délivrance (estimation) *</Label>
            <p className="text-xs text-muted-foreground">
              Si vous ne connaissez pas la date exacte, indiquez la période estimée.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="issue-year-start" className="text-xs text-muted-foreground">
                  De
                </Label>
                <Select
                  value={form.periodeDebut}
                  onValueChange={(value) => handleChange("periodeDebut", value)}
                >
                  <SelectTrigger id="issue-year-start">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, index) => {
                      const year = new Date().getFullYear() - index;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issue-year-end" className="text-xs text-muted-foreground">
                  À
                </Label>
                <Select
                  value={form.periodeFin}
                  onValueChange={(value) => handleChange("periodeFin", value)}
                >
                  <SelectTrigger id="issue-year-end">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, index) => {
                      const year = new Date().getFullYear() - index;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.periodeDebut &&
              form.periodeFin &&
              Number(form.periodeFin) < Number(form.periodeDebut) && (
                <p className="text-sm text-red-500">
                  L&apos;année de fin doit être postérieure ou égale à l&apos;année de début
                </p>
              )}
          </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="issue-date">Date de délivrance * (JJ/MM/AAAA)</Label>
              <p className="text-xs text-muted-foreground">
                La date est indiquée sur le document trouvé.
              </p>
              <Input
                id="issue-date"
                type="text"
                inputMode="numeric"
                placeholder="15/06/2020"
                value={form.dateDelivrance}
                onChange={(event) =>
                  handleChange("dateDelivrance", formatDateInput(event.target.value))
                }
                required
              />
            </div>
          )}

          {type === "trouve" && (
            <div className="space-y-2">
              <Label htmlFor="document-photo">Photo du document *</Label>
              <p className="text-sm font-medium text-red-600">⚠️ Obligatoire pour déclarer une trouvaille</p>
              <p className="text-xs text-muted-foreground">
                Pour une CNI : prenez le recto et le verso. Pour un passeport : la page des informations.
              </p>
              <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50/30 p-4 text-center">
                {photoPreview ? (
                  <div className="space-y-3">
                    <img
                      src={photoPreview}
                      alt="Aperçu du document trouvé"
                      className="mx-auto max-h-64 rounded-lg object-contain"
                      draggable={false}
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={clearPhoto}>
                      Retirer la photo
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Cliquez ou déposez une photo du document
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">JPG ou PNG, 5 Mo maximum</p>
                    <Input
                      id="document-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="mx-auto mt-3 max-w-sm cursor-pointer"
                      required
                    />
                  </>
                )}
              </div>
              {!photoPreview && <p className="text-xs text-red-500">Une photo est requise pour valider la déclaration.</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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

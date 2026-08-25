import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon3D } from "@/components/Icon3D";
import { ImageBanner } from "@/components/ImageBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { IMAGES } from "@/lib/images";
import {
  createDocumentSignedUrl,
  deleteVaultDocument,
  listVaultDocuments,
  uploadDocument,
  type VaultDocument,
} from "@/services/vaultService";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Coffre numérique — Retrouve CNI 2026" },
      {
        name: "description",
        content:
          "Regroupez vos documents déclarés dans un coffre numérique sécurisé : CNI, passeport et autres pièces.",
      },
      { property: "og:title", content: "Coffre numérique — Retrouve CNI 2026" },
      { property: "og:description", content: "Vos documents en sécurité, à portée de main." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VaultPage,
});

const CATEGORIES = [
  {
    icon: "https://cdn-icons-png.flaticon.com/512/870/870091.png",
    label: "CNI",
    hint: "Carte nationale d'identité",
  },
  {
    icon: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png",
    label: "Passeport",
    hint: "Document de voyage",
  },
  {
    icon: "https://cdn-icons-png.flaticon.com/512/173/173289.png",
    label: "Autres",
    hint: "Permis, attestations…",
  },
] as const;
const CNI_ICON = CATEGORIES[0].icon;
const PASSPORT_ICON = CATEGORIES[1].icon;

function VaultPage() {
  const { userId } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("CNI");
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const refreshDocuments = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setDocuments(await listVaultDocuments(userId));
    } catch (error) {
      console.error("Erreur chargement du coffre:", error);
      toast.error("Impossible de charger votre coffre");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshDocuments();
  }, [userId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo");
      event.target.value = "";
      return;
    }
    setFile(selectedFile);
    if (!documentName) setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !file || !documentName.trim()) {
      toast.error("Sélectionnez un fichier et indiquez son nom");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(userId, file, documentType, documentName, description, [], {
        numero: documentNumber.trim() || undefined,
        date_delivrance: issueDate || undefined,
        date_expiration: expiryDate || undefined,
      });
      toast.success("Document ajouté au coffre");
      setFile(null);
      setDocumentName("");
      setDescription("");
      setDocumentNumber("");
      setIssueDate("");
      setExpiryDate("");
      const input = document.getElementById("vault-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refreshDocuments();
    } catch (error) {
      console.error("Erreur ajout document:", error);
      toast.error("Impossible d'ajouter le document");
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (document: VaultDocument) => {
    try {
      window.open(await createDocumentSignedUrl(document.file_url), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erreur ouverture document:", error);
      toast.error("Impossible d'ouvrir le document");
    }
  };

  const handleDelete = async (document: VaultDocument) => {
    if (!window.confirm(`Supprimer « ${document.document_name} » du coffre ?`)) return;
    try {
      await deleteVaultDocument(document);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      toast.success("Document supprimé");
    } catch (error) {
      console.error("Erreur suppression document:", error);
      toast.error("Impossible de supprimer le document");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ImageBanner src={IMAGES.coffre} alt="Coffre-fort sécurisé" overlayOpacity={65}>
          <div className="flex items-center gap-3">
            <Icon3D
              src="https://cdn-icons-png.flaticon.com/512/599/599683.png"
              alt="Coffre"
              size="lg"
              className="drop-shadow-[0_8px_18px_rgba(59,130,246,0.35)]"
            />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Coffre numérique</h1>
              <p className="text-sm opacity-90">Vos documents en sécurité, jamais en clair.</p>
            </div>
          </div>
        </ImageBanner>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Card>
            <CardHeader><CardTitle>Ajouter un document</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="vault-type">Type</Label>
                    <select id="vault-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="CNI">CNI</option>
                      <option value="Passeport">Passeport</option>
                      <option value="Acte de naissance">Acte de naissance</option>
                      <option value="Autre">Autre document</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vault-name">Nom du document *</Label>
                    <Input id="vault-name" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Ma CNI" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vault-file">Fichier *</Label>
                  <Input id="vault-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange} required />
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG ou WebP, 10 Mo maximum.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="vault-number">Numéro (optionnel)</Label><Input id="vault-number" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} /></div>
                  <div className="space-y-1.5"><Label htmlFor="vault-issue">Date de délivrance</Label><Input id="vault-issue" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="vault-expiry">Date d'expiration</Label><Input id="vault-expiry" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="vault-description">Description</Label><Textarea id="vault-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Informations utiles sur ce document" /></div>
                <Button type="submit" className="w-full" disabled={uploading || !userId}>{uploading ? "Ajout en cours..." : "Ajouter au coffre"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mes documents</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center"><Icon3D src={CNI_ICON} alt="Document" size="lg" className="mx-auto opacity-60" /><p className="mt-3 text-sm text-muted-foreground">Votre coffre est vide.</p></div>
              ) : (
                <div className="space-y-3">{documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Icon3D src={document.document_type === "Passeport" ? PASSPORT_ICON : CNI_ICON} alt={document.document_type} size="md" />
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{document.document_name}</p><p className="text-xs text-muted-foreground">{document.document_type} · {Math.round((document.file_size ?? 0) / 1024)} Ko</p></div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleView(document)}>Voir</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(document)} aria-label={`Supprimer ${document.document_name}`}>Supprimer</Button>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Button asChild variant="outline" className="w-full sm:w-auto"><Link to="/declarer" search={{ type: "perdu" }}>Déclarer un document perdu</Link></Button>
      </div>
    </AppShell>
  );
}

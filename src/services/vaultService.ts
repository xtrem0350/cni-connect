import { supabase } from "@/integrations/supabase";

export type VaultDocument = {
  id: string;
  path: string;
  document_name: string;
  document_type: string;
  content_type?: string;
  size?: number;
  created_at?: string;
};

const normalizeDocumentType = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return "CNI";
  if (normalized.includes("passeport")) return "Passeport";
  if (normalized.includes("cni") || normalized.includes("carte")) return "CNI";
  if (normalized.includes("acte") || normalized.includes("naissance")) return "Acte de naissance";
  return "CNI";
};

export async function listVaultDocuments(userId: string): Promise<VaultDocument[]> {
  const { data, error } = await supabase.storage
    .from("documents")
    .list(`vault/${userId}`, { limit: 100, offset: 0 });

  if (error) {
    if (error.message.toLowerCase().includes("not found") || error.message.toLowerCase().includes("does not exist")) {
      return [];
    }
    throw error;
  }

  return (data ?? [])
    .filter((item) => !item.name.startsWith("."))
    .map((item) => {
      const documentName = item.name ?? "document";
      const documentType = normalizeDocumentType(documentName);

      return {
        id: item.id ?? `${userId}-${documentName}`,
        path: `vault/${userId}/${documentName}`,
        document_name: documentName,
        document_type: documentType,
        content_type: item.metadata?.mimetype ?? "application/octet-stream",
        size: item.metadata?.size ?? 0,
        created_at: item.created_at ?? new Date().toISOString(),
      };
    });
}

export async function getDocumentForDeclaration(userId: string, desiredType: string): Promise<VaultDocument | null> {
  const documents = await listVaultDocuments(userId);
  const wanted = desiredType.trim().toLowerCase();

  if (!documents.length) return null;

  if (!wanted) return documents[0] ?? null;

  return (
    documents.find((document) => {
      const documentType = document.document_type.toLowerCase();
      return documentType.includes(wanted) || document.document_name.toLowerCase().includes(wanted);
    }) ?? documents[0]
  );
}

import { supabase } from "@/integrations/supabase";

export type VaultDocument = {
  id: string;
  user_id: string;
  path: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  tags?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  is_verified?: boolean;
  verified_at?: string | null;
  created_at: string;
  updated_at?: string;
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
  const { data, error } = await supabase
    .from("documents_vault")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VaultDocument[];
}

export async function getDocumentForDeclaration(userId: string, desiredType: string): Promise<VaultDocument | null> {
  const { data, error } = await supabase
    .from("documents_vault")
    .select("*")
    .eq("user_id", userId)
    .eq("document_type", normalizeDocumentType(desiredType))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as VaultDocument | null;
}

export async function uploadDocument(
  userId: string,
  file: File,
  documentType: string,
  documentName: string,
  description = "",
  tags: string[] = [],
  metadata: Record<string, unknown> = {},
): Promise<VaultDocument> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `vault/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents_vault")
    .insert({
      user_id: userId,
      document_type: normalizeDocumentType(documentType),
      document_name: documentName.trim() || file.name,
      file_url: path,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      description: description.trim(),
      tags,
      metadata,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    throw error;
  }

  return data as VaultDocument;
}

export async function createDocumentSignedUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteVaultDocument(document: VaultDocument) {
  const { error: storageError } = await supabase.storage.from("documents").remove([document.file_url]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("documents_vault").delete().eq("id", document.id);
  if (error) throw error;
}

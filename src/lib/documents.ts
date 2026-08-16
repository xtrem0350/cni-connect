export type DeclarationType = "perdu" | "trouve";

export interface Declaration {
  id: string;
  user_id: string;
  type: DeclarationType;
  type_document: string;
  numero_hash: string;
  nom_porteur: string | null;
  date_naissance: string;
  lieu_naissance: string;
  date_delivrance: string;
  lieu_perte_trouvaille: string | null;
  commentaire: string | null;
  statut: string;
  last_matched_at: string | null;
  created_at: string;
}

export interface MatchRow {
  id: string;
  declaration_perdu_id: string;
  declaration_trouve_id: string;
  statut: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
}

export const TYPES_DOCUMENT = [
  "CNI",
  "Passeport",
  "Permis de conduire",
  "Carte consulaire",
  "Carte d'étudiant",
  "Attestation d'identité",
] as const;

/**
 * Hash SHA-256 du numéro de document : seul le hash quitte l'appareil,
 * le numéro en clair n'est jamais transmis ni stocké.
 */
export async function hashNumero(numero: string): Promise<string> {
  const normalise = numero.trim().toUpperCase().replace(/\s+/g, "");
  const data = new TextEncoder().encode(normalise);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

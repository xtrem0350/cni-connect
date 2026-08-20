/**
 * Types de la base de données Supabase
 */

export type DeclarationType = "perdu" | "trouve";

export type Profile = {
  id: string;
  nom?: string | null;
  phone?: string | null;
  telephone?: string | null;
  status?: DeclarationType | null;
  is_admin?: boolean;
  auth_code?: string | null;
  citizen_code?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Declaration = {
  id: string;
  user_id: string;
  type: DeclarationType;
  numero_cni: string; // Numéro haché
  date_naissance: string;
  date_delivrance: string;
  lieu: string;
  description: string;
  statut: "actif" | "matche" | "restitue" | "inactif";
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  declaration_perdu_id: string;
  declaration_trouve_id: string;
  score_match: number;
  status: "propose" | "accepte" | "refuse";
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

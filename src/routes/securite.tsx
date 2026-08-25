import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, Fingerprint, KeyRound, Lock, UserCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { SecurityBadge } from "@/components/SecurityBadge";

export const Route = createFileRoute("/securite")({
  head: () => ({
    meta: [
      { title: "Sécurité des données — Retrouve CNI 2026" },
      {
        name: "description",
        content:
          "Hashage SHA-256 des numéros, code à 4 chiffres, accès restreint aux deux parties : comment nous protégeons vos documents.",
      },
      { property: "og:title", content: "Sécurité — Retrouve CNI 2026" },
      { property: "og:description", content: "Aucun numéro de document stocké en clair." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Securite,
});

const POINTS = [
  {
    icon: Fingerprint,
    titre: "Le numéro est hashé sur votre téléphone",
    texte:
      "Avant l'envoi, le numéro du document est transformé en empreinte SHA-256 irréversible. Personne — pas même nous — ne peut le reconstituer depuis la base.",
  },
  {
    icon: KeyRound,
    titre: "Un code à 4 chiffres avant tout contact",
    texte:
      "Seule la personne qui détient physiquement le document reçoit le code. Le propriétaire doit le saisir : cela prouve que le document est bien entre les mains de la bonne personne avant d'ouvrir la discussion.",
  },
  {
    icon: EyeOff,
    titre: "Vos déclarations ne sont pas publiques",
    texte:
      "Aucune liste publique de documents perdus. Les règles d'accès de la base (RLS) limitent la lecture à votre propre compte.",
  },
  {
    icon: UserCheck,
    titre: "Chat réservé aux deux parties",
    texte:
      "Les messages d'un match ne sont lisibles que par le propriétaire et le détenteur, et uniquement après validation du code.",
  },
];

function Securite() {
  return (
    <AppShell>
      <ImageBanner src={IMAGES.securite} alt="Protection et sécurité des données">
        <h1 className="text-2xl font-bold sm:text-3xl">🛡️ Sécurité</h1>
        <p className="text-sm opacity-90">Comment nous protégeons vos données</p>
      </ImageBanner>
      <SecurityBadge label="Aucun numéro stocké en clair" />
      <div className="mt-4" />
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Un document d'identité est une donnée sensible. Notre principe est simple : collecter le
        minimum, ne jamais rendre un numéro lisible, et n'ouvrir le contact qu'après une preuve.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {POINTS.map((point) => (
          <article key={point.titre} className="surface-card p-5">
            <point.icon className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-3 font-semibold">{point.titre}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{point.texte}</p>
          </article>
        ))}
      </div>

      <div className="surface-card mt-6 flex gap-4 p-5">
        <Lock className="h-6 w-6 shrink-0 text-accent" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Ne partagez jamais de photo complète d'un document dans le chat, et ne payez jamais une
          « caution » à un inconnu. Une demande suspecte&nbsp;? Signalez-la, nous répondons sous 24h.
        </p>
      </div>
    </AppShell>
  );
}

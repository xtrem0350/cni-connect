import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSearch, Lock, MessageSquareLock, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SecurityBadge } from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retrouve CNI 2026 — Retrouvez vos papiers perdus" },
      {
        name: "description",
        content:
          "Déclarez une CNI perdue ou trouvée en Côte d'Ivoire. Rapprochement automatique et chat sécurisé par code à 4 chiffres.",
      },
      { property: "og:title", content: "Retrouve CNI 2026" },
      {
        property: "og:description",
        content: "Déclarez, soyez mis en relation automatiquement, échangez en toute sécurité.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

const ETAPES = [
  {
    titre: "Je déclare",
    texte:
      "Document perdu ou trouvé : quelques informations suffisent. Le numéro est transformé en empreinte sécurisée sur votre téléphone.",
    icon: FileSearch,
  },
  {
    titre: "Match automatique",
    texte:
      "Dès qu'une déclaration correspond (date et lieu de naissance, date de délivrance), vous êtes prévenu dans votre tableau de bord.",
    icon: Sparkles,
  },
  {
    titre: "Chat sécurisé",
    texte:
      "Le détenteur communique un code à 4 chiffres. Une fois validé, la messagerie s'ouvre pour organiser la remise du document.",
    icon: MessageSquareLock,
  },
];

function Accueil() {
  return (
    <AppShell>
      <section className="hero-brand overflow-hidden rounded-3xl px-6 py-10 shadow-lift sm:px-10 sm:py-14">
        <SecurityBadge label="Aucun numéro stocké en clair" />
        <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
          Retrouvez votre CNI, sans passer par la rue
        </h1>
        <p className="mt-3 max-w-xl text-sm/6 opacity-90 sm:text-base/7">
          Retrouve CNI met en relation les personnes qui ont perdu un document et celles qui l'ont
          trouvé, partout en Côte d'Ivoire. Gratuit pour déclarer, sécurisé de bout en bout.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/declarer">J'ai perdu un document</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent">
            <Link to="/declarer">J'ai trouvé un document</Link>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Comment ça marche&nbsp;?</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre} className="surface-card p-5">
              <span className="step-number">{index + 1}</span>
              <h3 className="mt-4 flex items-center gap-2 font-semibold">
                <etape.icon className="h-4 w-4 text-primary" aria-hidden />
                {etape.titre}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-card mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <Lock className="h-8 w-8 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="font-bold">Vos données restent vos données</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Numéros hashés (SHA-256), accès aux échanges réservé aux deux parties, validation par
            code à 4 chiffres avant toute mise en relation.
          </p>
        </div>
        <Button asChild variant="outline" className="sm:ml-auto">
          <Link to="/securite">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Notre sécurité
          </Link>
        </Button>
      </section>
    </AppShell>
  );
}

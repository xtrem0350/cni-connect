import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileSearch, Lock, MessageSquareLock, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ActionModal } from "@/components/ActionModal";
import { ImageBanner } from "@/components/ImageBanner";
import { IMAGES } from "@/lib/images";
import { SecurityBadge } from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Icon3D } from "@/components/Icon3D";

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
  const { user } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  if (user) {
    router.navigate({ to: "/dashboard" });
    return null;
  }

  return (
    <AppShell>
      <ImageBanner src={IMAGES.accueil} alt="Citoyens souriants" height="h-64 md:h-80">
        <SecurityBadge label="Aucun numéro stocké en clair" />
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
          Retrouvez votre CNI, sans passer par la rue
        </h1>
        <p className="max-w-xl text-sm/6 opacity-90">
          Déclarez une perte ou une trouvaille en quelques clics, partout en Côte d'Ivoire.
        </p>
      </ImageBanner>

      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-md text-center">
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-16 w-full text-lg font-bold shadow-lg transition-transform hover:scale-[1.02]"
          >
            <Icon3D
              src="https://cdn-icons-png.flaticon.com/512/870/870091.png"
              alt="Document"
              size="sm"
              className="mr-3"
            />
            Gérer vos documents administratifs
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">Perte, trouvaille ou coffre-fort</p>
        </div>
      </div>

      <ActionModal open={modalOpen} onOpenChange={setModalOpen} />

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

import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ImageBanner } from "@/components/ImageBanner";
import { IMAGES } from "@/lib/images";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide — Retrouve CNI 2026" },
      { name: "description", content: "Guide en 3 étapes pour retrouver un document." },
    ],
  }),
  component: GuidePage,
});

const steps = [
  { title: "Je déclare", text: "Indiquez si votre document est perdu ou trouvé." },
  { title: "Match automatique", text: "Le système recherche les correspondances dans les données sécurisées." },
  { title: "Chat sécurisé", text: "Validez le code à 4 chiffres avant la remise effective du document." },
];

function GuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <ImageBanner src={IMAGES.guide} alt="Tutoriel pas à pas">
          <h1 className="text-2xl font-bold sm:text-3xl">📘 Guide d'utilisation</h1>
          <p className="text-sm opacity-90">Comment utiliser l'application</p>
        </ImageBanner>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="surface-card p-5">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-6 flex items-center justify-between p-5">
          <p className="text-sm text-muted-foreground">Prêt à lancer votre déclaration ?</p>
          <div className="inline-flex items-center gap-2 font-semibold text-primary">
            Commencer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

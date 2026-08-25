import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ImageBanner } from "@/components/ImageBanner";
import { IMAGES } from "@/lib/images";
import { SecurityBadge } from "@/components/SecurityBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Retrouve CNI 2026" },
      {
        name: "description",
        content:
          "Matchs, délais, sécurité des données, frais de mise en relation : les réponses aux questions les plus fréquentes.",
      },
      { property: "og:title", content: "FAQ — Retrouve CNI 2026" },
      { property: "og:description", content: "Tout comprendre en 5 questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faq,
});

const QUESTIONS = [
  {
    q: "Comment je sais qu'un match a été trouvé ?",
    r: "Dès qu'une déclaration correspond à la vôtre, un match apparaît dans votre tableau de bord avec son statut. Aucune information personnelle de l'autre partie n'est visible avant la validation du code à 4 chiffres.",
  },
  {
    q: "Pourquoi 500 FCFA de mise en relation ?",
    r: "Les frais servent à couvrir l'hébergement, la vérification et la modération des déclarations. Déclarer est toujours gratuit : les frais n'existent qu'au moment d'une mise en relation confirmée. Le paiement mobile (Wave, Orange Money) arrive dans une prochaine version.",
  },
  {
    q: "Que faire si je trouve un document ?",
    r: "Créez une déclaration « J'ai trouvé », en indiquant la date et le lieu de naissance ainsi que la date de délivrance figurant sur le document. Gardez-le en sécurité : vous recevrez un code à 4 chiffres à communiquer au propriétaire pour ouvrir le chat.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    r: "Le numéro du document ne quitte jamais votre appareil : seule une empreinte SHA-256 est envoyée. Vos déclarations ne sont lisibles que par vous, et les messages uniquement par les deux parties d'un match validé.",
  },
  {
    q: "En combien de temps un document est-il retrouvé ?",
    r: "Cela dépend du volume de déclarations dans votre zone. Le rapprochement est instantané dès que la déclaration complémentaire existe : votre déclaration reste active tant que vous ne la clôturez pas.",
  },
];

function Faq() {
  return (
    <AppShell>
      <ImageBanner src={IMAGES.faq} alt="Questions et aide">
        <h1 className="text-2xl font-bold sm:text-3xl">❓ Questions fréquentes</h1>
        <p className="text-sm opacity-90">Tout savoir sur Retrouve CNI</p>
      </ImageBanner>
      <SecurityBadge />

      <Accordion type="single" collapsible className="surface-card mt-6 divide-y divide-border px-5">
        {QUESTIONS.map((item, i) => (
          <AccordionItem key={item.q} value={`q-${i}`} className="border-0">
            <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.r}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Icon3D } from "@/components/Icon3D";
import { ImageBanner } from "@/components/ImageBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IMAGES } from "@/lib/images";

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
];

function VaultPage() {
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

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/declarer" search={{ type: "perdu" }}>
            Ajouter un document
          </Link>
        </Button>

        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Card key={category.label} className="transition-transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <Icon3D src={category.icon} alt={category.label} size="lg" className="mx-auto" />
                <h2 className="mt-3 font-semibold">{category.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{category.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat sécurisé — Retrouve CNI 2026" },
      { name: "description", content: "Validez votre code de match et échangez de façon sécurisée." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const [code, setCode] = useState("");

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <HeroBanner title="Chat sécurisé" subtitle="Échangez avec le citoyen concerné" />
        <header className="surface-card p-4">
          <p className="mt-4 text-sm text-muted-foreground">Match #42</p>
        </header>

        <div className="surface-card space-y-3 p-4">
          <ChatMessage sender="them" text="Le document a été identifié. Vérifions le code de validation." time="09:45" />
          <ChatMessage sender="me" text="J’ai bien reçu le document. Voici mon code : 2147" time="09:46" />
        </div>

        <div className="surface-card space-y-3 p-4">
          <div className="flex gap-2">
            <Button type="button" variant="secondary">
              Envoyer mon code
            </Button>
            <Button type="button" variant="outline">
              Valider le code
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Entrez le code 4 chiffres"
              inputMode="numeric"
              maxLength={4}
            />
            <Button type="button">OK</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

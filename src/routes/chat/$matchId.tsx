import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";
import { simulatePayment } from "@/services/paymentService";

type MatchRecord = {
  id: string;
  declaration_perdu_id: string;
  declaration_trouve_id: string;
  statut: string;
};

type MessageRecord = {
  id: string;
  user_id: string;
  contenu: string;
  created_at: string;
};

export const Route = createFileRoute("/chat/$matchId")({
  head: () => ({
    meta: [{ title: "Conversation sécurisée — Retrouve CNI 2026" }],
  }),
  component: MatchChatPage,
});

function MatchChatPage() {
  const { matchId } = useParams({ from: "/chat/$matchId" });
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [enteredCode, setEnteredCode] = useState("");
  const [myCode, setMyCode] = useState("");
  const [message, setMessage] = useState("");
  const [validated, setValidated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [isFinder, setIsFinder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from("matchs")
        .select("id, declaration_perdu_id, declaration_trouve_id, statut")
        .eq("id", matchId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Match introuvable ou inaccessible");
        setLoading(false);
        return;
      }

      setMatch(data as MatchRecord);
      const { data: ownedDeclarations } = await supabase
        .from("declarations")
        .select("id")
        .eq("user_id", user.id)
        .in("id", [data.declaration_perdu_id, data.declaration_trouve_id]);
      setIsFinder(Boolean(ownedDeclarations?.some(({ id }) => id === data.declaration_trouve_id)));
      setValidated(data.statut === "valide");
      if (data.statut === "valide") {
        await loadMessages(matchId);
      }
      setLoading(false);
    })();
  }, [matchId, user]);

  async function loadMessages(id: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, user_id, contenu, created_at")
      .eq("match_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Impossible de charger les messages");
      return;
    }
    setMessages(data ?? []);
  }

  async function revealMyCode() {
    const { data, error } = await supabase.rpc("get_code_validation", { _match_id: matchId });
    if (error) {
      toast.error("Le code sera disponible lorsque le match sera prêt");
      return;
    }
    setMyCode(String(data));
    toast.success("Votre code est prêt à être transmis");
  }

  async function validateCode() {
    if (!/^\d{4}$/.test(enteredCode)) {
      toast.error("Entrez un code à 4 chiffres");
      return;
    }
    const { data, error } = await supabase.rpc("valider_code", {
      _match_id: matchId,
      _code: enteredCode,
    });
    if (error || data !== true) {
      toast.error("Code incorrect");
      return;
    }
    setValidated(true);
    await loadMessages(matchId);
    toast.success("Match validé, le chat est ouvert");
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      user_id: user.id,
      contenu: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Message non envoyé");
      return;
    }
    setMessage("");
    await loadMessages(matchId);
  }

  async function pay() {
    if (!user) return;
    const result = await simulatePayment(500, `Match ${matchId}`);
    if (!result.ok) return;
    const reference = `MOCK-${Date.now()}`;
    const { error } = await supabase.from("paiements").insert({
      match_id: matchId,
      user_id: user.id,
      montant: 500,
      statut: "confirme",
      reference,
    });
    if (error) {
      toast.error("Paiement non enregistré");
      return;
    }
    setPaid(true);
    toast.success("Paiement enregistré");
  }

  if (!user) {
    return <AppShell><p className="text-center text-sm text-muted-foreground">Connexion requise.</p></AppShell>;
  }

  if (loading) {
    return <AppShell><p className="text-center text-sm text-muted-foreground">Chargement du match...</p></AppShell>;
  }

  if (!match) {
    return <AppShell><p className="text-center text-sm text-muted-foreground">Match indisponible.</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Conversation sécurisée</h1>
            <p className="text-sm text-muted-foreground">Les identités restent anonymes jusqu'à la restitution.</p>
          </div>
          <Button asChild variant="outline"><Link to="/chat">Retour</Link></Button>
        </div>

        <Card>
          <CardHeader><CardTitle>{isFinder ? "Vous avez trouvé un document" : "Vous avez perdu un document"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Match : {match.statut}</p>
            {!validated ? (
              <div className="space-y-3">
                {isFinder ? (
                  <Button onClick={revealMyCode}>Envoyer mon code</Button>
                ) : (
                  <>
                    <Input inputMode="numeric" maxLength={4} placeholder="Code à 4 chiffres" value={enteredCode} onChange={(event) => setEnteredCode(event.target.value.replace(/\D/g, ""))} />
                    <Button onClick={validateCode}>Valider le code</Button>
                  </>
                )}
                {myCode ? <p className="rounded-lg bg-primary/10 p-4 text-center font-mono text-2xl font-bold">{myCode}</p> : null}
              </div>
            ) : (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Les codes sont validés. Vous pouvez échanger.</p>
            )}
          </CardContent>
        </Card>

        {validated ? (
          <Card>
            <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {messages.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message.</p> : messages.map((item) => <p key={item.id} className="rounded-lg bg-muted p-3 text-sm">{item.contenu}</p>)}
              </div>
              <form onSubmit={sendMessage} className="space-y-2">
                <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Votre message" maxLength={2000} required />
                <Button type="submit" disabled={sending}>{sending ? "Envoi..." : "Envoyer"}</Button>
              </form>
              <Button onClick={pay} disabled={paid}>{paid ? "Paiement effectué" : "Payer 500F"}</Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

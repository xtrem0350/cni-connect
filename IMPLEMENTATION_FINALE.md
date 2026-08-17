# 📋 PROMPT D'IMPLÉMENTATION FINALE - RETROUVE CNI 2026

## 🎯 À COPIER-COLLER DANS COPILOTE

```
Je dois finaliser l'application "Retrouve CNI 2026" pour une démo fonctionnelle.
Changements très précis, fichier par fichier. Pas de refactoring inutile.

---

## 🗄️ PART 1 : MIGRATIONS SQL SUPABASE (À exécuter dans SQL Editor)

```sql
-- 1. AJOUTER LE STATUT DANS PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_code text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS code_generated_at timestamp DEFAULT NULL;

-- 2. TABLE SIGNALEMENTS
CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id uuid REFERENCES declarations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  raison text NOT NULL,
  statut text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'traite', 'rejete')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. POLITIQUES RLS POUR SIGNALEMENTS
ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON signalements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can view their reports" ON signalements
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all reports" ON signalements
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update reports" ON signalements
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
```

---

## 📁 PART 2 : MODIFICATION 1 - src/routes/auth.tsx

**AJOUTER : Génération de code à 6 chiffres**

Le code est généré localement et affiché à l'écran (pas d'OTP SMS en démo).

Format du code : `JJHHMMSS + P/T` 
- JJ = jour (2 chiffres)
- HH = heure (2 chiffres)
- MM = minute (2 chiffres)
- SS = secondes (2 chiffres)
- P = "Perdu", T = "Trouvé"

Exemple : `16140530P` = 16ème jour à 14h05min30sec pour "Perdu"

**Code snippet à INTÉGRER** :

```typescript
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { verifyAuthCode } from "@/services/authService";
import type { DeclarationType } from "@/types/database";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Retrouve CNI 2026" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DeclarationType>("perdu");
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.navigate({ to: "/dashboard" });
  }, [user, router]);

  const generateCode = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const status = selectedStatus === 'perdu' ? 'P' : 'T';
    return `${day}${hour}${minute}${second}${status}`;
  };

  const handleReceiveCode = () => {
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro WhatsApp");
      return;
    }

    const code = generateCode();
    setGeneratedCode(code);
    
    // Stocker dans sessionStorage
    sessionStorage.setItem('auth_code', code);
    sessionStorage.setItem('auth_phone', phone);
    sessionStorage.setItem('auth_status', selectedStatus);
    
    setStep("code");
    toast.success("Code généré", { 
      description: `Code : ${code}` 
    });
  };

  const handleVerifyCode = async () => {
    if (enteredCode !== generatedCode) {
      toast.error("Code incorrect");
      return;
    }

    setLoading(true);
    try {
      await verifyAuthCode(phone, enteredCode);
      toast.success("Connexion réussie");
      router.navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error("Erreur de connexion", { 
        description: String(error) 
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <AppShell>
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold">Vérification du code</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nous avons généré un code pour {phone}
          </p>

          <div className="mt-6 space-y-4">
            <div className="surface-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Votre code :</p>
              <p className="mt-2 text-4xl font-bold tracking-widest text-primary">
                {generatedCode}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">Saisir le code</Label>
              <Input
                id="code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                placeholder="JJHHMMSS + P/T"
                maxLength={9}
              />
            </div>

            <Button 
              onClick={handleVerifyCode}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Vérification..." : "✅ Vérifier"}
            </Button>

            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setStep("phone")}
              disabled={loading}
            >
              Retour
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">Créez un compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utilisez votre numéro WhatsApp pour vous connecter.
        </p>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Numéro WhatsApp</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 01 23 45 67"
              inputMode="tel"
            />
          </div>

          <div className="space-y-2">
            <Label>Vous déclarez un document :</Label>
            <RadioGroup value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as DeclarationType)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="perdu" id="perdu" />
                <Label htmlFor="perdu" className="cursor-pointer font-normal">
                  📄 J'ai perdu mon document
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="trouve" id="trouve" />
                <Label htmlFor="trouve" className="cursor-pointer font-normal">
                  📄 J'ai trouvé un document
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleReceiveCode}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Génération..." : "📨 Recevoir mon code"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
```

---

## 📁 PART 3 : MODIFICATION 2 - src/services/authService.ts

**AJOUTER : Fonction verifyAuthCode()**

```typescript
import { supabase } from "@/integrations/supabase";
import type { DeclarationType } from "@/types/database";

export const verifyAuthCode = async (phone: string, code: string) => {
  const storedCode = sessionStorage.getItem('auth_code');
  const storedPhone = sessionStorage.getItem('auth_phone');
  const storedStatus = sessionStorage.getItem('auth_status') as DeclarationType;
  
  if (phone !== storedPhone) {
    throw new Error('Numéro de téléphone incorrect');
  }
  
  if (code !== storedCode) {
    throw new Error('Code incorrect');
  }
  
  // Chercher profil existant
  const { data: existingUser, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingUser) {
    // Mettre à jour
    await supabase
      .from('profiles')
      .update({ 
        status: storedStatus,
        auth_code: code,
        code_generated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id);
  } else {
    // Créer nouveau
    await supabase
      .from('profiles')
      .insert({
        phone: phone,
        status: storedStatus,
        auth_code: code,
        code_generated_at: new Date().toISOString()
      });
  }
  
  // Nettoyer sessionStorage
  sessionStorage.removeItem('auth_code');
  sessionStorage.removeItem('auth_phone');
  sessionStorage.removeItem('auth_status');
};

// Garder les autres fonctions existantes...
```

---

## 📁 PART 4 : MODIFICATION 3 - src/routes/declarer.tsx

**MODIFICATION : Supprimer le choix Perdu/Trouvé**

```typescript
// À AJOUTER CES IMPORTS :
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/services/authService";
import { AppShell } from "@/components/AppShell";

// À AJOUTER AU COMPOSANT :

function DeclarerPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(({ data }) => {
        setUserProfile(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  // Le type est déterminé automatiquement depuis le profil
  const defaultType = userProfile?.status || 'perdu';

  // À SUPPRIMER DU FORMULAIRE :
  // - Tous les champs select ou radio avec options "Perdu" / "Trouvé"

  // À AJOUTER AU FORMULAIRE (comme champ caché ou informationnel) :
  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm">
      <strong>Mode :</strong> {defaultType === 'perdu' ? '📄 J\'ai perdu un document' : '📄 J\'ai trouvé un document'}
    </p>
  </div>

  // Dans le handleSubmit :
  const handleSubmit = async (data: any) => {
    await declarationService.create({
      ...data,
      type: defaultType, // Automatique selon le profil
    });
  };
}
```

---

## 📁 PART 5 : MODIFICATION 4 - src/components/AppShell.tsx

**MODIFICATION : Filtrer le menu selon le rôle**

```typescript
// À AJOUTER TOUS CES IMPORTS EN HAUT :
import { BookOpen, BarChart3, AlertTriangle, FileText, MessageSquare, User, Home, HelpCircle, Lock, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/services/authService";

// À AJOUTER dans le composant AppShell :

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(({ data }) => {
        setUserProfile(data);
        setIsAdmin(data?.is_admin || false);
      });
    }
  }, [user]);

  const menuItems = {
    public: [
      { to: "/", label: "Accueil", icon: Home },
      { to: "/faq", label: "FAQ", icon: HelpCircle },
      { to: "/securite", label: "Sécurité", icon: Lock },
      { to: "/guide", label: "Guide", icon: BookOpen },
    ],
    user: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/declarations", label: "Mes déclarations", icon: FileText },
      { to: "/chat", label: "Chat", icon: MessageSquare },
      { to: "/profile", label: "Profil", icon: User },
    ],
    admin: [
      { to: "/statut", label: "Statistiques", icon: BarChart3 },
      { to: "/signalements", label: "Signalements", icon: AlertTriangle },
    ],
  };

  const getVisibleMenuItems = () => {
    const items = [...menuItems.public];
    
    if (user) {
      items.push(...menuItems.user);
    }
    
    if (isAdmin) {
      items.push(...menuItems.admin);
    }
    
    return items;
  };

  const visibleItems = getVisibleMenuItems();

  // REMPLACER LA SECTION NAV par celle-ci :
  <nav className="ml-auto hidden items-center gap-1 md:flex">
    {visibleItems.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        activeProps={{ className: "bg-primary-soft text-primary" }}
      >
        <item.icon className="inline mr-1 h-4 w-4" aria-hidden />
        {item.label}
      </Link>
    ))}
  </nav>

  // Garder le reste du composant inchangé...
}
```

---

## 📁 PART 6 : MODIFICATION 5 - src/routes/signalement.tsx

**MODIFICATION : Restreindre aux utilisateurs connectés**

```typescript
// À AJOUTER TOUS CES IMPORTS EN HAUT :
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";

// À AJOUTER dans le composant SignalementPage :

function SignalementPage() {
  const { user } = useAuth();

  // AJOUTER CETTE VÉRIFICATION EN HAUT DU RENDU
  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md text-center py-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">🔒 Connexion requise</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous devez être connecté pour signaler un abus.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Reste du composant...
  // Dans le handleSubmit :
  const handleSubmit = async (data: any) => {
    try {
      await supabase.from('signalements').insert({
        ...data,
        user_id: user.id,  // Automatique
      });
      toast.success("Signalement envoyé");
    } catch (error) {
      toast.error("Erreur", { description: String(error) });
    }
  };
}
```

---

## ✅ CHECKLIST POST-IMPLÉMENTATION

```bash
# 1. Build
npm run build              # ✅ Doit afficher 0 erreur

# 2. Tester pages publiques
http://localhost:8080/     # Accueil
http://localhost:8080/faq  # FAQ
/securite, /guide          # Visibles sans login

# 3. Tester auth
http://localhost:8080/auth
- Saisir numéro WhatsApp
- Cliquer "Recevoir mon code"
- Voir le code généré (JJHHMMSS + P/T)
- Saisir le code
- Cliquer "Vérifier"

# 4. Tester après connexion
/dashboard  # Visible
/declarations  # Visible
/declarer  # Type auto (Perdu/Trouvé)
/chat  # Visible
/profile  # Visible

# 5. Tester signalement
/signalement  # Visible si connecté
              # Message "Connexion requise" si déconnecté

# 6. Tester menu
- Menu doit afficher différents items selon connecté ou pas
- Pas de bouton "Se connecter" dans le header
- Bouton Admin ⚙️ toujours visible
```

---

**STATUS** : À faire immédiatement pour démo fonctionnelle
**TEMPS ESTIMÉ** : 1-2 heures
**BUILD** : Doit passer avec 0 erreur
```

---

## 📝 NOTES IMPORTANTES

1. ✅ **Le code 6 chiffres est GÉNÉRÉ LOCALEMENT** (pas d'OTP SMS en démo)
2. ✅ **Le choix Perdu/Trouvé se fait À L'INSCRIPTION** (pas de re-choix à chaque déclaration)
3. ✅ **Le menu s'adapte automatiquement** selon public/user/admin
4. ✅ **Pas de bouton "Se connecter"** dans le header
5. ✅ **Admin panel reste inchangé** (code @Cni → email/password)
6. ✅ **Build doit passer SANS ERREUR TypeScript**

## 🎯 RÉSULTAT ATTENDU

Une application fonctionnelle avec :
- Page d'accueil professionnelle
- Authentification WhatsApp + Code 6 chiffres
- Menu filtré par rôle
- Declarations automatiques Perdu/Trouvé
- Signalements réservés aux connectés
- Admin panel avec code @Cni

**Prêt pour démo complète** ✨

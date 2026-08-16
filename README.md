# CNI Connect

Projet name : Retrouve CNI 2026
supabase 
Projet url : https://xpbgvjebnulugeisonju.supabase.co
pubishable key : sb_publishable_Ume-LM9UWQUiELQ7FUK-RA_QTtwEEzr 

Excellent ! Ce cahier des charges est déjà très solide. Voici mes améliorations et suggestions pour le rendre encore plus robuste avant de le donner à Cursor :

## 🚀 AMÉLIORATIONS PROPOSÉES

### 1. **SÉCURITÉ & DONNÉES**

```sql
-- Ajouter des index pour les performances
CREATE INDEX idx_declarations_match ON declarations(date_naissance, lieu_naissance, date_delivrance);
CREATE INDEX idx_declarations_user ON declarations(user_id);
CREATE INDEX idx_matchs_status ON matchs(statut);

-- Ajouter une table pour les tentatives de paiement
CREATE TABLE paiements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matchs(id),
  user_id uuid references profiles(id),
  montant integer default 500,
  statut text default 'initie', -- initie, confirme, echoue
  reference text unique,
  created_at timestamp default now()
);

-- Ajouter une colonne pour la date du dernier match
ALTER TABLE declarations ADD COLUMN last_matched_at timestamp;
```

### 2. **ALGORITHME DE MATCH AMÉLIORÉ**

```sql
-- Fonction de match plus précise
CREATE OR REPLACE FUNCTION check_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Match si 3 critères identiques (au lieu de 80%)
  INSERT INTO matchs (declaration_perdu_id, declaration_trouve_id)
  SELECT 
    d1.id,
    d2.id
  FROM declarations d1, declarations d2
  WHERE 
    d1.type = 'perdu' AND d2.type = 'trouve'
    AND d1.date_naissance = d2.date_naissance
    AND d1.lieu_naissance = d2.lieu_naissance
    AND d1.date_delivrance = d2.date_delivrance
    AND d1.id != d2.id
    AND d1.statut = 'actif' AND d2.statut = 'actif'
    AND NOT EXISTS (
      SELECT 1 FROM matchs m 
      WHERE (m.declaration_perdu_id = d1.id AND m.declaration_trouve_id = d2.id)
      OR (m.declaration_perdu_id = d2.id AND m.declaration_trouve_id = d1.id)
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. **FONCTIONNALITÉS CORE À AJOUTER**

#### **A. Système de Notifications Push**
```typescript
// Ajouter dans le service worker
- Notifications Web Push pour les matchs
- Notifications pour les messages dans le chat
- Notifications de rappel pour les déclarations en attente
```

#### **B. Historique et Statistiques**
- Tableau de bord utilisateur avec toutes ses déclarations
- Statut des matchs en cours
- Historique des paiements

#### **C. Modération**
```sql
-- Table pour signaler les abus
CREATE TABLE signalements (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid references declarations(id),
  user_id uuid references profiles(id),
  raison text,
  statut text default 'en_attente',
  created_at timestamp default now()
);
```

### 4. **UX/UI AMÉLIORATIONS**

#### **Pages additionnelles :**
- `/dashboard` - Vue d'ensemble personnalisée
- `/declarations/historique` - Toutes les déclarations
- `/faq` - Guide d'utilisation
- `/securite` - Explication de la sécurité des données

#### **Design System :**
```css
/* Ajouter des composants Tailwind réutilisables */
- .btn-primary { @apply bg-[#009E60] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#007a4b] transition; }
- .btn-secondary { @apply bg-[#F77F00] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#d96b00] transition; }
- .card { @apply bg-white rounded-xl shadow-lg p-6; }
- .badge { @apply inline-block px-3 py-1 text-sm font-semibold rounded-full; }
- .badge-perdu { @apply bg-red-100 text-red-800; }
- .badge-trouve { @apply bg-green-100 text-green-800; }
```

### 5. **PWA OPTIMISÉE**

```json
// manifest.json amélioré
{
  "name": "Retrouve CNI Côte d'Ivoire",
  "short_name": "Retrouve CNI",
  "description": "Retrouvez vos documents perdus en Côte d'Ivoire",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#009E60",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    // ... autres tailles
  ],
  "categories": ["utilities", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ]
}
```

### 6. **PERFORMANCES**

```typescript
// Optimisations React
- React.memo pour les composants lourds
- useCallback pour les fonctions
- Lazy loading des routes
- Compression des images
- Cache stratégique avec Service Worker
```

### 7. **SÉCURITÉ RENFORCÉE**

```typescript
// Ajouter
- Rate limiting sur les tentatives de code
- Délai de 5 minutes entre 3 tentatives
- Système de captcha pour les formulaires
- Validation côté serveur de tous les inputs
- Logs d'audit pour toutes les actions sensibles
```

### 8. **MONÉTISATION AVANCÉE**

```sql
-- Table pour les offres promotionnelles
CREATE TABLE promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  reduction integer, -- en pourcentage
  date_expiration timestamp,
  statut text default 'actif'
);

-- Ajouter à paiements
ALTER TABLE paiements ADD COLUMN promotion_id uuid references promotions(id);
```

### 9. **PROMPT CURSOR FINAL**

Voici le prompt à copier-coller dans Cursor :

```
Je souhaite développer une PWA en React + Vite + TailwindCSS avec Supabase comme backend.

Fonctionnalités principales :
1. Authentification par SMS OTP
2. Déclaration de documents perdus/trouvés avec hashing du numéro
3. Algorithme de match intelligent par date/lieu de naissance et date délivrance
4. Chat sécurisé avec validation par code à 4 chiffres
5. Système de paiement (version démo pour l'instant)
6. PWA installable avec service worker

Structure de base de données :
- profiles (auth.users étendu)
- declarations (perdu/trouvé)
- matchs (avec codes de validation)
- paiements (historique)

Contraintes importantes :
- Mobile-first design
- Interface simple et épurée
- Utiliser les couleurs : #009E60, #F77F00, #FFFFFF
- Support offline pour la consultation des déclarations
- Sécurité des données (hash des numéros, validation des codes)

Je veux un code propre, modulaire et bien documenté. Le projet doit être prêt pour un déploiement en production.

Structure de dossiers souhaitée :
src/
├── components/
├── pages/
├── hooks/
├── contexts/
├── utils/
├── services/
├── types/
└── styles/

Commence par configurer le projet avec toutes les dépendances nécessaires.
```

### 10. **TESTS & QUALITÉ**

```typescript
// Ajouter dans le prompt final
- Tests unitaires avec Vitest
- Tests d'intégration avec React Testing Library
- Couverture de code minimale de 70%
- ESLint + Prettier configurés
- Husky pour les pre-commits
```

---

## 📋 CHECKLIST FINALE AVANT CURSOR

- [ ] Vérifier que Supabase est bien configuré
- [ ] Préparer les variables d'environnement
- [ ] Définir clairement les types TypeScript
- [ ] Prévoir les cas d'erreur (offline, timeout, etc.)
- [ ] Documenter l'API interne
- [ ] Planifier les mises à jour V2 (Wave/OM)

Avec ces améliorations, tu auras un MVP beaucoup plus solide, scalable et prêt pour la production ! 🚀

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd30cb01-3486-4f34-8430-2f9b231fd93b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

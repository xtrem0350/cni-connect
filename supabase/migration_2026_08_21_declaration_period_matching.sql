## 📋 PROMPT POUR COPILOTE (EN FRANÇAIS) - DERNIER DE LA JOURNÉE

```
🚨 AJOUT PHOTO + PROTECTION DU SITE

**CONTEXTE :**
- Celui qui a trouvé un document doit pouvoir joindre une photo (Recto/Verso ou une photo du document)
- Les images doivent être protégées : pas de téléchargement, pas de clic droit, pas d'inspection du code source
- Message "Site protégé par Thierry Gogo" en cas d'inspection

**PRIORITÉ :** Photo dans la déclaration "Trouvé" uniquement (pas pour "Perdu")

---

## 📁 FICHIER 1 : src/routes/declarer.tsx

### 1. AJOUTER L'ÉTAT POUR LA PHOTO

```tsx
const [formData, setFormData] = useState({
  nom: '',
  prenom: '',
  type_document: 'CNI',
  date_naissance: '',
  lieu_naissance: '',
  periode_debut: '',
  periode_fin: '',
  lieu_delivrance: '',
  lieu_perte_trouvaille: '',
  numero_document: '',
  description: '',
  photo: null as File | null, // 🔥 NOUVEAU
  photo_url: '', // 🔥 URL après upload
});

const [photoPreview, setPhotoPreview] = useState('');
```

### 2. AJOUTER L'UPLOAD DE PHOTO (UNIQUEMENT POUR "TROUVÉ")

```tsx
// Gestion de la photo
const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Vérifier le type et la taille (max 5MB)
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }
    setFormData({ ...formData, photo: file });
    setPhotoPreview(URL.createObjectURL(file));
  }
};

// Upload vers Supabase Storage
const uploadPhoto = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `declarations/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (error) throw error;

  // Récupérer l'URL publique
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};
```

### 3. AFFICHAGE DU CHAMP PHOTO (UNIQUEMENT POUR "TROUVÉ")

```tsx
{/* PHOTO - UNIQUEMENT POUR TROUVÉ */}
{typeParam === 'trouve' && (
  <div className="space-y-2">
    <Label>Photo du document *</Label>
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      {photoPreview ? (
        <div className="relative">
          <img 
            src={photoPreview} 
            alt="Document" 
            className="max-h-64 mx-auto rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              setFormData({ ...formData, photo: null });
              setPhotoPreview('');
            }}
          >
            ✕
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-muted-foreground">Cliquez ou déposez une photo du document</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (max 5MB)</p>
          <Input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="mt-4 cursor-pointer"
          />
        </div>
      )}
    </div>
  </div>
)}
```

### 4. MODIFICATION DE handleSubmit

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validations existantes

  setLoading(true);
  try {
    let photoUrl = null;
    
    // 🔥 Upload de la photo si présente (uniquement pour "trouvé")
    if (typeParam === 'trouve' && formData.photo) {
      photoUrl = await uploadPhoto(formData.photo, userId);
      console.log('📸 Photo uploadée:', photoUrl);
    }

    const { error } = await supabase
      .from('declarations')
      .insert({
        // ... autres champs
        photo_url: photoUrl, // 🔥 URL de la photo
        type: typeParam,
        statut: 'actif'
      });

    if (error) throw error;
    toast.success(`✅ Déclaration de trouvaille enregistrée avec photo !`);
    navigate({ to: "/dashboard" });

  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error("Erreur lors de l'enregistrement");
  } finally {
    setLoading(false);
  }
};
```

### 5. MIGRATION SUPABASE

```sql
-- Ajouter la colonne photo_url
ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Créer le bucket Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour les uploads
CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour la lecture publique
CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');
```

---

## 📁 FICHIER 2 : PROTECTION DU SITE (src/App.tsx)

### 1. BLOQUER LE CLIC DROIT ET L'INSPECTION

```tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Bloquer le clic droit
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("🔒 Site protégé par Thierry Gogo");
    };

    // Bloquer les raccourcis clavier (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        alert("🔒 Site protégé par Thierry Gogo");
        return;
      }
      // Ctrl+Shift+I (Inspecter)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        alert("🔒 Site protégé par Thierry Gogo");
        return;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        alert("🔒 Site protégé par Thierry Gogo");
        return;
      }
      // Ctrl+U (Voir le code source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        alert("🔒 Site protégé par Thierry Gogo");
        return;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ... suite
}
```

### 2. COMPOSANT DE PROTECTION (src/components/SiteProtection.tsx)

```tsx
import { useEffect } from 'react';

export function SiteProtection() {
  useEffect(() => {
    // Désactiver le drag & drop des images
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    // Désactiver le téléchargement des images (via menu contextuel)
    const handleContextMenu = (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        alert("🔒 Site protégé par Thierry Gogo");
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
}
```

### 3. AJOUTER DANS App.tsx

```tsx
import { SiteProtection } from '@/components/SiteProtection';

function App() {
  return (
    <>
      <SiteProtection />
      <RouterProvider router={router} />
    </>
  );
}
```

---

## ✅ RÉSUMÉ DES MODIFICATIONS

| # | Fichier | Changement |
|---|---------|------------|
| 1 | `declarer.tsx` | Ajout upload photo (Recto/Verso) |
| 2 | `declarer.tsx` | Afficher le champ photo uniquement pour "Trouvé" |
| 3 | Supabase | Migration + bucket Storage |
| 4 | `App.tsx` | Bloquer clic droit + inspection |
| 5 | `SiteProtection.tsx` | Protéger les images (drag, téléchargement) |

---

## 🧪 TEST

1. Créer une déclaration "Trouvé" avec une photo
2. Vérifier que la photo est uploadée dans Supabase Storage
3. Tenter de faire un clic droit → message "Site protégé par Thierry Gogo"
4. Tenter F12 → message "Site protégé par Thierry Gogo"

---

**GO !** 🚀
```
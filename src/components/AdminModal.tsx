import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPanel } from "./AdminPanel";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminModal({ open, onOpenChange }: AdminModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const handleValidate = () => {
    if (code === "@Cni") {
      setAuthorized(true);
      setError("");
    } else {
      setError("❌ Code invalide. Veuillez réessayer.");
      setCode("");
    }
  };

  const handleReset = () => {
    setCode("");
    setError("");
    setAuthorized(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ Administration
          </DialogTitle>
          <DialogDescription>
            {!authorized ? "Entrez le code d'accès pour accéder au panel administration" : "Panel d'administration"}
          </DialogDescription>
        </DialogHeader>

        {!authorized ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Code d'accès"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                className="text-center text-xl tracking-widest"
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <p className="text-xs text-gray-400 text-center">💡 Code : @Cni</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleValidate} className="flex-1 bg-primary text-primary-foreground">
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <AdminPanel onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

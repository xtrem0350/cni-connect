import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon3D } from "@/components/Icon3D";

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIONS = [
  {
    type: "vault" as const,
    label: "Mon coffre-fort",
    icon: "https://cdn-icons-png.flaticon.com/512/599/599683.png",
    alt: "Coffre-fort",
    className: "border-2 border-primary/30 hover:border-primary",
  },
  {
    type: "perdu" as const,
    label: "J'ai perdu un document",
    icon: "https://cdn-icons-png.flaticon.com/512/870/870091.png",
    alt: "Document perdu",
    className: "border-2 border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50",
  },
  {
    type: "trouve" as const,
    label: "J'ai trouvé un document",
    icon: "https://cdn-icons-png.flaticon.com/512/845/845646.png",
    alt: "Document trouvé",
    className: "border-2 border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50",
  },
] as const;

export function ActionModal({ open, onOpenChange }: ActionModalProps) {
  const navigate = useNavigate();

  const handleChoice = (type: (typeof ACTIONS)[number]["type"]) => {
    onOpenChange(false);
    void navigate({ to: "/auth", search: { status: type } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Que voulez-vous faire ?</DialogTitle>
          <DialogDescription className="text-center">
            Choisissez une option pour continuer
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          {ACTIONS.map((action) => (
            <Button
              key={action.type}
              type="button"
              variant="outline"
              className={`h-16 justify-start text-base font-semibold ${action.className}`}
              onClick={() => handleChoice(action.type)}
            >
              <Icon3D src={action.icon} alt={action.alt} size="sm" className="mr-3 shrink-0" />
              {action.label}
            </Button>
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Votre coffre reste accessible depuis le menu après connexion.
        </p>
      </DialogContent>
    </Dialog>
  );
}
import React from "react";
import type { Address } from "@/types";
import { Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface AddressCardProps {
  address: Address;
  active?: boolean;
  selectable?: boolean;
  onSelect?: (address: Address) => void;
  onDelete?: (id: number) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  active = false,
  selectable = false,
  onSelect,
  onDelete,
}) => {
  const title = address.title ? address.title : address.street;
  const mainLine = `${address.street}, ${address.zipCode} ${address.city}`;

  return (
    <div
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : -1}
      onClick={selectable && onSelect ? () => onSelect(address) : undefined}
      className={`bg-card p-3 sm:p-4 rounded-lg border transition-all flex items-start justify-between gap-3 sm:gap-4 ${
        active
          ? "border-primary ring-1 ring-primary"
          : "border-secondary hover:bg-secondary/20"
      }`}
      aria-label={selectable ? "Adresse auswählen" : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground mb-1 truncate">
          {title}
        </p>
        <p className="text-sm text-foreground break-words">{mainLine}</p>
        {address.details && (
          <p className="text-xs italic text-muted mt-1 break-words">
            {address.details}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {active && (
          <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Aktiv" />
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address.id);
            }}
            className="min-h-[44px] w-11 h-11 text-muted-foreground hover:bg-secondary hover:text-primary"
            aria-label="Adresse löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;

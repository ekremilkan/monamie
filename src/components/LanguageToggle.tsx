import React from "react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  size = "sm",
}) => {
  const { locale, setLocale, t } = useLanguage();
  const isGerman = locale === "de";
  const handleToggle = () => {
    setLocale(isGerman ? "en" : "de");
  };

  const deLabel = t<string>("common.languageToggle.deLabel");
  const enLabel = t<string>("common.languageToggle.enLabel");
  const ariaLabel = t<string>("common.languageToggle.ariaLabel");

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-1 rounded-full border-primary/40 text-foreground hover:bg-primary/10 min-w-[72px]",
        className
      )}
      aria-label={ariaLabel}
    >
      <span
        className={cn(
          "font-semibold transition-colors",
          isGerman ? "text-primary" : "text-muted-foreground"
        )}
      >
        {deLabel}
      </span>
      <span className="text-muted">/</span>
      <span
        className={cn(
          "font-semibold transition-colors",
          !isGerman ? "text-primary" : "text-muted-foreground"
        )}
      >
        {enLabel}
      </span>
    </Button>
  );
};

export default LanguageToggle;

import React from "react";
import { UtensilsCrossed, Drumstick, CupSoda, Wheat } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useLanguage } from "@/contexts";

const iconMap: Record<string, (props: LucideProps) => JSX.Element> = {
  burgers: (props) => <UtensilsCrossed {...props} />,
  tenders: (props) => <Drumstick {...props} />,
  drinks: (props) => <CupSoda {...props} />,
  sides: (props) => <Wheat {...props} />,
};

const QuickCategories: React.FC = () => {
  const { t } = useLanguage();
  const categories = t<
    Array<{
      name: string;
      slug: string;
    }>
  >("home.quickCategories.items");

  return (
    <section className="my-8">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
        {t("home.quickCategories.title")}
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {categories.map(({ name, slug }) => {
          const Icon =
            iconMap[slug] ??
            ((props: LucideProps) => <UtensilsCrossed {...props} />);
          return (
            <a
              key={slug}
              href={`/menu?category=${slug}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-lg bg-card p-4 text-center shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="rounded-full bg-secondary p-3">
                <Icon className="h-6 w-6 text-foreground" />
              </div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary">
                {name}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default QuickCategories;

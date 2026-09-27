import React, { useMemo } from "react";
import {
  Home,
  List,
  ShoppingCart,
  User,
  Heart,
  History,
  Info,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, useLanguage } from "@/contexts";
import { DELIVERY_FEE, getCartSubtotal } from "@/lib/cartPricing";
import type { SupportedLocale } from "@/lib/i18n/shared";
import LanguageToggle from "./LanguageToggle";

interface SideNavbarProps {
  currentPath: string;
  className?: string;
}

const intlLocale = (locale: SupportedLocale) =>
  locale === "de" ? "de-DE" : "en-GB";

const SideNavbar: React.FC<SideNavbarProps> = ({ currentPath, className }) => {
  const { token, openLoginModal } = useAuth();
  const { cartItems } = useCart();
  const { locale, t } = useLanguage();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount =
    getCartSubtotal(cartItems) + (totalItems > 0 ? DELIVERY_FEE : 0);
  const totalAmountLabel = new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(totalAmount);

  const mainNavLinks = useMemo(
    () => [
      { href: "/", label: t("navigation.side.home"), Icon: Home },
      { href: "/menu", label: t("navigation.side.menu"), Icon: List },
    ],
    [t],
  );

  const quickLinks = useMemo(
    () => [
      { href: "/about", label: t("navigation.side.about"), Icon: Info },
      {
        href: "/favorites",
        label: t("navigation.side.favorites"),
        Icon: Heart,
      },
    ],
    [t],
  );

  const activeClass = "bg-primary text-primary-foreground";
  const activeClassCart = "";
  const inactiveClass =
    "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground";
  const linkClasses =
    "flex items-center gap-3 p-3 rounded-lg transition-colors font-heading text-lg";
  const linkClassCart =
    "flex items-center justify-center gap-3 p-3 transition-colors font-heading text-2xl";

  return (
    <aside
      className={clsx(
        "bg-card text-foreground flex-col p-4 shadow-[2px_0_8px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      <nav className="mt-4">
        <div className="flex flex-col gap-2">
          {mainNavLinks.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className={`${linkClasses} ${
                currentPath === href ? activeClass : inactiveClass
              }`}
            >
              <Icon size={24} />
              <span>{label}</span>
            </a>
          ))}

          {/* --- YENİ "ORDER HISTORY" LİNKİ (Sadece giriş yapmışsan görünür) --- */}
          {token && (
            <a
              href="/order-history"
              className={`${linkClasses} ${
                currentPath === "/order-history" ? activeClass : inactiveClass
              }`}
            >
              <History size={24} />
              <span>{t("navigation.side.orderHistory")}</span>
            </a>
          )}

          {token ? (
            <a
              href="/profile"
              className={`${linkClasses} ${
                currentPath === "/profile" ? activeClass : inactiveClass
              }`}
            >
              <User size={24} />
              <span>{t("navigation.side.profile")}</span>
            </a>
          ) : (
            <button
              onClick={openLoginModal}
              className={`${linkClasses} ${inactiveClass} w-full`}
            >
              <User size={24} />
              <span>{t("navigation.side.login")}</span>
            </button>
          )}

          <hr className="my-2 border-border/50" />
          <a
            href="/cart"
            className={
              totalItems > 0
                ? linkClassCart
                : `${linkClasses} ${
                    currentPath === "/cart" ? activeClassCart : inactiveClass
                  }`
            }
          >
            <div className="relative">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className={totalItems > 0 ? "text-value" : ""}>
              {totalItems > 0 ? totalAmountLabel : t("navigation.side.cart")}
            </span>
          </a>

          <hr className="my-2 border-border/50" />
        </div>
      </nav>
      <nav className="mt-12">
        <h3 className="text-xs uppercase text-muted font-bold px-4 mb-2">
          {t("navigation.side.quickLinksHeading")}
        </h3>
        <div className="flex flex-col gap-2">
          {quickLinks.map(({ href, label, Icon }) => {
            const isActive = currentPath === href;
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-md ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </a>
            );
          })}
        </div>
      </nav>
      <div className="mt-12 flex justify-center">
        <LanguageToggle />
      </div>
    </aside>
  );
};

export default SideNavbar;

import React from "react";
import {
  Home,
  List,
  ShoppingCart,
  User,
  MoreHorizontal,
  Heart,
  Info,
  X,
  History,
  ChevronRight,
  Lock,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, useLanguage } from "@/contexts";
import { DELIVERY_FEE, getCartSubtotal } from "@/lib/cartPricing";
import LanguageToggle from "./LanguageToggle";

interface BottomNavbarProps {
  currentPath: string;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentPath }) => {
  const { token, openLoginModal } = useAuth();
  const { cartItems } = useCart();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const { locale, t } = useLanguage();
  const homeLabel = t<string>("navigation.bottom.home");
  const menuLabel = t<string>("navigation.bottom.menu");
  const moreTitle = t<string>("navigation.bottom.more.title");
  const moreCloseAria = t<string>("navigation.bottom.more.closeAria");
  const moreLabel = t<string>("navigation.bottom.more.label");
  const loginRequiredLabel = t<string>("navigation.bottom.more.loginRequired");
  const favoritesTitle = t<string>("navigation.bottom.more.favorites.title");
  const favoritesDescription = t<string>(
    "navigation.bottom.more.favorites.description",
  );
  const ordersTitle = t<string>("navigation.bottom.more.orders.title");
  const ordersDescription = t<string>(
    "navigation.bottom.more.orders.description",
  );
  const aboutTitle = t<string>("navigation.bottom.more.about.title");
  const aboutDescription = t<string>(
    "navigation.bottom.more.about.description",
  );
  const cartLabel = t<string>("navigation.bottom.cart");
  const profileLabel = t<string>("navigation.bottom.profile");
  const loginLabel = t<string>("navigation.bottom.login");

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount =
    getCartSubtotal(cartItems) + (totalItems > 0 ? DELIVERY_FEE : 0);
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";
  const totalAmountLabel = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EUR",
  }).format(totalAmount);

  const navLinksBase = [
    { href: "/", label: homeLabel, Icon: Home },
    { href: "/menu", label: menuLabel, Icon: List },
  ];

  const moreLinks = [
    {
      href: "/favorites",
      label: favoritesTitle,
      Icon: Heart,
      requiresAuth: true,
      description: favoritesDescription,
    },
    {
      href: "/order-history",
      label: ordersTitle,
      Icon: History,
      requiresAuth: true,
      description: ordersDescription,
    },
    {
      href: "/about",
      label: aboutTitle,
      Icon: Info,
      requiresAuth: false,
      description: aboutDescription,
    },
  ];

  const linkClasses =
    "flex flex-col items-center justify-center gap-1 transition-colors font-sans w-16 text-center";
  const activeClass = "text-primary";
  const inactiveClass = "text-foreground hover:text-primary";

  const closeMoreMenu = () => setIsMoreOpen(false);

  return (
    <nav
      className={clsx(
        "sticky bottom-0 w-full bg-background border-t border-secondary shadow-[0_-2px_8px_rgba(0,0,0,0.05)] md:hidden z-20",
      )}
    >
      {isMoreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label={moreCloseAria}
            onClick={closeMoreMenu}
            className="absolute inset-0 bg-black/40"
          />
          <div
            id="more-menu"
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-border/60 bg-card/95 backdrop-blur shadow-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {moreTitle}
              </p>
              <button
                type="button"
                onClick={closeMoreMenu}
                aria-label={moreCloseAria}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {moreLinks.map(
                ({ href, label, Icon, requiresAuth, description }) => {
                  if (requiresAuth && !token) {
                    return (
                      <button
                        key={href}
                        type="button"
                        onClick={() => {
                          closeMoreMenu();
                          openLoginModal();
                        }}
                        className="group flex w-full items-center justify-between rounded-3xl border border-border/50 bg-gradient-to-br from-background/90 via-background/80 to-background/60 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-4">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon size={20} />
                          </span>
                          <span className="flex flex-col items-start">
                            <span className="text-sm font-semibold text-foreground">
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {description}
                            </span>
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Lock size={14} />
                          {loginRequiredLabel}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <a
                      key={href}
                      href={href}
                      onClick={closeMoreMenu}
                      className="group flex w-full items-center justify-between rounded-3xl border border-border/50 bg-gradient-to-br from-background/90 via-background/80 to-background/60 px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon size={20} />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {description}
                          </span>
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </a>
                  );
                },
              )}
              <div className="flex justify-center pt-2">
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-around items-center h-16">
        {navLinksBase.map(({ href, label, Icon }) => {
          const isActive = currentPath === href;
          return (
            <a
              key={href}
              href={href}
              className={`${linkClasses} ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <Icon size={24} />
              <span className="text-xs">{label}</span>
            </a>
          );
        })}

        <a
          href="/cart"
          className={`${linkClasses} relative ${
            currentPath === "/cart" ? activeClass : inactiveClass
          }`}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span
            className={`text-xs ${
              totalItems > 0 ? "font-bold text-value" : ""
            }`}
          >
            {totalItems > 0 ? totalAmountLabel : cartLabel}
          </span>
        </a>

        {token ? (
          <a
            href="/profile"
            className={`${linkClasses} ${
              currentPath === "/profile" ? activeClass : inactiveClass
            }`}
          >
            <User size={24} />
            <span className="text-xs">{profileLabel}</span>
          </a>
        ) : (
          <button
            onClick={openLoginModal}
            className={`${linkClasses} ${inactiveClass}`}
          >
            <User size={24} />
            <span className="text-xs">{loginLabel}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          aria-expanded={isMoreOpen}
          aria-controls="more-menu"
          className={`${linkClasses} ${
            isMoreOpen ? activeClass : inactiveClass
          }`}
        >
          <MoreHorizontal size={24} />
          <span className="text-xs">{moreLabel}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavbar;

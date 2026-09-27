import type { SupportedLocale } from "./shared";

type Primitive = string | number | boolean | null;
type TranslationBranch =
  | Primitive
  | TranslationBranch[]
  | { [key: string]: TranslationBranch };

type AppTranslationMap = Record<SupportedLocale, TranslationBranch>;

const deTranslations: TranslationBranch = {
  common: {
    languageToggle: {
      deLabel: "DE",
      enLabel: "EN",
      ariaLabel: "Sprache wechseln",
    },
    actions: {
      close: "Schließen",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      save: "Speichern",
      submit: "Absenden",
      edit: "Bearbeiten",
      delete: "Löschen",
      add: "Hinzufügen",
      back: "Zurück",
      continue: "Weiter",
      retry: "Erneut versuchen",
    },
    status: {
      loading: "Wird geladen...",
      error: "Etwas ist schiefgelaufen.",
      success: "Erfolgreich",
    },
    validation: {
      required: "Pflichtfeld",
    },
  },
  navigation: {
    side: {
      home: "Startseite",
      menu: "Speisekarte",
      orderHistory: "Bestellhistorie",
      profile: "Profil",
      login: "Anmelden / Registrieren",
      cart: "Warenkorb",
      quickLinksHeading: "Schnellzugriff",
      about: "Über Uns",
      favorites: "Favoriten",
    },
    bottom: {
      home: "Start",
      menu: "Menü",
      cart: "Warenkorb",
      profile: "Profil",
      login: "Anmelden",
      more: {
        label: "Mehr",
        title: "Mehr",
        closeAria: "Menü schließen",
        loginRequired: "Anmeldung erforderlich",
        favorites: {
          title: "Favoriten",
          description:
            "Speichere Lieblingsgerichte und greife schnell darauf zu.",
        },
        orders: {
          title: "Bestellungen",
          description:
            "Verfolge vergangene Bestellungen und ihren aktuellen Status.",
        },
        about: {
          title: "Über Uns",
          description: "Lerne unser Team, unsere Werte und unsere Story kennen.",
        },
      },
    },
    desktop: {
      deliverTo: "Lieferung an",
      selectAddress: "Adresse wählen",
      help: "Hilfe benötigt?",
    },
    mobile: {
      deliverTo: "Lieferung an",
      selectAddress: "Adresse wählen",
      cancelSearch: "Abbrechen",
      assistantAria: "Assistent öffnen",
    },
  },
  orderHistory: {
    heading: "Bestellhistorie",
    loading: "Bestellungen werden geladen ...",
    empty: "Keine vergangenen Bestellungen vorhanden.",
    selectPrompt: "Bitte eine Bestellung auswählen, um Details zu sehen.",
    details: {
      title: "Bestellung #{{orderId}}",
      unknownProduct: "Unbekanntes Produkt",
      customizationFallback: "Anpassung",
      noCustomizations: "Keine Anpassungen",
      noteHeading: "Bestellhinweis",
      noNotes: "Keine besonderen Hinweise hinterlegt.",
      defaultPaymentMethod: "Online-Zahlung",
      totalLabel: "Gesamtsumme",
    },
    modal: {
      title: "Bestelldetails",
      titleWithNumber: "Bestelldetails #{{orderId}}",
      closeAria: "Details schließen",
      closeTooltip: "Schließen",
      sectionHeading: "Bestelldetails",
      orderNumber: "Bestell-ID: #{{orderId}}",
      statusPrefix: "Status:",
      totalLabel: "Gesamt",
    },
  },
  home: {
    heroItems: [
      {
        title: "Knusprige Liebe",
        subtitle: "Goldene Chicken Tenders",
        image: "/images/hero-tenders.jpg",
        promo: "Spare 5 €",
        cta: "Jetzt bestellen",
      },
      {
        title: "Burger Himmel",
        subtitle: "Klassischer Crispy Burger",
        image: "/images/hero-burger.jpg",
        promo: "Kombi-Deal",
        cta: "Zur Speisekarte",
      },
    ],
    quickCategories: {
      title: "Schnelle Kategorien",
      items: [
        { name: "Burger", slug: "burgers" },
        { name: "Tenders", slug: "tenders" },
        { name: "Getränke", slug: "drinks" },
        { name: "Beilagen", slug: "sides" },
      ],
    },
    featuredItems: {
      title: "Ausgewählte Klassiker",
      cta: "Alle anzeigen",
      loading: "Ausgewählte Speisen werden geladen ...",
    },
    featuredReviews: {
      title: "Das sagen unsere Gäste",
      subtitle: "Erlebe, warum wir regelmäßig mit 4–5 Sternen bewertet werden.",
      cta: "Speisekarte entdecken",
    },
  },
  menu: {
    heading: "Unsere Speisekarte",
    categoryFallback: "Weitere",
  },
  reviews: {
    button: {
      write: "Bewertung schreiben",
      pending: "Bewertung ausstehend",
      published: "Bewertung abgegeben",
      errorTitle: "Bewertung nicht möglich",
      errorDescription:
        "Bewertungen sind verfügbar, sobald deine Bestellung zugestellt wurde.",
    },
  },
  productDetail: {
    fallbackName: "Produkt",
    ingredients: {
      title: "Zutaten",
    },
    extra: {
      title: "Zusätze",
    },
    quantity: {
      decreaseAria: "Menge verringern",
      increaseAria: "Menge erhöhen",
    },
    addToCart: "In den Warenkorb",
  },
  cart: {
    title: "Dein Warenkorb",
    empty: {
      heading: "Dein Warenkorb ist leer ...",
      subheading: "aber dein Appetit nicht!",
      description:
        "Knusprige Wings, saftige Burger und goldene Fries warten bereits auf dich. Starte jetzt deine kulinarische Auszeit.",
      cta: "Jetzt bestellen",
    },
    mobile: {
      totalLabel: "Gesamt:",
      checkout: "Zur Kasse",
    },
    item: {
      ingredientsLabel: "Zutaten:",
      remove: "Entfernen",
    },
    summary: {
      heading: "Bestellübersicht",
      itemsLabel: "{{count}} Artikel im Warenkorb",
      subtotal: "Zwischensumme",
      deliveryFee: "Liefergebühr",
      total: "Gesamt",
      checkout: "Zur Kasse",
      footer: "Sichere Zahlung & schnelle Lieferung",
    },
  },
};

const enTranslations: TranslationBranch = {
  common: {
    languageToggle: {
      deLabel: "DE",
      enLabel: "EN",
      ariaLabel: "Switch language",
    },
    actions: {
      close: "Close",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      submit: "Submit",
      edit: "Edit",
      delete: "Delete",
      add: "Add",
      back: "Back",
      continue: "Continue",
      retry: "Try again",
    },
    status: {
      loading: "Loading...",
      error: "Something went wrong.",
      success: "Success",
    },
    validation: {
      required: "Required field",
    },
  },
  navigation: {
    side: {
      home: "Home",
      menu: "Menu",
      orderHistory: "Order History",
      profile: "Profile",
      login: "Log In / Sign Up",
      cart: "Cart",
      quickLinksHeading: "Quick links",
      about: "About us",
      favorites: "Favorites",
    },
    bottom: {
      home: "Home",
      menu: "Menu",
      cart: "Cart",
      profile: "Profile",
      login: "Log in",
      more: {
        label: "More",
        title: "More",
        closeAria: "Close menu",
        loginRequired: "Login required",
        favorites: {
          title: "Favorites",
          description: "Save go-to dishes and jump back anytime.",
        },
        orders: {
          title: "Orders",
          description: "Review past orders and see their live status.",
        },
        about: {
          title: "About us",
          description: "Discover our story, mission, and the team behind us.",
        },
      },
    },
    desktop: {
      deliverTo: "Deliver to",
      selectAddress: "Choose address",
      help: "Need help?",
    },
    mobile: {
      deliverTo: "Deliver to",
      selectAddress: "Choose address",
      cancelSearch: "Cancel",
      assistantAria: "Open assistant",
    },
  },
  orderHistory: {
    heading: "Order history",
    loading: "Loading your orders ...",
    empty: "No past orders yet.",
    selectPrompt: "Select an order to see the details.",
    details: {
      title: "Order #{{orderId}}",
      unknownProduct: "Unknown product",
      customizationFallback: "Customization",
      noCustomizations: "No customizations",
      noteHeading: "Order note",
      noNotes: "No additional notes provided.",
      defaultPaymentMethod: "Online payment",
      totalLabel: "Total",
    },
    modal: {
      title: "Order details",
      titleWithNumber: "Order details #{{orderId}}",
      closeAria: "Close details",
      closeTooltip: "Close",
      sectionHeading: "Order overview",
      orderNumber: "Order ID: #{{orderId}}",
      statusPrefix: "Status:",
      totalLabel: "Total",
    },
  },
  home: {
    heroItems: [
      {
        title: "Tender Love",
        subtitle: "Golden chicken tenders",
        image: "/images/hero-tenders.jpg",
        promo: "Save €5",
        cta: "Order now",
      },
      {
        title: "Burger heaven",
        subtitle: "Classic crispy burger",
        image: "/images/hero-burger.jpg",
        promo: "Combo deal",
        cta: "View menu",
      },
    ],
    quickCategories: {
      title: "Quick categories",
      items: [
        { name: "Burgers", slug: "burgers" },
        { name: "Tenders", slug: "tenders" },
        { name: "Drinks", slug: "drinks" },
        { name: "Sides", slug: "sides" },
      ],
    },
    featuredItems: {
      title: "Chef's picks",
      cta: "View all",
      loading: "Loading featured items ...",
    },
    featuredReviews: {
      title: "What our guests say",
      subtitle: "Discover why diners consistently rate us 4–5 stars.",
      cta: "Explore the menu",
    },
  },
  menu: {
    heading: "Our menu",
    categoryFallback: "Other",
  },
  reviews: {
    button: {
      write: "Write a review",
      pending: "Review pending",
      published: "Review submitted",
      errorTitle: "Review unavailable",
      errorDescription:
        "You can leave a review once your order has been delivered.",
    },
  },
  productDetail: {
    fallbackName: "Product",
    ingredients: {
      title: "Ingredients",
    },
    extra: {
      title: "Extras",
    },
    quantity: {
      decreaseAria: "Decrease quantity",
      increaseAria: "Increase quantity",
    },
    addToCart: "Add to cart",
  },
  cart: {
    title: "Your cart",
    empty: {
      heading: "Your cart is empty...",
      subheading: "but your cravings aren’t!",
      description:
        "Crispy chicken, juicy burgers, and golden fries are ready to lift your day. Let’s kick off something delicious.",
      cta: "Start ordering",
    },
    mobile: {
      totalLabel: "Total:",
      checkout: "Proceed to checkout",
    },
    item: {
      ingredientsLabel: "Ingredients:",
      remove: "Remove",
    },
    summary: {
      heading: "Order summary",
      itemsLabel: "{{count}} items in your cart",
      subtotal: "Subtotal",
      deliveryFee: "Delivery fee",
      total: "Total",
      checkout: "Proceed to checkout",
      footer: "Secure payment & fast delivery",
    },
  },
};

export const appTranslations: AppTranslationMap = {
  de: deTranslations,
  en: enTranslations,
};

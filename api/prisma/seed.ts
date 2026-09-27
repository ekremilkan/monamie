import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CategoryTranslationSeed = {
  language: string;
  name: string;
};

type CategorySeed = {
  slug: string;
  translations: CategoryTranslationSeed[];
};

type IngredientSeed = {
  key: string;
  name: string;
  price?: number;
};

type ProductTranslationSeed = {
  language: string;
  name: string;
  description: string;
};

type ProductIngredientSeed = {
  ingredientKey: string;
  isRequired?: boolean;
  isDefaultSelected?: boolean;
};

type ProductSeed = {
  categorySlug: string;
  price: number;
  imageUrl?: string;
  translations: ProductTranslationSeed[];
  ingredients?: ProductIngredientSeed[];
};

// Yeni kategori eklemek için bu listeye bir obje daha eklemeniz yeterli.
const categoryData: CategorySeed[] = [
  {
    slug: "chicken",
    translations: [{ language: "de", name: "Chicken" }],
  },
  {
    slug: "beef-burgers",
    translations: [{ language: "de", name: "Beef Burgers" }],
  },
  {
    slug: "monamie-buckets",
    translations: [{ language: "de", name: "Monamie Buckets" }],
  },
  {
    slug: "chicken-boxes",
    translations: [{ language: "de", name: "Chicken Boxes" }],
  },
  {
    slug: "single-chickens",
    translations: [{ language: "de", name: "Single Chickens" }],
  },
  {
    slug: "grill",
    translations: [{ language: "de", name: "Grill" }],
  },
  {
    slug: "vorspeisen",
    translations: [{ language: "de", name: "Vorspeisen" }],
  },
  {
    slug: "dürüm",
    translations: [{ language: "de", name: "Dürüm" }],
  },
  {
    slug: "finger-food",
    translations: [{ language: "de", name: "Finger Food" }],
  },
  {
    slug: "veggie-menüs",
    translations: [{ language: "de", name: "Veggie Menüs" }],
  },
  {
    slug: "salat",
    translations: [{ language: "de", name: "Salat" }],
  },
  {
    slug: "eiscreme-und-milchshake",
    translations: [{ language: "de", name: "Eiscreme und Milchshake" }],
  },
  {
    slug: "kuchen-und-torten",
    translations: [{ language: "de", name: "Kuchen und Torten" }],
  },
  {
    slug: "getraenke",
    translations: [
      { language: "de", name: "Getränke" },
      { language: "tr", name: "İçecekler" },
    ],
  },
];

// Ingredient'leri key üzerinden eşlemek, ürünleri yazarken tekrar isim girmenizi engeller.
const ingredientData: IngredientSeed[] = [
  { key: "crispyChicken", name: "Crispy Chicken Breast" },
  { key: "freshLettuce", name: "Fresh Lettuce" },
  { key: "slicedTomato", name: "Sliced Tomato" },
  { key: "dillPickles", name: "Dill Pickles" },
  { key: "cheeseSlice", name: "Cheese Slice", price: 0.99 },
];

// Her ürün için bağlı olduğu kategori slug'ını ve çevirilerini belirtin.
const productData: ProductSeed[] = [
  // Vorspeisen kategorisi ürünleri
  {
    categorySlug: "vorspeisen",
    price: 6.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Joghurt",
        description:
          "Cremiger Joghurt, serviert mit frischer Minze und Olivenöl.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "vorspeisen",
    price: 6.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Aci Ezme (Scharfe Soße)​",
        description:
          "Würzige Tomatensoße mit Paprika, Zwiebeln und frischen Kräutern.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "vorspeisen",
    price: 6.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Reis​",
        description: "Fluffiger Langkornreis, perfekt gewürzt und gekocht.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "vorspeisen",
    price: 13.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Halloumi Teller",
        description:
          "Gegrillter Halloumi-Käse, serviert mit frischem Salat und Zitronenscheiben.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "vorspeisen",
    price: 6.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Bulgur",
        description: "Würziger Bulgur mit Tomaten und frischen Kräutern.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  // Grill kategorisi ürünleri
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Adana Kebap (Scharf)​",
        description:
          "Scharfes gehacktes vom Rind am Spieß, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenflügel (Kanat)​",
        description:
          "Schön gegrilltes Hähnchen , Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Urfa Kebab",
        description:
          "Gehacktes vom Rind am Spieß, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenbrustfilet (Tavuk Gögüsü)",
        description:
          "Schön gegrilltes Hähnchenbrust, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 19.0,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Sis Kebab (Schisch Kebab)",
        description:
          "Rinderspieß, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenspieß (Tavuk Sis)​",
        description:
          "Hähnchenstücke am Spieß, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 17.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Köfteteller",
        description:
          "Gegrillte Frikadellen aus Rindfleisch, Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 19.0,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenspieß und Rinderspieß (Tavuk sis ve Kusbasi)",
        description:
          "Mit Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 18.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenspieß und Adana (Tavuk Sis ve Adana)",
        description:
          "Mit Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 19.0,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Rinderspieß und Adana (Kusbasi ve Adana)",
        description:
          "Mit Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 18.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Hähnchenspieß und Köfte (Tavuk Sis ve Köfte)",
        description:
          "Mit Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "grill",
    price: 18.5,
    imageUrl: "/images/adana-kebap.jpg",
    translations: [
      {
        language: "de",
        name: "Adana und Köfte",
        description:
          "Mit Bulgur oder Pommes, als Beilage Joghurt und gemischter Salat, dazu Brot",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  // Desserts kategorisi ürünleri
  {
    categorySlug: "kuchen-und-torten",
    price: 9.5,
    imageUrl: "/images/kunefe.jpg",
    translations: [
      {
        language: "de",
        name: "Künefe",
        description:
          "Warmer Engelshaar-Käse-Dessert in Sirup, garniert mit Pistazien.",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  // Getränke kategorisi ürünleri
  {
    categorySlug: "getraenke",
    price: 3.5,
    imageUrl: "/images/ayran.jpg",
    translations: [
      {
        language: "de",
        name: "Ayran",
        description: "Erfrischendes Joghurtgetränk mit einer Prise Salz.",
      },
      {
        language: "tr",
        name: "Ayran",
        description: "Yoğurtlu, tuzlu soğuk içecek.",
      },
    ],
  },
  //Chicken kategorisi ürünleri
  {
    categorySlug: "chicken",
    price: 13.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "YoYo Menü",
        description:
          "1x YoYo Burger mit Jalapeño und Cheese “L”, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo, ca. 130 g HotWings (2-3 Stk.)",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 13.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "King Wings Menü",
        description:
          "Deep-Fried Chicken Wings (Scharf) ca. 400g (7-10), 1x Klein Pommes oder Wedges",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 9.8,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "BBQ Menü",
        description: "1x BBQ Burger mit Cheese “L”, 1x Clausthalsalat",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 13.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "A1",
        description:
          "HotWings ca. 400g (7-10 Stk.), 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 11.0,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Hallo Halloumi",
        description:
          "1x Halloumi Burger “L”, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 11.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "A2",
        description:
          "5x Crispyfilets, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 14.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "A3",
        description:
          "2x Monamie Burger “L”, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 11.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "A4",
        description:
          "1x Monamie Burger”L”, 1x Klein Pommes oder Wedges, 1x Clausthal Salat, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 12.8,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "B3",
        description:
          "1x Monamie Burger “L”, 2x Crispyfilets, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 13.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Big Mama",
        description:
          "1x Big Mama Burger mit Cheese “XL”, 1x Groß Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 5.0,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Pomwrap",
        description: "1x Knusprige Pommes in einem frischen Wrap",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 13.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Crush Menü",
        description:
          "1x Crush Burger mit Cheese “XL”, 1x Groß Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 15.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Double Crush Menü",
        description:
          "1x Double Crush Burger mit Cheese “XXL”, 1x Groß Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 7.9,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Happy Box",
        description:
          "1x Quick Chicken Burger oder 2x Crispyfilets, 1x Klein Pommes oder Wedges, 1x Überraschung, 1x Caprisonne, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.9,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Chicken-Wrap Menü",
        description:
          "1x Chickenwrap, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.9,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Nugget-Wrap Menü",
        description:
          "1x Nuggetwrap, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.9,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Veggie Twister Menü",
        description:
          "1x Veggie Twister, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 11.0,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Veggie Menü",
        description:
          "1x Veggie Burger “L” mit Cheese, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Filet Burger Menü",
        description:
          "1x Filet Burger(100 Gramm saftiges gegrilltes Filet), 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 11.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Nugget Burger Menü",
        description:
          "1x Nugget Burger “L”, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Red Reaper Menü",
        description:
          "1x Red Reaper Burger(100 Gr. saftiges knusprig-scharfes Filet), 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 10.9,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "BBQ-Wrap Menü",
        description: "1x BBQ-Wrap, 1x Klein Pommes oder Wedges 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  {
    categorySlug: "chicken",
    price: 9.5,
    imageUrl: "/images/chicken-burger.jpg",
    translations: [
      {
        language: "de",
        name: "Geflügel-Bratwurst",
        description:
          "1x Geflügel-Bratwurst mit würziger Currysauce, 1x Klein Pommes oder Wedges, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
    ],
  },
  //Beef Burgers kategorisi
  {
    categorySlug: "beef-burgers",
    price: 8.8,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Beef Burger",
        description:
          "1x Beef Burger “L” (100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Klein Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.9,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Double Cheeseburger",
        description:
          "1x Beef Burger mit Cheese “XL” (2x 100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.5,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Double Beef Burger",
        description:
          "1x Beef Burger “XL” (2x 100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.5,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Royal Beef Burger",
        description:
          "1x Beef Burger “XL” (180 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 9.5,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Cheeseburger",
        description:
          "1x Beef Burger mit Cheese “L” (100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Klein Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.9,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Royal Cheeseburger",
        description:
          "1x Beef Burger mit Cheese (180 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 14.8,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Double Royal Beef Burger",
        description:
          "1x Beef Burger “XXL” (2x 180 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.5,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Chili Beef Menü",
        description:
          "1x Beef Burger mit Jalapeño und Cheese “L” (100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 3x Chili Cheese, 1x Klein Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 12.7,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Beef Wrap",
        description:
          "1x Beef Wrap(100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 15.8,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Double Royal Cheeseburger",
        description:
          "1x Beef Burger mit Cheese “XXL” (2x 180 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Groß Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 14.5,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Bro Beef Burger Menü",
        description:
          "2x Beef Burger “L” (je 100 Gramm saftiges Rindfleisch, frische Tomaten, knackiger Eisbergsalat, Zwiebeln, Gurken und hausgemachte Sauce), 1x Klein Pommes oder Wedges, 1x Ketchup und Mayonnaise",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "beef-burgers",
    price: 24.9,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Rumpsteak",
        description:
          "1x 250 Gramm saftiges gegrilltes Rindfleisch Rumpsteak, 1x Pommes oder Kroketten, 1x Gemischtersalat",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  // Veggie kategorisi ürünleri
  {
    categorySlug: "veggie-menüs",
    price: 11.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Hallo Halloumi",
        description: "1x Halloumi Burger “L”, 1x Pommes Klein, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "veggie-menüs",
    price: 11.0,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Veggie Menü",
        description: "1x Veggie Burger “L”, 1x Pommes Klein, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
  {
    categorySlug: "veggie-menüs",
    price: 10.9,
    imageUrl: "/images/linsensuppe.jpg",
    translations: [
      {
        language: "de",
        name: "Veggie Twister",
        description: "1x Veggie Twister “L”, 1x Pommes Klein, 1x Ketchup/Mayo",
      },
    ],
    ingredients: [
      { ingredientKey: "crispyChicken", isRequired: true },
      { ingredientKey: "freshLettuce" },
      { ingredientKey: "slicedTomato" },
      { ingredientKey: "dillPickles" },
      {
        ingredientKey: "cheeseSlice",
        isRequired: false,
        isDefaultSelected: false,
      },
    ],
  },
];

async function main() {
  console.log("Seeding started...");

  // Önce ilişkili tablolardan başlayarak temizle
  await prisma.productIngredient.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log("Previous data deleted.");

  const categoryMap = new Map<string, number>();
  for (const category of categoryData) {
    const created = await prisma.category.create({
      data: {
        slug: category.slug,
        translations: {
          create: category.translations,
        },
      },
    });
    categoryMap.set(category.slug, created.id);
  }
  console.log(`Categories created: ${categoryMap.size}`);

  const ingredientMap = new Map<string, number>();
  for (const ingredient of ingredientData) {
    const created = await prisma.ingredient.create({
      data: {
        name: ingredient.name,
        price: ingredient.price ?? undefined,
      },
    });
    ingredientMap.set(ingredient.key, created.id);
  }
  console.log(`Ingredients created: ${ingredientMap.size}`);

  for (const product of productData) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Kategori slug'ı bulunamadı: ${product.categorySlug}. Önce categoryData listesine ekleyin.`
      );
    }

    await prisma.product.create({
      data: {
        price: product.price,
        imageUrl: product.imageUrl,
        category: { connect: { id: categoryId } },
        translations: {
          create: product.translations,
        },
        ingredients:
          product.ingredients && product.ingredients.length > 0
            ? {
                create: product.ingredients.map((ingredient) => {
                  const ingredientId = ingredientMap.get(
                    ingredient.ingredientKey
                  );
                  if (!ingredientId) {
                    throw new Error(
                      `Ingredient key bulunamadı: ${ingredient.ingredientKey}. Önce ingredientData listesine ekleyin.`
                    );
                  }
                  return {
                    ingredient: { connect: { id: ingredientId } },
                    isRequired: ingredient.isRequired ?? true,
                    isDefaultSelected: ingredient.isDefaultSelected ?? true,
                  };
                }),
              }
            : undefined,
      },
    });
  }

  console.log(`Products created: ${productData.length}`);

  // Dummy kullanıcı, sipariş ve yorumlar ekle
  const dummyUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Tufan Erdemli",
      emailVerified: true,
    }
  });

  // Rastgele 3 ürünü al ve yorum ekle
  const products = await prisma.product.findMany({ take: 3 });
  
  const reviewsData = [
    {
      comment: "Das Essen war fantastisch und die Lieferung super schnell! Kann ich nur weiterempfehlen.",
      rating: 5,
    },
    {
      comment: "Sehr leckerer Burger, knusprige Pommes. Alles noch heiß bei Lieferung. Top!",
      rating: 5,
    },
    {
      comment: "Immer wieder gerne. Die Qualität ist konstant hoch und das Personal sehr freundlich.",
      rating: 4,
    }
  ];

  for (let i = 0; i < Math.min(products.length, reviewsData.length); i++) {
    const dummyOrder = await prisma.order.create({
      data: {
        totalPrice: 45.00,
        userId: dummyUser.id,
        orderNumber: `ORD-123456-${i}`,
        status: "DELIVERED",
        deliveredAt: new Date(),
      }
    });

    await prisma.review.create({
      data: {
        userId: dummyUser.id,
        orderId: dummyOrder.id,
        productId: products[i].id,
        rating: reviewsData[i].rating,
        comment: reviewsData[i].comment,
        status: "published",
        approvedAt: new Date(),
      }
    });
  }
  console.log("Dummy reviews created.");
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import prisma from "../lib/prisma";

const productInclude = {
  translations: true,
  category: {
    include: { translations: true },
  },
  ingredients: {
    include: { ingredient: true },
  },
};

interface ProductTranslationInput {
  language: string;
  name: string;
  description: string;
}

interface ProductIngredientInput {
  ingredientId: number;
  isRequired?: boolean;
  isDefaultSelected?: boolean;
}

interface ProductBody {
  categoryId?: number;
  price?: number | string;
  imageUrl?: string | null;
  translations?: ProductTranslationInput[];
  ingredients?: ProductIngredientInput[];
}

const parsePrice = (price: number | string): Prisma.Decimal | null => {
  const numeric =
    typeof price === "string" ? Number.parseFloat(price) : Number(price);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return new Prisma.Decimal(numeric.toFixed(2));
};

const normalizeTranslations = (
  translations: unknown
): ProductTranslationInput[] | null => {
  if (!Array.isArray(translations)) {
    return null;
  }

  const sanitized: ProductTranslationInput[] = [];

  for (const item of translations) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as any).language !== "string" ||
      typeof (item as any).name !== "string" ||
      typeof (item as any).description !== "string"
    ) {
      return null;
    }

    const language = (item as any).language.trim();
    const name = (item as any).name.trim();
    const description = (item as any).description.trim();

    if (!language || !name || !description) {
      return null;
    }

    sanitized.push({
      language,
      name,
      description,
    });
  }

  return sanitized;
};

const normalizeIngredients = (
  ingredients: unknown
): ProductIngredientInput[] | null => {
  if (ingredients === undefined) {
    return [];
  }

  if (!Array.isArray(ingredients)) {
    return null;
  }

  const sanitized: ProductIngredientInput[] = [];

  for (const item of ingredients) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const ingredientId = (item as any).ingredientId;
    if (
      typeof ingredientId !== "number" ||
      Number.isNaN(ingredientId) ||
      ingredientId <= 0
    ) {
      return null;
    }

    sanitized.push({
      ingredientId,
      isRequired:
        typeof (item as any).isRequired === "boolean"
          ? (item as any).isRequired
          : true,
      isDefaultSelected:
        typeof (item as any).isDefaultSelected === "boolean"
          ? (item as any).isDefaultSelected
          : true,
    });
  }

  return sanitized;
};

export const listProducts = async (req: Request, res: Response) => {
  const { categoryId } = req.query;

  const where: Prisma.ProductWhereInput = {};
  if (categoryId !== undefined) {
    const parsed = Number.parseInt(String(categoryId), 10);
    if (Number.isNaN(parsed)) {
      res.status(400).json({ error: "Ungültige Kategorie-ID im Filter" });
      return;
    }
    where.categoryId = parsed;
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });

    res.json(products);
  } catch (error) {
    console.error("Failed to list products:", error);
    res.status(500).json({ error: "Produkte konnten nicht geladen werden." });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Produkt-ID" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      res.status(404).json({ error: "Produkt nicht gefunden" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({ error: "Produkt konnte nicht geladen werden." });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { categoryId, price, imageUrl, translations, ingredients } =
    req.body as ProductBody;

  if (typeof categoryId !== "number" || Number.isNaN(categoryId)) {
    res.status(400).json({ error: "categoryId ist erforderlich" });
    return;
  }

  if (price === undefined) {
    res.status(400).json({ error: "price ist erforderlich" });
    return;
  }

  const parsedPrice = parsePrice(price);
  if (!parsedPrice) {
    res.status(400).json({ error: "Ungültiger Preis" });
    return;
  }

  const normalizedTranslations = normalizeTranslations(translations);
  if (!normalizedTranslations || normalizedTranslations.length === 0) {
    res.status(400).json({
      error:
        "Mindestens eine gültige Übersetzung (language, name, description) ist nötig",
    });
    return;
  }

  const normalizedIngredients = normalizeIngredients(ingredients);
  if (normalizedIngredients === null) {
    res.status(400).json({
      error:
        "ingredients muss ein Array aus { ingredientId, isRequired?, isDefaultSelected? } sein",
    });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: {
        price: parsedPrice,
        imageUrl: imageUrl ?? null,
        category: { connect: { id: categoryId } },
        translations: {
          create: normalizedTranslations.map((translation) => ({
            language: translation.language,
            name: translation.name,
            description: translation.description,
          })),
        },
        ingredients:
          normalizedIngredients && normalizedIngredients.length > 0
            ? {
                create: normalizedIngredients.map((ingredient) => ({
                  ingredient: { connect: { id: ingredient.ingredientId } },
                  isRequired: ingredient.isRequired ?? true,
                  isDefaultSelected: ingredient.isDefaultSelected ?? true,
                })),
              }
            : undefined,
      },
      include: productInclude,
    });

    res.status(201).json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      res.status(400).json({ error: "Ungültige Relation (Kategorie/Zutat)" });
      return;
    }

    console.error("Failed to create product:", error);
    res.status(500).json({ error: "Produkt konnte nicht erstellt werden." });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Produkt-ID" });
    return;
  }

  const { categoryId, price, imageUrl, translations, ingredients } =
    req.body as ProductBody;

  if (
    categoryId === undefined &&
    price === undefined &&
    imageUrl === undefined &&
    translations === undefined &&
    ingredients === undefined
  ) {
    res.status(400).json({ error: "Keine Daten zum Aktualisieren übermittelt" });
    return;
  }

  const normalizedTranslations =
    translations !== undefined ? normalizeTranslations(translations) : null;
  if (translations !== undefined && normalizedTranslations === null) {
    res.status(400).json({
      error:
        "Übersetzungen müssen als Array mit language, name und description gesendet werden",
    });
    return;
  }

  const normalizedIngredients =
    ingredients !== undefined ? normalizeIngredients(ingredients) : null;
  if (ingredients !== undefined && normalizedIngredients === null) {
    res.status(400).json({
      error:
        "ingredients muss ein Array aus { ingredientId, isRequired?, isDefaultSelected? } sein",
    });
    return;
  }

  let parsedPrice: Prisma.Decimal | undefined;
  if (price !== undefined) {
    const candidate = parsePrice(price);
    if (!candidate) {
      res.status(400).json({ error: "Ungültiger Preis" });
      return;
    }
    parsedPrice = candidate;
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct) {
      res.status(404).json({ error: "Produkt nicht gefunden" });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.ProductUpdateInput = {};

      if (parsedPrice !== undefined) {
        updateData.price = parsedPrice;
      }

      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl === null ? null : imageUrl;
      }

      if (categoryId !== undefined) {
        if (typeof categoryId !== "number" || Number.isNaN(categoryId)) {
          throw new Error("INVALID_CATEGORY");
        }
        updateData.category = { connect: { id: categoryId } };
      }

      if (Object.keys(updateData).length > 0) {
        await tx.product.update({
          where: { id },
          data: updateData,
        });
      }

      if (normalizedTranslations) {
        const languages = normalizedTranslations.map((t) => t.language);

        for (const translation of normalizedTranslations) {
          await tx.productTranslation.upsert({
            where: {
              productId_language: {
                productId: id,
                language: translation.language,
              },
            },
            update: {
              name: translation.name,
              description: translation.description,
            },
            create: {
              productId: id,
              language: translation.language,
              name: translation.name,
              description: translation.description,
            },
          });
        }

        await tx.productTranslation.deleteMany({
          where: {
            productId: id,
            language: { notIn: languages },
          },
        });
      }

      if (normalizedIngredients) {
        await tx.productIngredient.deleteMany({ where: { productId: id } });

        if (normalizedIngredients.length > 0) {
          for (const ingredient of normalizedIngredients) {
            await tx.productIngredient.create({
              data: {
                productId: id,
                ingredientId: ingredient.ingredientId,
                isRequired: ingredient.isRequired ?? true,
                isDefaultSelected: ingredient.isDefaultSelected ?? true,
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: productInclude,
      });
    });

    if (!updated) {
      res.status(404).json({ error: "Produkt nicht gefunden" });
      return;
    }

    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CATEGORY") {
      res.status(400).json({ error: "Ungültige Kategorie-ID" });
      return;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      res.status(400).json({ error: "Ungültige Relation (Kategorie/Zutat)" });
      return;
    }

    console.error("Failed to update product:", error);
    res
      .status(500)
      .json({ error: "Produkt konnte nicht aktualisiert werden." });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Produkt-ID" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: "Produkt nicht gefunden" });
      return;
    }

    if (product._count.orderItems > 0) {
      res.status(409).json({
        error:
          "Produkt kann nicht gelöscht werden, solange Bestellpositionen vorhanden sind",
      });
      return;
    }

    if (product._count.reviews > 0) {
      res.status(409).json({
        error:
          "Produkt kann nicht gelöscht werden, solange Bewertungen vorhanden sind",
      });
      return;
    }

    await prisma.$transaction([
      prisma.productIngredient.deleteMany({ where: { productId: id } }),
      prisma.productTranslation.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ error: "Produkt konnte nicht gelöscht werden." });
  }
};

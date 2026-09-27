import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

const categoryInclude = {
  translations: true,
  _count: {
    select: { products: true },
  },
};

interface CategoryTranslationInput {
  language: string;
  name: string;
}

interface CategoryBody {
  slug?: string;
  translations?: CategoryTranslationInput[];
}

const normalizeTranslations = (
  translations: unknown
): CategoryTranslationInput[] | null => {
  if (!Array.isArray(translations)) {
    return null;
  }

  const sanitized: CategoryTranslationInput[] = [];

  for (const item of translations) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as any).language !== "string" ||
      typeof (item as any).name !== "string"
    ) {
      return null;
    }

    const language = (item as any).language.trim();
    const name = (item as any).name.trim();

    if (!language || !name) {
      return null;
    }

    sanitized.push({
      language,
      name,
    });
  }

  return sanitized;
};

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: categoryInclude,
    });

    res.json(categories);
  } catch (error) {
    console.error("Failed to list categories:", error);
    res.status(500).json({ error: "Kategorien konnten nicht geladen werden." });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Kategorie-ID" });
    return;
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: categoryInclude,
    });

    if (!category) {
      res.status(404).json({ error: "Kategorie nicht gefunden" });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    res.status(500).json({ error: "Kategorie konnte nicht geladen werden." });
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { slug, translations } = req.body as CategoryBody;

  if (!slug || typeof slug !== "string") {
    res.status(400).json({ error: "Slug ist erforderlich" });
    return;
  }

  const normalizedTranslations = normalizeTranslations(translations);
  if (!normalizedTranslations || normalizedTranslations.length === 0) {
    res.status(400).json({
      error: "Mindestens eine gültige Übersetzung (language, name) ist nötig",
    });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: {
        slug: slug.trim(),
        translations: {
          create: normalizedTranslations.map((translation) => ({
            language: translation.language,
            name: translation.name,
          })),
        },
      },
      include: categoryInclude,
    });

    res.status(201).json(category);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res
        .status(409)
        .json({ error: "Slug oder Übersetzung bereits vorhanden" });
      return;
    }

    console.error("Failed to create category:", error);
    res.status(500).json({ error: "Kategorie konnte nicht erstellt werden." });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Kategorie-ID" });
    return;
  }

  const { slug, translations } = req.body as CategoryBody;

  if (!slug && !translations) {
    res.status(400).json({ error: "Keine Daten zum Aktualisieren übermittelt" });
    return;
  }

  const normalizedTranslations =
    translations !== undefined ? normalizeTranslations(translations) : null;

  if (translations !== undefined && !normalizedTranslations) {
    res.status(400).json({
      error: "Übersetzungen müssen als Array mit language und name gesendet werden",
    });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (slug) {
        await tx.category.update({
          where: { id },
          data: { slug: slug.trim() },
        });
      } else {
        const existing = await tx.category.findUnique({ where: { id } });
        if (!existing) {
          return null;
        }
      }

      if (normalizedTranslations) {
        const languages = normalizedTranslations.map((t) => t.language);

        for (const translation of normalizedTranslations) {
          await tx.categoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId: id,
                language: translation.language,
              },
            },
            update: { name: translation.name },
            create: {
              categoryId: id,
              language: translation.language,
              name: translation.name,
            },
          });
        }

        await tx.categoryTranslation.deleteMany({
          where: {
            categoryId: id,
            language: { notIn: languages },
          },
        });
      }

      return tx.category.findUnique({
        where: { id },
        include: categoryInclude,
      });
    });

    if (!result) {
      res.status(404).json({ error: "Kategorie nicht gefunden" });
      return;
    }

    res.json(result);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      res
        .status(error.code === "P2002" ? 409 : 404)
        .json(
          error.code === "P2002"
            ? { error: "Slug oder Übersetzung bereits vorhanden" }
            : { error: "Kategorie nicht gefunden" }
        );
      return;
    }

    console.error("Failed to update category:", error);
    res
      .status(500)
      .json({ error: "Kategorie konnte nicht aktualisiert werden." });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Ungültige Kategorie-ID" });
    return;
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      res.status(404).json({ error: "Kategorie nicht gefunden" });
      return;
    }

    if (category._count.products > 0) {
      res.status(409).json({
        error:
          "Kategorie kann nicht gelöscht werden, solange Produkte zugeordnet sind",
      });
      return;
    }

    await prisma.$transaction([
      prisma.categoryTranslation.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } }),
    ]);

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete category:", error);
    res
      .status(500)
      .json({ error: "Kategorie konnte nicht gelöscht werden." });
  }
};

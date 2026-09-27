export interface CheckoutCartLineInput {
  id: unknown;
  quantity: unknown;
  selectedIngredients?: unknown;
}

export interface CheckoutProduct {
  id: number;
  price: number | string | { toString(): string };
  ingredients: {
    ingredientId: number;
    isRequired: boolean;
    ingredient: { price: number | string | { toString(): string } | null };
  }[];
}

export interface CalculatedOrderLine {
  productId: number;
  quantity: number;
  unitPriceCents: number;
  selectedIngredientIds: number[];
}

export interface CheckoutTotals {
  lines: CalculatedOrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

const DELIVERY_FEE_CENTS = 299;
const MAX_CART_LINES = 50;
const MAX_QUANTITY_PER_LINE = 99;

const toCents = (value: number | string | { toString(): string }): number => {
  const amount = Number(value.toString());
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid price");
  }
  return Math.round(amount * 100);
};

export const calculateCheckout = (
  input: unknown,
  products: CheckoutProduct[],
): CheckoutTotals => {
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > MAX_CART_LINES
  ) {
    throw new Error("Invalid cart");
  }

  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );
  const lines = input.map((rawLine): CalculatedOrderLine => {
    if (!rawLine || typeof rawLine !== "object") {
      throw new Error("Invalid cart line");
    }

    const line = rawLine as CheckoutCartLineInput;
    if (
      !Number.isSafeInteger(line.id) ||
      !Number.isSafeInteger(line.quantity) ||
      (line.quantity as number) < 1 ||
      (line.quantity as number) > MAX_QUANTITY_PER_LINE
    ) {
      throw new Error("Invalid product or quantity");
    }

    const product = productsById.get(line.id as number);
    if (!product) {
      throw new Error("Product not found");
    }

    const selectedIngredients = line.selectedIngredients ?? [];
    if (
      !Array.isArray(selectedIngredients) ||
      !selectedIngredients.every((id) => Number.isSafeInteger(id) && id > 0) ||
      new Set(selectedIngredients).size !== selectedIngredients.length
    ) {
      throw new Error("Invalid selected ingredients");
    }

    const productIngredients = new Map(
      product.ingredients.map((entry) => [entry.ingredientId, entry]),
    );
    let unitPriceCents = toCents(product.price);

    for (const ingredientId of selectedIngredients as number[]) {
      const entry = productIngredients.get(ingredientId);
      if (!entry) {
        throw new Error("Ingredient is not available for this product");
      }
      if (!entry.isRequired && entry.ingredient.price !== null) {
        unitPriceCents += toCents(entry.ingredient.price);
      }
    }

    return {
      productId: product.id,
      quantity: line.quantity as number,
      unitPriceCents,
      selectedIngredientIds: selectedIngredients as number[],
    };
  });

  const subtotalCents = lines.reduce(
    (total, line) => total + line.unitPriceCents * line.quantity,
    0,
  );

  return {
    lines,
    subtotalCents,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    totalCents: subtotalCents + DELIVERY_FEE_CENTS,
  };
};

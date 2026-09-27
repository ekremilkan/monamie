import { describe, expect, it } from "vitest";
import { getCartItemTotal, getCartSubtotal } from "../lib/cartPricing";

describe("cart pricing", () => {
  it("includes selected paid extras and quantity", () => {
    const item = {
      price: "10.00",
      quantity: 2,
      selectedIngredients: [2, 3],
      ingredients: [
        { ingredientId: 2, isRequired: false, ingredient: { price: "1.25" } },
        { ingredientId: 3, isRequired: true, ingredient: { price: null } },
        { ingredientId: 4, isRequired: false, ingredient: { price: "2.00" } },
      ],
    };

    expect(getCartItemTotal(item)).toBe(22.5);
    expect(getCartSubtotal([item])).toBe(22.5);
  });
});

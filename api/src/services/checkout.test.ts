import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckout } from "./checkout";

const products = [
  {
    id: 1,
    price: "10.00",
    ingredients: [
      { ingredientId: 2, isRequired: false, ingredient: { price: "1.25" } },
      { ingredientId: 3, isRequired: true, ingredient: { price: null } },
    ],
  },
];

test("calculates server-side item, selected extra, and delivery prices", () => {
  const result = calculateCheckout(
    [{ id: 1, quantity: 2, selectedIngredients: [2, 3] }],
    products,
  );

  assert.deepEqual(result.lines[0], {
    productId: 1,
    quantity: 2,
    unitPriceCents: 1125,
    selectedIngredientIds: [2, 3],
  });
  assert.equal(result.subtotalCents, 2250);
  assert.equal(result.totalCents, 2549);
});

test("rejects invalid quantities", () => {
  assert.throws(
    () => calculateCheckout([{ id: 1, quantity: -1 }], products),
    /quantity/,
  );
});

test("rejects ingredients that do not belong to the product", () => {
  assert.throws(
    () =>
      calculateCheckout(
        [{ id: 1, quantity: 1, selectedIngredients: [999] }],
        products,
      ),
    /Ingredient/,
  );
});

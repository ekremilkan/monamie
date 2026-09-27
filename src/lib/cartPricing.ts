export interface CartPriceInput {
  price: string | number;
  quantity: number;
  selectedIngredients: number[];
  ingredients: {
    ingredientId: number;
    isRequired: boolean;
    ingredient: { price: string | null };
  }[];
}

export const DELIVERY_FEE = 2.99;

export const getCartItemTotal = (item: CartPriceInput): number => {
  const selectedIngredients = new Set(item.selectedIngredients);
  const extras = item.ingredients.reduce((total, entry) => {
    if (
      !entry.isRequired &&
      selectedIngredients.has(entry.ingredientId) &&
      entry.ingredient.price !== null
    ) {
      return total + Number(entry.ingredient.price);
    }
    return total;
  }, 0);

  return (Number(item.price) + extras) * item.quantity;
};

export const getCartSubtotal = (items: CartPriceInput[]): number =>
  items.reduce((total, item) => total + getCartItemTotal(item), 0);

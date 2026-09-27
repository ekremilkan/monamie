// Bu dosya, projemizdeki tüm ortak tiplerin evi olacak.

export interface Ingredient {
  id: number;
  name: string;
  price: string | null;
}

export interface ProductIngredient {
  ingredient: Ingredient;
  ingredientId: number;
  isRequired: boolean;
  isDefaultSelected: boolean;
}

// ProductTranslation'ı ayrı bir tip olarak tanımlayıp export ediyoruz.
export interface ProductTranslation {
  name: string;
  description: string;
}

export interface Product {
  id: number;
  price: string;
  imageUrl: string | null;
  // Artık export ettiğimiz ProductTranslation tipini kullanıyoruz.
  translations: ProductTranslation[];
  category: { translations: { name: string }[] };
  ingredients: ProductIngredient[];
}

export type OrderItemProduct = Omit<Product, "category"> & {
  category?: Product["category"];
};

export interface Address {
  id: number;
  street: string;
  city: string;
  zipCode: string;
  details: string | null;
  userId: number;
  title?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
}

export interface OrderItem {
  quantity: number;
  priceAtPurchase: string;
  selectedIngredientIds: number[];
  product: OrderItemProduct;
}

export type OrderStatus =
  | "pending_payment"
  | "order_received"
  | "processing"
  | "preparing"
  | "shipped"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  createdAt: string;
  totalPrice: string;
  paymentMethod: string;
  status: OrderStatus;
  orderNumber?: string;
  deliveredAt?: string | null;
  items: OrderItem[];
}

export interface PaymentMethod {
  id: number;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

import React from "react";
import { Button } from "./ui/button";
import { CheckCircle2 } from "lucide-react";

const OrderSuccessPage: React.FC = () => {
  return (
    <div className="text-foreground max-w-lg mx-auto text-center flex flex-col items-center justify-center min-h-[70vh]">
      <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="font-heading text-4xl font-bold">Thank You!</h1>
      <p className="text-muted mt-2 text-lg">
        Your order has been placed successfully.
      </p>
      <p className="text-muted text-sm mt-4">
        You can check the status of your order in the "Order History" section.
      </p>
      <div className="flex gap-4 mt-8">
        <a href="/order-history">
          <Button variant="outline">View Orders</Button>
        </a>
        <a href="/">
          <Button>Continue Shopping</Button>
        </a>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

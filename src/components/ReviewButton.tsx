import React from "react";
import { Button } from "./ui/button";
import { MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts";

interface ReviewButtonProps {
  orderId: number;
  orderStatus: string;
  hasReview: boolean;
  reviewStatus?: string | null;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

const ReviewButton: React.FC<ReviewButtonProps> = ({
  orderId,
  orderStatus,
  hasReview,
  reviewStatus,
  onClick,
  loading = false,
  className,
}) => {
  const { t } = useLanguage();
  const writeLabel = t<string>("reviews.button.write");
  const errorTitle = t<string>("reviews.button.errorTitle");
  const errorDescription = t<string>("reviews.button.errorDescription");
  const publishedLabel = t<string>("reviews.button.published");
  const pendingLabel = t<string>("reviews.button.pending");
  const handleClick = () => {
    if (orderStatus !== "delivered") {
      toast.error(errorTitle, {
        description: errorDescription,
      });
      return;
    }
    onClick();
  };

  // Sipariş teslim edilmemişse
  if (orderStatus !== "delivered") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={false}
        className={cn(
          "text-xs opacity-60 sm:h-9 sm:px-4 sm:text-sm",
          className
        )}
        data-order-id={orderId}
      >
        <MessageSquare size={12} className="mr-1" />
        {writeLabel}
      </Button>
    );
  }

  // Daha önce yorum yapılmışsa
  if (hasReview) {
    const buttonText =
      reviewStatus === "published"
        ? publishedLabel
        : reviewStatus === "pending"
        ? pendingLabel
        : publishedLabel;

    return (
      <Button
        variant="outline"
        size="sm"
        disabled={true}
        className={cn(
          "text-xs bg-green-50 text-green-700 border-green-200 cursor-not-allowed sm:h-9 sm:px-4 sm:text-sm",
          className
        )}
        data-order-id={orderId}
      >
        <CheckCircle size={12} className="mr-1" />
        {buttonText}
      </Button>
    );
  }

  // Yorum yapılabilir durumda
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 sm:h-9 sm:px-4 sm:text-sm",
        className
      )}
      data-order-id={orderId}
    >
      <MessageSquare size={12} className="mr-1" />
      {writeLabel}
    </Button>
  );
};

export default ReviewButton;

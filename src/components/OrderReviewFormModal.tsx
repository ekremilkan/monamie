import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";

interface OrderReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: ({ rating, comment }: { rating: number; comment: string }) => Promise<void>;
  orderId: number;
  loading?: boolean;
}

const OrderReviewFormModal: React.FC<OrderReviewFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  orderId,
  loading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      return;
    }
    await onSubmit({ rating, comment });
    // Form'u temizle
    setRating(0);
    setComment("");
    setHoveredStar(0);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= (hoveredStar || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
          className={`p-1 transition-colors ${
            isFilled ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400`}
        >
          <Star size={24} fill={isFilled ? "currentColor" : "none"} />
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">Bestellung bewerten</DialogTitle>
            <DialogDescription>
              Bewerten Sie Ihre Bestellung #{orderId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Rating Section */}
            <div className="space-y-2">
              <Label htmlFor="rating" className="text-sm font-medium">
                Wie würden Sie Ihre Bestellung bewerten? *
              </Label>
              <div className="flex gap-1">{renderStars()}</div>
              {rating === 0 && (
                <p className="text-xs text-red-500">Bitte geben Sie eine Bewertung ab</p>
              )}
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-medium">
                Kommentar (optional)
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Teilen Sie Ihre Erfahrungen mit dieser Bestellung..."
                className="min-h-[100px] max-h-[200px]"
                maxLength={500}
              />
              <p className="text-xs text-muted">
                {comment.length}/500 Zeichen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                'Bewertung absenden'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderReviewFormModal;
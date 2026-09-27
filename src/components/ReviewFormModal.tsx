import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, X } from 'lucide-react';

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string }) => void;
  productName: string;
  loading?: boolean;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  productName,
  loading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      return;
    }
    onSubmit({ rating, comment });
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setHoveredStar(0);
    onClose();
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
          className="p-1 transition-colors hover:scale-110"
          disabled={loading}
        >
          <Star
            className={`w-8 h-8 ${
              isFilled
                ? 'fill-orange-500 text-orange-500'
                : 'fill-gray-200 text-gray-200'
            } transition-all duration-200`}
          />
        </button>
      );
    });
  };

  const isFormValid = rating > 0 && comment.trim().length > 0 && comment.length <= 500;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Bewertung für {productName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Teilen Sie Ihre Erfahrungen mit diesem Produkt
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm font-medium text-foreground">
              Wie viele Sterne geben Sie?
            </Label>
            <div className="flex justify-center space-x-1 py-2">
              {renderStars()}
            </div>
            {rating === 0 && (
              <p className="text-sm text-destructive text-center">
                Bitte wählen Sie eine Bewertung
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium text-foreground">
              Ihr Kommentar
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Teilen Sie Ihre Erfahrungen mit diesem Produkt..."
              className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
              maxLength={500}
              disabled={loading}
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{comment.length}/500 Zeichen</span>
              {comment.length === 500 && (
                <span className="text-destructive">Maximale Länge erreicht</span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-border text-foreground hover:bg-secondary"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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

export default ReviewFormModal;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Star, User } from 'lucide-react';

interface OrderedProduct {
  id: number;
  name: string;
}

interface ReviewCardProps {
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  orderedProducts: OrderedProduct[];
  createdAt: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  userName,
  userAvatar,
  rating,
  comment,
  orderedProducts,
  createdAt,
}) => {
  const [showProducts, setShowProducts] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-orange-500 text-orange-500'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                {userName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex">{renderStars()}</div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground mb-4 leading-relaxed">{comment}</p>
        
        {orderedProducts.length > 0 && (
          <div className="border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProducts(!showProducts)}
              className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
            >
              {showProducts ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Bestellte Produkte ausblenden
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Bestellte Produkte anzeigen ({orderedProducts.length})
                </>
              )}
            </Button>
            
            {showProducts && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {orderedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="text-sm text-muted-foreground bg-secondary/50 rounded px-3 py-2"
                  >
                    {product.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;

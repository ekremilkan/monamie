import React from "react";
import { useReview } from "@/contexts/ReviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewSectionProps {
  title?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ title = "Kundenbewertungen" }) => {
  const { reviewStatuses } = useReview();

  if (!reviewStatuses.length) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-orange-500" />
          <CardTitle className="text-xl font-semibold text-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviewStatuses.map((status) => (
          <div
            key={status.orderId}
            className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm text-muted-foreground"
          >
            <span>Bestellung #{status.orderId}</span>
            <span>
              {status.hasReview
                ? status.reviewStatus === "published"
                  ? "Veröffentlicht"
                  : "In Prüfung"
                : "Noch keine Bewertung"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReviewSection;

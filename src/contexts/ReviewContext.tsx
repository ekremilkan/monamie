import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";

interface ReviewStatus {
  orderId: number;
  hasReview: boolean;
  reviewStatus?: string | null;
}

interface ReviewContextType {
  reviewStatuses: ReviewStatus[];
  checkOrderReviewStatus: (orderId: number) => Promise<ReviewStatus>;
  submitOrderReview: (orderId: number, rating: number, comment?: string) => Promise<void>;
  refreshReviewStatus: (orderId: number) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
};

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviewStatuses, setReviewStatuses] = useState<ReviewStatus[]>([]);
  // ... existing code ...

  const checkOrderReviewStatus = useCallback(async (orderId: number): Promise<ReviewStatus> => {
    const url = `${import.meta.env.PUBLIC_API_URL}/api/reviews/order/${orderId}/status`;
    const token = localStorage.getItem('mon-amie-chicken-token');
    try {
      console.log('[Review] checkOrderReviewStatus: request', {
        url,
        method: 'GET',
        headers: {
          Authorization: token ? 'Bearer <redacted>' : 'Bearer <missing>',
          'Content-Type': 'application/json',
        },
        orderId,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let bodyText: string | undefined;
        let message = 'Failed to check review status';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            bodyText = JSON.stringify(errorData);
            message = (errorData?.message as string) || message;
          } else {
            bodyText = await response.text();
          }
        } catch {
          // body parse errors are ignored
        }

        console.warn('[Review] checkOrderReviewStatus: response not ok', {
          status: response.status,
          statusText: response.statusText,
          message,
          body: bodyText,
          url,
        });

        throw new Error(`[${response.status}] ${message}`);
      }

      const data = await response.json();

      console.log('[Review] checkOrderReviewStatus: response ok', {
        status: response.status,
        url,
        data,
      });

      const reviewStatus: ReviewStatus = {
        orderId,
        hasReview: data.hasReview,
        reviewStatus: data.reviewStatus,
      };

      setReviewStatuses(prev => {
        const filtered = prev.filter(status => status.orderId !== orderId);
        return [...filtered, reviewStatus];
      });

      return reviewStatus;
    } catch (error: unknown) {
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError'));

      console.error('[Review] checkOrderReviewStatus: error', {
        error,
        message: error instanceof Error ? error.message : String(error),
        url,
        orderId,
        tokenPresent: Boolean(token),
        publicApiUrl: import.meta.env.PUBLIC_API_URL,
        online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
        networkError: isNetworkError,
      });
      toast.error("Fehler", { description: "Status der Bewertung konnte nicht abgerufen werden" });
      throw error;
    }
  }, []);

  const submitOrderReview = useCallback(async (orderId: number, rating: number, comment?: string) => {
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/reviews/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mon-amie-chicken-token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }

      const data = await response.json();
      
      toast.success("Erfolg", { description: "Ihre Bewertung wurde erfolgreich übermittelt" });

      // Update local state
      setReviewStatuses(prev => {
        const filtered = prev.filter(status => status.orderId !== orderId);
        return [...filtered, {
          orderId,
          hasReview: true,
          reviewStatus: 'pending',
        }];
      });

    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      const description = error instanceof Error ? error.message : "Bewertung konnte nicht übermittelt werden";
      toast.error("Fehler", { description });
      throw error;
    }
  }, []);

  const refreshReviewStatus = useCallback(async (orderId: number) => {
    await checkOrderReviewStatus(orderId);
  }, [checkOrderReviewStatus]);

  const value: ReviewContextType = {
    reviewStatuses,
    checkOrderReviewStatus,
    submitOrderReview,
    refreshReviewStatus,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};
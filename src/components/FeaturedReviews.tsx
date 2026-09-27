import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts";

interface FeaturedReview {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  productName: string;
  productId: number;
  createdAt: string;
}

const FeaturedReviews: React.FC = () => {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale, t } = useLanguage();
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";

  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.PUBLIC_API_URL}/api/reviews/featured?limit=6`
        );
        if (!response.ok) throw new Error("Failed to fetch featured reviews");
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Error fetching featured reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-orange-200 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-8 bg-orange-200 rounded w-64 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-orange-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null; // Hiç yorum yoksa bölümü gösterme
  }

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Star className="w-12 h-12 text-orange-500 fill-current" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t("home.featuredReviews.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("home.featuredReviews.subtitle")}
          </p>
        </div>

        {/* Yorumlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {review.user.name}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "text-orange-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Quote className="w-6 h-6 text-orange-300" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{review.comment}"
                </p>
                <div className="flex items-center justify-between">
                  {/* Ürün adı sadece metin olarak gösterilsin, modal açılmasın */}
                  <span className="text-orange-600 font-medium">
                    {review.productName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString(
                      intlLocale,
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Butonu */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => {
              // Menüye scroll yap
              document.querySelector('#menu-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          >
            {t("home.featuredReviews.cta")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedReviews;

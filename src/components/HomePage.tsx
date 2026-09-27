import React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";
import QuickCategories from "./QuickCategories";
import FeaturedItems from "./FeaturedItems";
import FeaturedReviews from "./FeaturedReviews";
import OrderTrackingSpotlight from "./OrderTrackingSpotlight";
import { useLanguage } from "@/contexts";

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const heroItems = t<Array<{
    title: string;
    subtitle: string;
    image: string;
    promo?: string;
    cta: string;
  }>>("home.heroItems");

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    // Bu ana div artık kısıtlanmadığı için tam genişlikte olacak.
    <div>
      <OrderTrackingSpotlight />
      {/* 1. BÖLÜM: Tam Genişlikli Carousel */}
      <Carousel
        plugins={[plugin.current]}
        className="w-full mt-5"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {heroItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="border-none rounded-2xl overflow-hidden">
                  <CardContent className="relative flex items-center justify-center p-0 h-80">
                    <img
                      src={item.image}
                      alt={item.title}
                      width={573}
                      height={435}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "low"}
                      decoding="async"
                      className="w-full h-full object-cover brightness-75"
                    />
                    <div className="absolute text-center text-primary-foreground p-4">
                      {item.promo && (
                        <span className="bg-accent text-accent-foreground font-bold py-1 px-3 rounded-full text-sm">
                          {item.promo}
                        </span>
                      )}
                      <h2 className="font-heading text-4xl font-bold mt-2">
                        {item.title}
                      </h2>
                      <p className="text-lg">{item.subtitle}</p>
                      <Button className="mt-4">{item.cta}</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* 2. BÖLÜM: Ortalanmış İçerik */}
      {/* Carousel'in altındaki her şey, bu 'container' div'inin içinde olacak. */}
      <div className="w-full mt-8">
        <QuickCategories />
        <FeaturedItems />
        <FeaturedReviews />
      </div>
    </div>
  );
};

export default HomePage;

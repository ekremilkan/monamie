import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChefHat,
  Leaf,
  Sparkles,
  Clock,
  ShieldCheck,
  MapPin,
  CreditCard,
  Instagram,
  Facebook,
} from "lucide-react";

const signatureHighlights = [
  {
    title: "Slow-mariniert & knusprig",
    description:
      "12 saat soslandanmış tavuklarımız özel fırınlarda çıtır kıvama gelir; seramik tabaklarda dumanı üstünde servis ederiz.",
    Icon: ChefHat,
  },
  {
    title: "Regional & saisonal",
    description:
      "Clausthal ve çevresindeki çiftçilerden mevsiminde ürünler alır, taze otlarla harmanlarız. Menü günden güne yaşayan bir defter.",
    Icon: Leaf,
  },
  {
    title: "Daily Specials",
    description:
      "Haftalık temalar, sos barı ve vegan seçenekler her ziyaretinizde yeni bir tat deneyimi sunar.",
    Icon: Sparkles,
  },
];

const kitchenCommitments = [
  {
    title: "Unsere Lebensmittelpolitik",
    description:
      "Kısa tedarik zincirleri, şeffaf içerik bilgisi ve her tabakta dengeli beslenme prensibi.",
  },
  {
    title: "Unsere Grundwerte",
    description:
      "Açık mutfak kültürü, aile sıcaklığı ve her misafirle birebir ilgilenen servis ekibi.",
  },
  {
    title: "Stripe Güvenlik Çatısı",
    description:
      "Stripe Radar, 3D Secure ve PSD2 uyumlu ödeme altyapımızla her sipariş bankacılık standartlarında korunur.",
  },
];

const statHighlights = [
  { value: "2020", label: "Seit Clausthal" },
  { value: "24+", label: "Hausmischungen" },
  { value: "4.8★", label: "Community Rating" },
];

const paymentLogos = [
  { src: "/images/payment-logos/visa.svg", alt: "Visa" },
  { src: "/images/payment-logos/mastercard.svg", alt: "Mastercard" },
];

const teamMembers = [
  {
    name: "Yildirim Ates",
    role: "Ladenbesitzer · Küchenchef",
  },
  {
    name: "Arda Altunkol",
    role: "Personalwesen · Erlebnisdesign",
  },
];

const socialLinks = [
  {
    name: "Instagram",
    handle: "@monamiechicken",
    href: "https://www.instagram.com/monamie_clz/?hl=de",
    Icon: Instagram,
    badge: "143 Takip",
  },
  {
    name: "Facebook",
    handle: "/MonAmieChicken",
    href: "https://www.facebook.com/monamie.clausthal/",
    Icon: Facebook,
    badge: "Topluluk Etkin",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 pb-20">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center bg-card rounded-3xl shadow-subtle px-6 py-12 sm:px-12">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Mon Amie Chicken · Familienrestaurant
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary leading-tight">
            Über Uns
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-xl">
            Şehrin çıtır köşesi: Türk misafirperverliğini Alman disiplinine
            harmanlayan, sıcak ve hızlı bir restoran deneyimi.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {statHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-secondary/70 bg-secondary/30 px-4 py-5 text-center"
              >
                <p className="font-heading text-2xl text-primary">
                  {item.value}
                </p>
                <p className="text-xs text-muted uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/menu">Menüyü keşfet</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/order-history">Sipariş geçmişim</a>
            </Button>
          </div>
          <div className="rounded-3xl border border-secondary/70 bg-secondary/20 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  Sosyal sahnemiz
                </p>
                <h3 className="font-heading text-xl text-foreground">
                  Instagram & Facebook ile mutfaktan canlı kareler
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(({ name, href, Icon }) => (
                  <Button
                    key={name}
                    variant="secondary"
                    asChild
                    className="gap-2"
                  >
                    <a href={href} target="_blank" rel="noreferrer">
                      <Icon className="h-5 w-5 text-primary" />
                      <span>Follow {name}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <img
            src="/images/main.jpg"
            alt="Knusprige Mon Amie Chicken tablosu"
            className="w-full rounded-[32px] object-cover shadow-subtle"
            loading="lazy"
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {signatureHighlights.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="rounded-3xl bg-card p-6 shadow-subtle border border-secondary/60"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Icon size={24} />
              </span>
              <h2 className="font-heading text-xl text-foreground">{title}</h2>
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              {description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl bg-primary/5 px-6 py-10 sm:px-12 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Kalite sözümüz
          </p>
          <h2 className="font-heading text-3xl text-foreground">
            Her tabakta güven, her lokmada hikâye
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {kitchenCommitments.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl bg-card p-6 shadow-subtle border border-secondary/60"
            >
              <h3 className="font-heading text-xl text-primary mb-3">
                {card.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Unser Team
          </p>
          <h2 className="font-heading text-3xl text-foreground">
            Tanışın: Mutfağın kalbi
          </h2>
          <p className="text-sm text-muted max-w-2xl mx-auto">
            Küçük ama çok disiplinli ekibimiz, reçetelerimizi sürekli
            geliştiriyor ve her serviste misafirlerimizi isimleriyle karşılıyor.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="flex flex-col items-center rounded-3xl bg-card p-8 shadow-subtle border border-secondary/70"
            >
              <img
                src="/images/placeholder.svg"
                alt={`${member.name} Profilbild Platzhalter`}
                className="mb-6 h-24 w-24 rounded-full border border-secondary object-cover"
                loading="lazy"
              />
              <h3 className="font-heading text-xl text-foreground">
                {member.name}
              </h3>
              <p className="text-sm text-muted mt-2 text-center">
                {member.role}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_1fr] items-center rounded-3xl bg-card px-6 py-10 sm:px-12 shadow-subtle border border-secondary/70">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Bizi ziyaret edin
          </p>
          <h2 className="font-heading text-3xl text-foreground">
            Clausthal-Zellerfeld&apos;deyiz
          </h2>
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>
              Akademiestraße 3 · 38678 Clausthal-Zellerfeld{" "}
              <span className="text-primary font-semibold">·</span> Üniversite
              kampüsünün tam karşısında.
            </p>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>
                Yürüme mesafesinde otopark ve bisiklet park alanı mevcut.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span>
                Her gün 11:30 – 22:30 · Cuma ve Cumartesi 23:30&apos;a kadar.
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d19736.491509315558!2d10.333916!3d51.805038!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a53bd3f3a54551%3A0x77e706c8c83bf12b!2sMon%20Amie!5e0!3m2!1sde!2sde!4v1762088255755!5m2!1sde!2sde"
            className="h-96 w-full rounded-[32px] border border-secondary/60 shadow-subtle"
            loading="lazy"
          ></iframe>
          <div className="absolute bottom-6 left-6 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-subtle">
            <p className="font-heading text-lg">Mon Amie Chicken</p>
            <p className="text-xs opacity-90">
              Navigasyon için Google Maps&apos;e kaydedin
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card px-6 py-10 sm:px-12 shadow-subtle border border-secondary/70">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Kariyer & ekip ruhu
            </p>
            <h2 className="font-heading text-3xl text-foreground mt-2">
              Restoran ailemize katılın
            </h2>
            <p className="text-sm text-muted leading-relaxed mt-4">
              Hem servis hem mutfak tarafında büyüyen Mon Amie ekibi, iç eğitim
              akademisi ve yaratıcı etkinliklerle deneyimi zenginleştiriyor. Sen
              de takım arkadaşımız ol.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                Dijital vardiya planlama ve esnek çalışma saatleri
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                Menü inovasyonuna katılan iç workshop serileri
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                Servis, barista ve mutfak için hızlandırılmış eğitimler
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="mailto:talent@monamiechicken.de">CV gönder</a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/carrier.jpg"
              alt="Mon Amie ekibinin toplantısı"
              className="w-full rounded-[32px] object-cover shadow-subtle"
              loading="lazy"
            />
            <div className="absolute top-6 right-6 rounded-2xl bg-primary/90 px-4 py-2 text-primary-foreground shadow-subtle">
              <p className="font-heading text-sm">Yeni açılan pozisyonlar</p>
              <p className="text-[11px] opacity-80">
                Haftalık olarak güncellenir
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card px-6 py-10 sm:px-12 shadow-subtle border border-secondary/70">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Stripe destekli ödeme deneyimi
        </p>
        <div className="flex items-center gap-2 mt-2">
          <img
            src="/images/payment-logos/stripe.svg"
            alt="Stripe Logo"
            className="h-10 w-auto"
            loading="lazy"
          />
          <span className="text-xl font-heading text-foreground">
            ile anında, güvenli ve şeffaf tahsilat.
          </span>
        </div>
        <p className="text-base text-muted leading-relaxed mt-4">
          PCI-DSS seviyesinde koruma, Stripe Radar ile sahteciliğe karşı tarama
          ve PSD2 uyumlu 3D Secure doğrulama sayesinde kart bilgileriniz sadece
          sizde kalır. Tüm işlemler gerçek zamanlı şifrelenir.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm text-muted">
          <div className="flex items-start gap-3 rounded-2xl bg-primary/10 p-4">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-heading text-sm text-foreground">
                Anomali taraması
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Stripe Radar saniyeler içinde riskli işlemleri tespit eder.
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-secondary p-4">
            <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-heading text-sm text-foreground">
                Anında iadeler
              </p>
              <p>Visa ve MasterCard iadeleri tek dokunuşla gerçekleşir.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {paymentLogos.map((logo) => (
            <div
              key={logo.alt}
              className="rounded-2xl border border-secondary/60 bg-secondary/20 px-5 py-3"
            >
              <img
                src={logo.src}
                alt={`${logo.alt} Logo`}
                className="h-10 w-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

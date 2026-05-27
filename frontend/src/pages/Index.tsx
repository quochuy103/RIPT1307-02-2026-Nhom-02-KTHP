import { Link } from 'react-router-dom';
import { ArrowRight, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { services, barbers, reviews, galleryImages } from '@/data/mockData';
import { api } from '@/lib/api';
import BarberCard from '@/components/BarberCard';
import ReviewCard from '@/components/ReviewCard';
import ServiceCard from '@/components/ServiceCard';
import heroImage from '@/assets/hero-barber.jpg';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const Index = () => {
  const { t } = useTranslation();
  const [serviceList, setServiceList] = useState(services);
  const [barberList, setBarberList] = useState(barbers);
  const [reviewList, setReviewList] = useState(reviews);
  const [galleryList, setGalleryList] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedServices, loadedBarbers, loadedReviews, loadedGallery] = await Promise.all([
          api.services.getAll(),
          api.barbers.getAll(),
          api.reviews.getAll(),
          api.gallery.getAll(),
        ]);
        setServiceList(loadedServices);
        setBarberList(loadedBarbers);
        setReviewList(loadedReviews);
        setGalleryList(loadedGallery.map((g) => g.src));
      } catch {
        // keep mock fallback
      }
    };
    void loadData();
  }, []);

  const featured = serviceList.slice(0, 4);

  const galleryPreviewImages = galleryList.length > 0 ? galleryList : galleryImages.map((image) => image.src);
  const galleryMarqueeImages = [...galleryPreviewImages, ...galleryPreviewImages];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Lì He Men's Hair Designer" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-5 w-5 text-primary" />
              <span className="text-primary text-sm font-medium tracking-widest uppercase">{t('hero.est')}</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t('hero.title1')}<br />
              <span className="text-gradient-gold">{t('hero.title2')}</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">{t('hero.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
                <Link to="/booking">{t('hero.bookNow')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-base">
                <Link to="/services">{t('hero.ourServices')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: t('stats.happyClients'), value: '5,000+' },
              { label: t('stats.expertBarbers'), value: '3' },
              { label: t('stats.yearsExperience'), value: '14+' },
              { label: t('stats.avgRating'), value: '4.9' },
            ].map(s => (
              <motion.div key={s.label} {...fadeUp}>
                <p className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('home.servicesTitle')} <span className="text-gradient-gold">{t('home.servicesHighlight')}</span></h2>
            <p className="text-muted-foreground max-w-md mx-auto">{t('home.servicesSubtitle')}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((s, i) => (
              <motion.div key={s.id} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.1 }} className="flex h-full flex-col">
                <ServiceCard service={s} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/services">{t('home.viewAll')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section className="py-20 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('home.barbersTitle')} <span className="text-gradient-gold">{t('home.barbersHighlight')}</span></h2>
            <p className="text-muted-foreground">{t('home.barbersSubtitle')}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6 max-w-6xl mx-auto">
            {barberList.map((b, i) => (
              <motion.div key={b.id} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}>
                <BarberCard barber={b} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('home.reviewsTitle')} <span className="text-gradient-gold">{t('home.reviewsHighlight')}</span></h2>
          </motion.div>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {reviewList.map(r => (
              <div key={r.id} className="snap-start shrink-0">
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('home.galleryTitle')} <span className="text-gradient-gold">{t('home.galleryHighlight')}</span></h2>
          </motion.div>

          <div className="relative -mx-4 overflow-hidden px-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card/50 to-transparent md:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card/50 to-transparent md:w-28" />
            <div className="flex w-max animate-gallery-marquee gap-4 hover:[animation-play-state:paused]">
              {galleryMarqueeImages.map((img, i) => (
                <div key={`${img}-${i}`} className="h-52 w-72 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary sm:h-60 sm:w-80 lg:h-64 lg:w-96">
                  <img src={img} alt="Hairstyle" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/gallery">{t('home.viewGallery')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center bg-card border border-border rounded-2xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gold-gradient opacity-5" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('home.ctaTitle')} <span className="text-gradient-gold">{t('home.ctaHighlight')}</span></h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('home.ctaSubtitle')}</p>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-10">
                <Link to="/booking">{t('home.ctaButton')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

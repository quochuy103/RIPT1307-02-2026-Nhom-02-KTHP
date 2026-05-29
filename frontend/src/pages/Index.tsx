import { Link } from 'react-router-dom';
import { ArrowRight, Scissors, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { services, barbers, reviews, galleryImages } from '@/data/mockData';
import { api } from '@/lib/api';
import BarberCard from '@/components/BarberCard';
import BarberReviewsModal from '@/components/BarberReviewsModal';
import ServiceCard from '@/components/ServiceCard';
import heroImage from '@/assets/hero-barber.jpg';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const badgeStyles: Record<string, string> = {
  overview: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  barber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  service: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  product: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const Index = () => {
  const { t } = useTranslation();
  const [serviceList, setServiceList] = useState(services);
  const [barberList, setBarberList] = useState(barbers);
  const [reviewList, setReviewList] = useState(reviews);
  const [galleryList, setGalleryList] = useState(galleryImages.map((image) => image.src));
  
  // Barber Modal State
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [loadedServices, loadedBarbers, loadedReviews, loadedGallery] = await Promise.allSettled([
        api.services.getAll(),
        api.barbers.getAll(),
        api.reviews.getAll(),
        api.gallery.getAll(),
      ]);

      if (loadedServices.status === 'fulfilled') {
        setServiceList(loadedServices.value);
      }
      if (loadedBarbers.status === 'fulfilled') {
        setBarberList(loadedBarbers.value);
      }
      if (loadedReviews.status === 'fulfilled') {
        setReviewList(loadedReviews.value);
      }
      if (loadedGallery.status === 'fulfilled') {
        setGalleryList(loadedGallery.value.map((g) => g.src));
      }
    };
    void loadData();
  }, []);

  const featured = serviceList.slice(0, 4);

  const galleryPreviewImages = galleryList.length > 0 ? galleryList : galleryImages.map((image) => image.src);
  
  // Ensure gallery track is wide enough to prevent gaps
  const galleryMarqueeImages = useMemo(() => {
    if (galleryPreviewImages.length === 0) return [];
    const repeatCount = Math.max(4, Math.ceil(10 / galleryPreviewImages.length));
    const baseList = Array(repeatCount).fill(galleryPreviewImages).flat();
    return [...baseList, ...baseList];
  }, [galleryPreviewImages]);

  const avgRating = reviewList.length > 0 
    ? (reviewList.reduce((acc, curr) => acc + curr.rating, 0) / reviewList.length).toFixed(1)
    : '4.9';
  const totalReviewsCount = reviewList.length > 0 ? reviewList.length : 128;

  // Categorize reviews list for the running marquee under "What Customers Say" using real API data
  const categorizedReviewsList = useMemo(() => {
    const list: any[] = [];
    reviewList.forEach((r) => {
      const rComment = r.comment || "";
      
      // Product review check
      if (r.reviewType === 'product' || r.productId || r.productName) {
        list.push({
          id: `${r.id}-product`,
          category: 'product',
          categoryLabel: 'Đánh Giá Sản Phẩm',
          targetName: r.productName || 'Sản phẩm',
          name: r.name,
          rating: r.rating,
          comment: rComment || 'Sản phẩm chất lượng tốt, cực kỳ hài lòng.',
          date: r.date,
          avatar: r.avatar,
        });
        return;
      }

      // Booking / Overall Review
      list.push({
        id: `${r.id}-overview`,
        category: 'overview',
        categoryLabel: 'Tổng Quan',
        name: r.name,
        rating: r.rating,
        comment: rComment || 'Không gian tuyệt vời, dịch vụ tận tâm chuyên nghiệp.',
        date: r.date,
        avatar: r.avatar,
      });

      // Specific Barber comment
      if (r.barberId || r.barberName || r.barberRating || r.barberComment) {
        list.push({
          id: `${r.id}-barber`,
          category: 'barber',
          categoryLabel: 'Đánh Giá Barber',
          targetName: r.barberName || 'Barber',
          name: r.name,
          rating: r.barberRating || r.rating,
          comment: r.barberComment || rComment || 'Cắt tóc cẩn thận, tạo kiểu đúng mong muốn.',
          date: r.date,
          avatar: r.avatar,
        });
      }

      // Specific Service comment
      if (r.serviceId || r.serviceName || r.serviceRating || r.serviceComment) {
        list.push({
          id: `${r.id}-service`,
          category: 'service',
          categoryLabel: 'Đánh Giá Dịch Vụ',
          targetName: r.serviceName || 'Dịch vụ',
          name: r.name,
          rating: r.serviceRating || r.rating,
          comment: r.serviceComment || rComment || 'Dịch vụ gội sấy tuyệt vời, sảng khoái.',
          date: r.date,
          avatar: r.avatar,
        });
      }
    });

    return list;
  }, [reviewList]);

  // Ensure reviews track is wide enough to prevent gaps and glitches
  const categorizedMarqueeList = useMemo(() => {
    if (categorizedReviewsList.length === 0) return [];
    const repeatCount = Math.max(4, Math.ceil(12 / categorizedReviewsList.length));
    const baseList = Array(repeatCount).fill(categorizedReviewsList).flat();
    return [...baseList, ...baseList];
  }, [categorizedReviewsList]);


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
                <BarberCard
                  barber={b}
                  onClick={() => {
                    setSelectedBarber(b);
                    setIsBarberModalOpen(true);
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t('home.reviewsTitle')} <span className="text-gradient-gold">{t('home.reviewsHighlight')}</span>
            </h2>
            <div className="flex flex-col items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const ratingNum = parseFloat(avgRating);
                  return (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(ratingNum)
                          ? "fill-primary text-primary"
                          : i < ratingNum
                          ? "fill-primary/50 text-primary"
                          : "text-muted-foreground/30"
                      )}
                    />
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{avgRating} / 5</span> dựa trên{" "}
                <span className="font-semibold text-foreground">{totalReviewsCount}</span> đánh giá từ khách hàng
              </p>
              <div className="mt-4">
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6">
                  <Link to="/my-orders?tab=reviewable">{t('home.writeReviewButton')}</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="relative -mx-4 overflow-hidden px-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-28" />
            <div className="flex w-max animate-gallery-marquee gap-4 hover:[animation-play-state:paused]">
              {categorizedMarqueeList.map((card, i) => (
                <div key={`${card.id}-${i}`} className="snap-start shrink-0">
                  <div className="bg-card/45 backdrop-blur-md border border-border/80 hover:border-primary/45 rounded-xl p-5 w-[310px] h-[190px] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between select-none">
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className={cn("text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", badgeStyles[card.category])}>
                          {card.categoryLabel}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, idx) => (
                            <Star key={idx} className={cn("h-3 w-3", idx < card.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
                          ))}
                        </div>
                      </div>

                      {card.targetName && (
                        <p className="text-[11px] font-bold text-primary mb-1 truncate">
                          {card.category === 'barber' ? 'Barber: ' : card.category === 'service' ? 'Dịch vụ: ' : 'Sản phẩm: '}
                          <span className="text-foreground font-semibold">{card.targetName}</span>
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground italic line-clamp-3 leading-relaxed">
                        "{card.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                          {card.avatar}
                        </div>
                        <span className="font-semibold text-[10px] text-foreground/80">{card.name}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{card.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Barber Reviews Modal */}
      <BarberReviewsModal
        isOpen={isBarberModalOpen}
        onClose={() => setIsBarberModalOpen(false)}
        barber={selectedBarber}
        reviews={reviewList}
      />
    </div>
  );
};

export default Index;


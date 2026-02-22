'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import CategoryCard from '@/components/ui/CategoryCard';
import Preloader from '@/components/ui/Preloader';
import { useData } from '@/lib/DataContext';
import { featureIcons, StarRating } from '@/components/ui/BadgeIcon';
import { formatRupiah, formatDownloads } from '@/lib/types';

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useRef(false);
  const lastAnimatedTarget = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        // Animate if visible and target changed since last animation
        if (entry.isIntersecting && target > 0 && target !== lastAnimatedTarget.current) {
          lastAnimatedTarget.current = target;
          const duration = 2000;
          const start = Date.now();
          const step = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  // If data arrives while already visible, trigger animation
  useEffect(() => {
    if (isVisible.current && target > 0 && target !== lastAnimatedTarget.current) {
      lastAnimatedTarget.current = target;
      const duration = 2000;
      const start = Date.now();
      const step = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [target]);

  return <div ref={ref}>{prefix}{count.toLocaleString('id-ID')}{suffix}</div>;
}

export default function HomePage() {
  const { products, categories, settings } = useData();
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const trendingProducts = products.filter(p => p.trending).slice(0, 4);
  const mostPlayedProducts = products.filter(p => p.mostPlayed).slice(0, 6);
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const activeBanners = (settings.bannerImages || []).filter(v => v.active);

  // Compute stats
  const totalDownloads = products.reduce((sum, p) => sum + (p.downloads || 0), 0);
  const totalProducts = products.length;
  const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length) : 0;
  
  // Deal of the Day - from admin promo settings, fallback to first sale product
  const dealProduct = settings.promoActive !== false
    ? (settings.promoProductId
        ? products.find(p => p.id === settings.promoProductId)
        : products.find(p => p.salePrice && p.salePrice < p.price))
    : null;
  const promoTitle = settings.promoTitle || 'DEAL OF THE DAY';

  const platforms = [
    { name: 'PC / Steam', slug: 'PC', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, color: 'from-blue-600 to-indigo-700', count: products.filter(p => (p.platform || []).includes('PC')).length },
    { name: 'PlayStation 5', slug: 'PS5', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.235-1.268-4.783-4.567-5.58-1.47-.355-3.544-.658-5.264-1.749zM1.085 18.286l1.27.453c1.484.496 2.997 1.003 5.425.163 2.27-.786 2.598-2.173 1.63-2.843-.872-.603-2.419-.859-4.381-.564l-1.64.226V13.72l.79-.109c2.18-.307 3.858-.009 5.082.554v-2.79C7.658 10.55 5.192 10.89 3.15 11.78c-2.28.993-3.06 2.462-2.24 3.967.378.691 1.01 1.2 1.907 1.554l-1.732.985z"/></svg>, color: 'from-blue-500 to-blue-700', count: products.filter(p => (p.platform || []).includes('PS5')).length },
    { name: 'Xbox Series', slug: 'Xbox', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zM12 3.5S9.5 0 7 0C4.462 0 2.5 1.735 2.5 3.5c0 .713.267 1.424.685 2.07C5.056 3.734 8.13 3.04 12 3.5zm9.815 2.07c.418-.646.685-1.357.685-2.07C22.5 1.735 20.538 0 18 0c-2.5 0-5 3.5-5 3.5 3.87-.46 6.944.234 8.815 2.07z"/></svg>, color: 'from-green-500 to-green-700', count: products.filter(p => (p.platform || []).includes('Xbox')).length },
  ];

  const features = [
    { icon: featureIcons.download, title: 'Akun Original' },
    { icon: featureIcons.users, title: 'Steam Sharing' },
    { icon: featureIcons.play, title: 'Proses Instan' },
    { icon: featureIcons.layout, title: 'Garansi Resmi' },
  ];

  // Auto-rotate banners
  const nextBanner = useCallback(() => {
    if (activeBanners.length > 1) {
      setActiveBanner((prev) => (prev + 1) % activeBanners.length);
    }
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [nextBanner, activeBanners.length]);

  return (
    <>
      <Preloader />
      <Header />

      {/* Hero Banner */}
      <section className="relative min-h-[600px] lg:min-h-[700px] rounded-b-[60px] sm:rounded-b-[100px] lg:rounded-b-[150px] pt-32 lg:pt-40 pb-16 lg:pb-20 overflow-hidden">
        {/* Static Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/banner-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white animate-fade-in">
              <h6 className="text-base lg:text-xl font-medium uppercase tracking-wider mb-4 lg:mb-5">
                {settings.heroSubtitle || 'Welcome to ZOGAMING'}
              </h6>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 lg:mb-8 leading-tight drop-shadow-lg">
                {settings.heroTitle || 'BEST GAMING SITE EVER!'}
              </h2>
              <p className="text-base lg:text-lg opacity-90 mb-8 lg:mb-10 max-w-lg drop-shadow-md">
                {settings.heroDescription || 'ZOGAMING is your ultimate destination for the best video games. Browse our collection of action, adventure, strategy, and racing games.'}
              </p>

              {/* Search Form */}
              <form className="relative max-w-md" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`); }}>
                <input
                  type="text"
                  placeholder="Cari game, genre, platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-6 pr-36 rounded-full text-gray-700 outline-none bg-white shadow-xl"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-14 px-6 bg-[#ee626b] text-white font-semibold rounded-full hover:bg-[#010101] transition-colors"
                >
                  Cari Game
                </button>
              </form>
            </div>

            {/* Right - Banner Image Slider Card */}
            <div className="relative lg:pl-20">
              {activeBanners.length > 0 ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
                  {/* Images with crossfade */}
                  <div className="relative aspect-[4/3] sm:aspect-[5/4] bg-black">
                    {activeBanners.map((banner, idx) => (
                      <div
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          idx === activeBanner ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-center"
                          priority={idx === 0}
                        />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Title Badge on card */}
                    {activeBanners[activeBanner] && (
                      <div className="absolute top-4 left-4 z-10">
                        <span
                          className="px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg"
                          style={{
                            backgroundColor: activeBanners[activeBanner].badgeColor || '#ee626b',
                            color: activeBanners[activeBanner].badgeTextColor || '#fff',
                            boxShadow: `0 6px 20px ${activeBanners[activeBanner].badgeColor || '#ee626b'}50`,
                          }}
                        >
                          {activeBanners[activeBanner].title}
                        </span>
                      </div>
                    )}

                    {/* Arrow Controls inside the card */}
                    {activeBanners.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveBanner((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button
                          onClick={() => setActiveBanner((prev) => (prev + 1) % activeBanners.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </>
                    )}

                    {/* Dots inside the card */}
                    {activeBanners.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                        {activeBanners.map((v, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveBanner(idx)}
                            className="transition-all duration-500 rounded-full"
                            style={{
                              width: idx === activeBanner ? 28 : 8,
                              height: 8,
                              backgroundColor: idx === activeBanner ? (v.badgeColor || '#ee626b') : 'rgba(255,255,255,0.5)',
                            }}
                            aria-label={`Banner ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : featuredProducts[0] ? (
                <Link href={`/products/${featuredProducts[0].id}`} className="block group">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 group-hover:border-[#ee626b]/50 transition-all duration-500">
                    <Image
                      src={featuredProducts[0].image}
                      alt={featuredProducts[0].name}
                      width={500}
                      height={400}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Game Unggulan</p>
                      <h3 className="text-white text-2xl font-bold mb-2">{featuredProducts[0].name}</h3>
                      <div className="flex items-center gap-3">
                        {featuredProducts[0].salePrice && (
                          <span className="text-white/50 line-through text-lg">
                            {formatRupiah(featuredProducts[0].price)}
                          </span>
                        )}
                        <span className="text-[#ee626b] text-2xl font-bold">
                          {formatRupiah(featuredProducts[0].salePrice || featuredProducts[0].price)}
                        </span>
                      </div>
                    </div>
                    {featuredProducts[0].salePrice && (
                      <span className="absolute top-4 right-4 bg-[#ee626b] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg animate-badge-pulse">
                        -{Math.round(((featuredProducts[0].price - featuredProducts[0].salePrice) / featuredProducts[0].price) * 100)}%
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <Image src="/images/banner-image.jpg" alt="Featured Game" width={500} height={400} className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Using SVG icons */}
      <section className="container mx-auto px-4 mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl px-6 py-7 shadow-md text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#ee626b]/15 to-[#ee626b]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rounded-full transition-all duration-300 text-[#ee626b]">
                {feature.icon}
              </div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {feature.title}
              </h4>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="container mx-auto px-4 mt-20">
        <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#ee626b]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
            <div className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                <AnimatedCounter target={totalProducts} suffix="+" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Game Tersedia</p>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                <AnimatedCounter target={Math.round(totalDownloads / 1000)} suffix="K+" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Total Downloads</p>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[#ee626b] mb-1">
                <AnimatedCounter target={parseFloat(avgRating.toFixed(1)) * 10} suffix="" />
                <span className="text-lg text-gray-500">/50</span>
              </div>
              <p className="text-sm text-gray-400 font-medium">Rating Rata-rata</p>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                <AnimatedCounter target={3} suffix=" Platform" />
              </div>
              <p className="text-sm text-gray-400 font-medium">PC, PS5 & Xbox</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Browse Section */}
      <section className="container mx-auto px-4 mt-28">
        <div className="section-heading text-center mb-12">
          <h6>Platform</h6>
          <h2>Pilih Platform Favoritmu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <Link
              key={platform.slug}
              href={`/shop?platform=${platform.slug}`}
              className="group relative overflow-hidden rounded-2xl p-8 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.color}`} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {/* Decorative circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
              
              <div className="relative z-10">
                <div className="mb-4 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                  {platform.icon}
                </div>
                <h3 className="text-xl font-bold mb-1">{platform.name}</h3>
                <p className="text-sm opacity-80">{platform.count} game tersedia</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Games Section */}
      <section className="container mx-auto px-4 mt-28">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="section-heading mb-6 md:mb-0">
            <h6>Trending</h6>
            <h2>Game Trending</h2>
          </div>
          <Link href="/shop" className="btn-primary">
            Lihat Semua
          </Link>
        </div>

        {trendingProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>Belum ada game trending. Atur di panel admin.</p>
          </div>
        )}
      </section>

      {/* Most Played Section */}
      <section className="container mx-auto px-4 mt-28">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="section-heading mb-6 md:mb-0">
            <h6>TOP GAMES</h6>
            <h2>Paling Banyak Dimainkan</h2>
          </div>
          <Link href="/shop" className="btn-primary">
            Lihat Semua
          </Link>
        </div>

        {mostPlayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {mostPlayedProducts.map((game) => (
              <Link key={game.id} href={`/products/${game.id}`} className="group">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mb-4">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Most Played badge overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-1 bg-orange-500/90 text-white text-[10px] font-bold rounded-full">
                      MOST PLAYED
                    </span>
                  </div>
                </div>
                <span className="text-sm text-[#ee626b] font-semibold capitalize">
                  {game.category}
                </span>
                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                  {game.name}
                </h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <StarRating rating={game.rating || 0} size={12} />
                  <span className="text-[10px] text-gray-400">({game.rating || 0})</span>
                </div>
                <span className="text-xs font-bold text-[#010101]">
                  {formatRupiah(game.salePrice || game.price)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>Belum ada game populer. Atur di panel admin.</p>
          </div>
        )}
      </section>

      {/* Deal of the Day Section */}
      {dealProduct && (
        <section className="container mx-auto px-4 mt-28">
          <div className="relative bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-3xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ee626b]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              {/* Image */}
              <div className="relative aspect-video md:aspect-auto md:h-full min-h-[300px]">
                <Image
                  src={dealProduct.image}
                  alt={dealProduct.name}
                  fill
                  className="object-cover rounded-l-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a2e]/80 md:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent md:hidden" />
                
                {/* Discount badge */}
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-[#ee626b] text-white text-lg font-extrabold rounded-xl shadow-lg animate-badge-pulse">
                    -{Math.round(((dealProduct.price - dealProduct.salePrice!) / dealProduct.price) * 100)}% OFF
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 md:p-12 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[#ee626b]/20 text-[#ee626b] text-xs font-bold rounded-full border border-[#ee626b]/30">
                    🔥 {promoTitle}
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-3">{dealProduct.name}</h3>
                <p className="text-gray-400 mb-6 line-clamp-2">{dealProduct.description}</p>
                
                {/* Platform badges */}
                <div className="flex gap-2 mb-6">
                  {(dealProduct.platform || []).map((p) => (
                    <span key={p} className={`platform-badge ${p.toLowerCase() === 'pc' ? 'pc' : p.toLowerCase() === 'ps5' ? 'ps5' : p.toLowerCase() === 'xbox' ? 'xbox' : ''}`}>
                      {p}
                    </span>
                  ))}
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-2xl text-gray-500 line-through">{formatRupiah(dealProduct.price)}</span>
                  <span className="text-4xl font-extrabold text-[#ee626b]">{formatRupiah(dealProduct.salePrice!)}</span>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={dealProduct.rating || 0} size={16} />
                    <span className="text-sm text-gray-400">({dealProduct.rating})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {formatDownloads(dealProduct.downloads || 0)} downloads
                  </div>
                </div>
                
                <Link
                  href={`/products/${dealProduct.id}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#ee626b] text-white font-bold rounded-full hover:bg-[#d4555d] transition-all duration-300 hover:shadow-lg hover:shadow-[#ee626b]/30 hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  Beli Sekarang
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="container mx-auto px-4 mt-28">
        <div className="section-heading text-center mb-12">
          <h6>Kategori</h6>
          <h2>Genre Populer</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Why ZOGAMING Section */}
      <section className="container mx-auto px-4 mt-28 mb-10">
        <div className="section-heading text-center mb-12">
          <h6>Why Us</h6>
          <h2>Kenapa Beli di ZOGAMING?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Akun Resmi Steam</h4>
            <p className="text-sm text-gray-500">Bukan crack! Semua akun game 100% resmi dari Steam.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Proses Cepat</h4>
            <p className="text-sm text-gray-500">Akun dikirim langsung via WhatsApp setelah konfirmasi pembayaran.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Steam Sharing</h4>
            <p className="text-sm text-gray-500">Satu akun bisa dipakai bersama. Hemat budget, game tetap ori!</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Garansi Akun</h4>
            <p className="text-sm text-gray-500">Ada masalah? Hubungi admin kami, siap bantu kapan saja.</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 mt-20 mb-20">
        <div className="relative bg-[#010101] rounded-3xl p-10 md:p-16 text-center overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#ee626b]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Siap Bermain Game Favorit? 🎮
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Jelajahi koleksi game terlengkap dengan harga terjangkau. Akun resmi Steam sharing, proses cepat, garansi penuh!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#ee626b] text-white font-bold rounded-full hover:bg-[#d4555d] transition-all duration-300 hover:shadow-lg hover:shadow-[#ee626b]/30 hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Jelajahi Semua Game
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

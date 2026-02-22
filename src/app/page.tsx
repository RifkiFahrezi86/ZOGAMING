'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { formatRupiah } from '@/lib/types';

export default function HomePage() {
  const { products, categories, settings } = useData();
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const trendingProducts = products.filter(p => p.trending).slice(0, 4);
  const mostPlayedProducts = products.filter(p => p.mostPlayed).slice(0, 6);
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const activeBanners = (settings.bannerImages || []).filter(v => v.active);

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
      <section className="relative min-h-[700px] rounded-b-[150px] pt-40 pb-20 overflow-hidden">
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
              <h6 className="text-xl font-medium uppercase tracking-wider mb-5">
                {settings.heroSubtitle || 'Welcome to ZOGAMING'}
              </h6>
              <h2 className="text-5xl lg:text-6xl font-bold mb-8 leading-tight drop-shadow-lg">
                {settings.heroTitle || 'BEST GAMING SITE EVER!'}
              </h2>
              <div className="relative inline-block mb-10">
                <Image
                  src="/images/caption-dec.png"
                  alt=""
                  width={202}
                  height={12}
                />
              </div>
              <p className="text-lg opacity-90 mb-10 max-w-lg drop-shadow-md">
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

      <Footer />
    </>
  );
}

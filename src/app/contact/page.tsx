'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Admin {
    id: number;
    name: string;
    whatsapp: string;
}

export default function ContactPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admins/active')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setAdmins(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const formatPhone = (phone: string) => {
        if (phone.startsWith('62')) return '0' + phone.slice(2);
        return phone;
    };

    return (
        <>
            <Header />

            {/* Page Heading */}
            <section
                className="relative h-64 bg-cover bg-center flex items-center"
                style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#010101] to-[#010101]/70" />
                <div className="container mx-auto px-4 relative z-10 pt-20">
                    <h3 className="text-4xl font-bold text-white mb-4">Hubungi Kami</h3>
                    <nav className="flex items-center gap-2 text-white/80">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>&gt;</span>
                        <span className="text-white">Hubungi Kami</span>
                    </nav>
                </div>
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 py-16 max-w-3xl">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Ada Masalah atau Pertanyaan?</h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        Jika ada kendala dengan pesanan, akun game, atau pertanyaan lainnya, silakan hubungi admin kami langsung melalui WhatsApp.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <svg className="animate-spin h-8 w-8 mx-auto text-[#ee626b]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    </div>
                ) : admins.length > 0 ? (
                    <div className="grid gap-4">
                        {admins.map((admin) => (
                            <a
                                key={admin.id}
                                href={`https://wa.me/${admin.whatsapp}?text=Halo%20${encodeURIComponent(admin.name)}%2C%20saya%20butuh%20bantuan%20dari%20ZOGAMING`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-green-200 transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900">{admin.name}</h3>
                                    <p className="text-gray-500 text-sm">{formatPhone(admin.whatsapp)}</p>
                                </div>
                                <div className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-full group-hover:bg-green-600 transition-colors flex-shrink-0 text-sm">
                                    Chat WhatsApp
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white rounded-2xl shadow-md">
                        <p className="text-gray-500">Belum ada admin yang tersedia.</p>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mt-12">
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Masalah Akun Game</h4>
                        </div>
                        <p className="text-sm text-gray-600">Jika akun game tidak bisa diakses atau ada masalah login, langsung hubungi admin.</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Status Pesanan</h4>
                        </div>
                        <p className="text-sm text-gray-600">Untuk mengecek status pesanan, login dan buka halaman Dashboard.</p>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span className="text-sm font-medium">100% Aman</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-sm font-medium">Respon Cepat</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span className="text-sm font-medium">Akun Resmi Steam</span>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

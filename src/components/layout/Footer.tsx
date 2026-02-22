import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0a0a0a] py-10 mt-20">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center gap-6">
                    {/* Trust badges */}
                    <div className="flex items-center gap-8 flex-wrap justify-center">
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span className="text-xs font-medium">Akun Resmi</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-xs font-medium">Proses Cepat</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span className="text-xs font-medium">Terpercaya</span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">Home</Link>
                        <Link href="/shop" className="text-gray-500 hover:text-white text-sm transition-colors">Shop</Link>
                        <Link href="/contact" className="text-gray-500 hover:text-white text-sm transition-colors">Hubungi Kami</Link>
                    </div>

                    {/* Divider */}
                    <div className="w-full max-w-md border-t border-gray-800" />

                    {/* Copyright */}
                    <p className="text-gray-600 text-sm text-center">
                        &copy; {currentYear} ZOGAMING. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

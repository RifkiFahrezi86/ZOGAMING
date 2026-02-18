'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import { formatRupiah } from '@/lib/types';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/contact', label: 'Contact' },
];

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'customer';
}

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { cart, removeFromCart, updateCartQuantity, clearCart } = useData();

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0);

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth, pathname]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setIsUserMenuOpen(false);
            router.push('/');
        } catch {
            // ignore
        }
    };

    const handleCartCheckout = () => {
        if (cart.length >= 1) {
            const item = cart[0];
            setIsCartOpen(false);
            router.push(`/checkout?productId=${item.product.id}`);
        }
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isUserMenuOpen) {
            const close = () => setIsUserMenuOpen(false);
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [isUserMenuOpen]);

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[#010101] shadow-lg rounded-b-3xl py-2' : 'bg-transparent py-10'}`}>
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between">
                        <Link href="/" className="flex-shrink-0">
                            <Image src="/images/logo.svg" alt="ZOGAMING" width={isScrolled ? 120 : 160} height={isScrolled ? 24 : 32} className="transition-all duration-300" />
                        </Link>

                        {/* Desktop Nav */}
                        <ul className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={`px-5 py-2 rounded-full text-sm font-light text-white transition-all duration-300 ${pathname === link.href ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <button onClick={() => setIsCartOpen(true)} className="relative px-4 py-2 rounded-full text-sm text-white hover:bg-white/10 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                    {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ee626b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                                </button>
                            </li>
                            {user ? (
                                <li className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(!isUserMenuOpen); }} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white hover:bg-white/10 transition-all duration-300">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-xs font-bold">{user.name.charAt(0).toUpperCase()}</div>
                                        <span className="font-light hidden lg:inline max-w-[100px] truncate">{user.name}</span>
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50" onClick={(e) => e.stopPropagation()}>
                                            <div className="px-4 py-3 bg-gray-50 border-b">
                                                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span>
                                            </div>
                                            {user.role === 'admin' && (
                                                <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ) : (
                                <>
                                    <li><Link href="/auth/login" className="px-5 py-2 rounded-full text-sm font-light text-white hover:bg-white/10 transition-all duration-300">Login</Link></li>
                                    <li><Link href="/auth/register" className="px-5 py-2 rounded-full text-sm font-semibold bg-[#ee626b] text-white hover:bg-[#d4555d] transition-all duration-300">Register</Link></li>
                                </>
                            )}
                        </ul>

                        {/* Mobile */}
                        <div className="md:hidden flex items-center gap-2">
                            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ee626b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                            </button>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex flex-col gap-1.5 p-2" aria-label="Toggle menu">
                                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Menu */}
                    <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] mt-4' : 'max-h-0'}`}>
                        <ul className="bg-white rounded-3xl shadow-lg overflow-hidden">
                            {navLinks.map((link) => (
                                <li key={link.href} className="border-t border-gray-100 first:border-t-0">
                                    <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`block px-6 py-4 text-sm font-medium transition-colors ${pathname === link.href ? 'text-[#ee626b] bg-gray-50' : 'text-gray-800 hover:text-[#ee626b]'}`}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            {user ? (
                                <>
                                    <li className="border-t border-gray-100 px-6 py-3 bg-gray-50">
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </li>
                                    {user.role === 'admin' && (
                                        <li className="border-t border-gray-100">
                                            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-4 text-sm font-medium text-purple-600 hover:bg-purple-50">Admin Dashboard</Link>
                                        </li>
                                    )}
                                    <li className="border-t border-gray-100">
                                        <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-6 py-4 text-sm font-medium text-red-500 hover:bg-red-50">Logout</button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="border-t border-gray-100"><Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-4 text-sm font-medium text-gray-800 hover:text-[#ee626b]">Login</Link></li>
                                    <li className="border-t border-gray-100"><Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-4 text-sm font-medium text-[#ee626b] hover:bg-red-50">Register</Link></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </header>

            {/* Cart Sidebar */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Shopping Cart ({cartCount})</h3>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mx-auto mb-4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                    <p className="text-gray-400 mb-1">Your cart is empty</p>
                                    <button onClick={() => { setIsCartOpen(false); router.push('/shop'); }} className="mt-3 text-[#ee626b] font-semibold hover:underline">Browse Shop →</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => {
                                        const price = item.product.salePrice || item.product.price;
                                        return (
                                            <div key={item.product.id} className="flex gap-4 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                                    <Image src={item.product.image} alt={item.product.name} width={64} height={64} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.product.name}</h4>
                                                    <p className="text-sm text-[#ee626b] font-semibold">{formatRupiah(price)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold hover:bg-gray-300 transition-colors">-</button>
                                                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold hover:bg-gray-300 transition-colors">+</button>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id)} className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="p-6 border-t border-gray-100 space-y-4 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total:</span>
                                    <span className="text-2xl font-bold text-[#010101]">{formatRupiah(cartTotal)}</span>
                                </div>
                                <button onClick={handleCartCheckout} className="w-full h-12 bg-[#ee626b] text-white font-semibold rounded-full hover:bg-[#d4555d] transition-colors flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                    Checkout Now
                                </button>
                                <button onClick={clearCart} className="w-full h-10 text-sm text-gray-500 hover:text-red-500 transition-colors">Clear Cart</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

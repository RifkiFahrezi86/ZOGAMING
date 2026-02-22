'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

const navItems = [
    {
        href: '/admin',
        label: 'Dashboard',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    },
    {
        href: '/admin/products',
        label: 'Products',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    },
    {
        href: '/admin/categories',
        label: 'Categories',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    },
    {
        href: '/admin/badges',
        label: 'Badges',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    },
    {
        href: '/admin/customers',
        label: 'Customers',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
        href: '/admin/orders',
        label: 'Orders',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    },
    {
        href: '/admin/banner-videos',
        label: 'Banners',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    },
    {
        href: '/admin/promo',
        label: 'Promo',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    },
    {
        href: '/admin/admins',
        label: 'Admins',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    },
    {
        href: '/admin/settings',
        label: 'Settings',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showChangePw, setShowChangePw] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState('');
    const [pwErr, setPwErr] = useState('');

    const handleChangePw = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwErr(''); setPwMsg('');
        if (newPw !== confirmPw) { setPwErr('Konfirmasi password tidak cocok'); return; }
        if (newPw.length < 6) { setPwErr('Password minimal 6 karakter'); return; }
        setPwLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            });
            const data = await res.json();
            if (!res.ok) { setPwErr(data.error || 'Gagal'); } else {
                setPwMsg('Password berhasil diubah!');
                setCurrentPw(''); setNewPw(''); setConfirmPw('');
                setTimeout(() => { setShowChangePw(false); setPwMsg(''); }, 2000);
            }
        } catch { setPwErr('Terjadi kesalahan'); } finally { setPwLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1e293b] border-r border-slate-700/50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center h-16 px-6 border-b border-slate-700/50">
                    <Link href="/" className="flex items-center gap-3">
                        <svg width={120} height={24} viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <mask id="admin-logo-x-gap">
                                    <circle cx="25" cy="25" r="25" fill="white"/>
                                    <path d="M0 0 L50 50" stroke="black" strokeWidth="6"/>
                                    <path d="M50 0 L0 50" stroke="black" strokeWidth="6"/>
                                </mask>
                                <clipPath id="admin-logo-circle-clip">
                                    <circle cx="25" cy="25" r="23"/>
                                </clipPath>
                            </defs>
                            <g mask="url(#admin-logo-x-gap)" clipPath="url(#admin-logo-circle-clip)">
                                <circle cx="25" cy="25" r="25" fill="white"/>
                                <polygon points="25,25 0,0 50,0" fill="#EE626B"/>
                                <polygon points="25,25 0,50 50,50" fill="#EE626B"/>
                            </g>
                            <g fill="white" transform="translate(58, 12)">
                                <path d="M0,0 L18,0 L18,5 L7,21 L18,21 L18,26 L0,26 L0,21 L11,5 L0,5 Z"/>
                                <path d="M22,0 L38,0 Q42,0 42,4 L42,22 Q42,26 38,26 L26,26 Q22,26 22,22 L22,4 Q22,0 26,0 Z M28,5 L28,21 L36,21 L36,5 Z"/>
                                <path d="M46,0 L62,0 L62,5 L52,5 L52,21 L62,21 L62,15 L56,15 L56,11 L68,11 L68,22 Q68,26 64,26 L50,26 Q46,26 46,22 L46,4 Q46,0 50,0 Z"/>
                                <path d="M72,0 L88,0 Q92,0 92,4 L92,26 L86,26 L86,17 L78,17 L78,26 L72,26 L72,4 Q72,0 76,0 Z M78,5 L78,12 L86,12 L86,5 Z"/>
                                <path d="M96,0 L104,0 L108,10 L112,0 L120,0 L120,26 L114,26 L114,10 L110,18 L106,18 L102,10 L102,26 L96,26 Z"/>
                                <path d="M124,0 L130,0 L130,26 L124,26 Z"/>
                                <path d="M134,0 L140,0 L150,16 L150,0 L156,0 L156,26 L150,26 L140,10 L140,26 L134,26 Z"/>
                                <path d="M160,0 L176,0 L176,5 L166,5 L166,21 L176,21 L176,15 L170,15 L170,11 L182,11 L182,22 Q182,26 178,26 L164,26 Q160,26 160,22 L160,4 Q160,0 164,0 Z"/>
                            </g>
                        </svg>
                    </Link>
                </div>

                <nav className="p-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 64px - 80px)' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-[#ee626b] text-white shadow-lg shadow-[#ee626b]/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom user section */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Admin</p>
                            <p className="text-xs text-slate-400 truncate">ZOGAMING</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Link href="/" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Site
                        </Link>
                        <button onClick={() => { setShowChangePw(true); setPwErr(''); setPwMsg(''); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Password
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                <header className="h-16 bg-[#1e293b] border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-white p-2 -ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 hidden sm:inline">Admin Panel</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-xs font-bold">
                            A
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>

            {/* Change Password Modal */}
            {showChangePw && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowChangePw(false)}>
                    <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700/50" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">Ubah Password Admin</h3>
                        <form onSubmit={handleChangePw} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Password Saat Ini</label>
                                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Password Baru</label>
                                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Konfirmasi Password Baru</label>
                                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none" />
                            </div>
                            {pwErr && <p className="text-red-400 text-sm">{pwErr}</p>}
                            {pwMsg && <p className="text-green-400 text-sm">{pwMsg}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowChangePw(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors">Batal</button>
                                <button type="submit" disabled={pwLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#ee626b] text-white text-sm font-semibold hover:bg-[#d4555d] transition-colors disabled:opacity-50">{pwLoading ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

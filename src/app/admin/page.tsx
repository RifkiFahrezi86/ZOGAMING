'use client';

import Link from 'next/link';
import { useData } from '@/lib/DataContext';
import { formatRupiah } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';

interface DBOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    productName: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const { products, categories, badges } = useData();
    const [dbOrders, setDbOrders] = useState<DBOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    const loadOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.orders) setDbOrders(data.orders);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const totalRevenue = dbOrders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = dbOrders.filter((o) => o.status === 'PENDING').length;
    const recentOrders = dbOrders.slice(0, 5);

    const stats = [
        {
            label: 'Total Products',
            value: products.length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            ),
            color: 'from-blue-500 to-blue-600',
            href: '/admin/products',
        },
        {
            label: 'Categories',
            value: categories.length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            ),
            color: 'from-purple-500 to-purple-600',
            href: '/admin/categories',
        },
        {
            label: 'Total Orders',
            value: ordersLoading ? '...' : dbOrders.length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            ),
            color: 'from-green-500 to-green-600',
            href: '/admin/orders-management',
        },
        {
            label: 'Revenue',
            value: ordersLoading ? '...' : formatRupiah(totalRevenue),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
            color: 'from-amber-500 to-amber-600',
            href: '/admin/orders-management',
        },
        {
            label: 'Active Badges',
            value: badges.filter(b => b.active).length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            ),
            color: 'from-pink-500 to-pink-600',
            href: '/admin/badges',
        },
        {
            label: 'Pending',
            value: ordersLoading ? '...' : pendingOrders,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
            color: 'from-cyan-500 to-cyan-600',
            href: '/admin/orders-management',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'PROCESSING':
                return 'bg-blue-500/20 text-blue-400';
            case 'COMPLETED':
                return 'bg-green-500/20 text-green-400';
            case 'CANCELLED':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400">Welcome back! Here is what is happening today.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/products"
                        className="px-4 py-2 bg-[#ee626b] text-white rounded-xl font-medium hover:bg-[#d4555d] transition-colors"
                    >
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div
                                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                                >
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                        <Link
                            href="/admin/orders-management"
                            className="text-sm text-[#ee626b] hover:text-[#d4555d] transition-colors"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Order</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersLoading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-slate-400">
                                            <div className="w-8 h-8 border-2 border-[#ee626b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            Loading orders...
                                        </td>
                                    </tr>
                                ) : recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-slate-400">
                                            No orders yet
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-700/30">
                                            <td className="px-6 py-4 text-white font-medium text-sm">{order.orderNumber}</td>
                                            <td className="px-6 py-4 text-slate-300 text-sm">{order.customerName}</td>
                                            <td className="px-6 py-4 text-white font-semibold text-sm">{formatRupiah(order.total)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link
                            href="/admin/products"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Add New Product</p>
                                <p className="text-slate-400 text-sm">Create a new game listing</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/orders-management"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Manage Orders</p>
                                <p className="text-slate-400 text-sm">{pendingOrders} pending orders</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/customers"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">View Customers</p>
                                <p className="text-slate-400 text-sm">Manage customers</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/payment-settings"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Payment Settings</p>
                                <p className="text-slate-400 text-sm">Configure payments</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Site Settings</p>
                                <p className="text-slate-400 text-sm">Configure your store</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

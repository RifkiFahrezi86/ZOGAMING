'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/types';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

interface CustomerDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  complete: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const viewCustomerDetail = async (customerId: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch {
      alert('Gagal memuat detail customer');
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteCustomer = async (customerId: number, customerName: string) => {
    if (!confirm(`Hapus akun customer "${customerName}" beserta semua pesanannya?\n\nTindakan ini TIDAK BISA dibatalkan!`)) return;
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus customer');
      }
    } catch {
      alert('Gagal menghapus customer');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      (c.phone && c.phone.includes(search))
    );
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Detail view
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => { setSelectedCustomer(null); setExpandedOrder(null); }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Kembali ke Daftar Customer
        </button>

        {/* Customer info card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                <p className="text-slate-400 text-sm">{selectedCustomer.email}</p>
                {selectedCustomer.phone && (
                  <p className="text-slate-400 text-sm">{selectedCustomer.phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Bergabung: {formatDate(selectedCustomer.createdAt)}</span>
              <button
                onClick={() => deleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Riwayat Pesanan ({selectedCustomer.orders.length})
          </h3>

          {selectedCustomer.orders.length === 0 ? (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-8 text-center">
              <p className="text-slate-400">Customer ini belum memiliki pesanan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCustomer.orders.map((order) => (
                <div key={order.id} className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
                  {/* Order header */}
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-white font-mono font-bold text-sm">#{order.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status.toUpperCase()}
                      </span>
                      <span className="text-slate-400 text-sm hidden sm:inline">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-sm">{formatRupiah(order.total)}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded order detail */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-slate-700/50 p-4 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                            {item.productImage ? (
                              <Image src={item.productImage} alt={item.productName} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                            <p className="text-slate-400 text-xs">x{item.quantity} • {formatRupiah(item.price)}</p>
                          </div>
                          <p className="text-white font-semibold text-sm">{formatRupiah(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="bg-slate-800/30 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Catatan:</p>
                          <p className="text-slate-300 text-sm">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Customer list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola akun customer dan lihat pesanan mereka</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCustomers}</p>
              <p className="text-xs text-slate-400">Total Customer</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-xs text-slate-400">Total Pesanan</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatRupiah(totalRevenue)}</p>
              <p className="text-xs text-slate-400">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Cari customer (nama, email, nomor HP)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#ee626b] transition-colors"
        />
      </div>

      {/* Customer table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-slate-600 mb-4">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p className="text-slate-400">
            {searchTerm ? 'Tidak ada customer yang cocok dengan pencarian' : 'Belum ada customer terdaftar'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">WhatsApp</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Pesanan</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Total Belanja</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Bergabung</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{customer.name}</p>
                          <p className="text-slate-400 text-xs">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{customer.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-800 text-white text-sm font-medium">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-medium text-sm">{formatRupiah(customer.totalSpent)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-400 text-xs">{formatDate(customer.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewCustomerDetail(customer.id)}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Lihat Detail"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer.id, customer.name)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                          title="Hapus Customer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{customer.name}</p>
                      <p className="text-slate-400 text-xs">{customer.email}</p>
                      {customer.phone && <p className="text-slate-500 text-xs">{customer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => viewCustomerDetail(customer.id)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button
                      onClick={() => deleteCustomer(customer.id, customer.name)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Pesanan</p>
                      <p className="text-white font-medium text-sm">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Belanja</p>
                      <p className="text-white font-medium text-sm">{formatRupiah(customer.totalSpent)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

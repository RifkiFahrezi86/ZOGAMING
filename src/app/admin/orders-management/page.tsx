'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatRupiah } from '@/lib/types';

interface OrderData {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  total: number;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentExpiry: string | null;
  paidAt: string | null;
  accountEmail: string | null;
  accountPassword: string | null;
  deliveredAt: string | null;
  deliveryMethod: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  PROCESSING: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

const paymentStatusColors: Record<string, string> = {
  WAITING: 'bg-gray-500/20 text-gray-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  SUCCESS: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  EXPIRED: 'bg-red-500/20 text-red-400',
};

export default function AdminOrdersManagementPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [actionLoading, setActionLoading] = useState('');
  const [notification, setNotification] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadOrders();
    // Auto refresh every 15 seconds
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAction = async (orderId: string, action: string, extra?: Record<string, string>) => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, ...extra }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Action "${action}" berhasil!`);
        loadOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        showNotification(`Error: ${data.error}`);
      }
    } catch {
      showNotification('Terjadi kesalahan');
    } finally {
      setActionLoading('');
    }
  };

  const handleInputAccount = async () => {
    if (!selectedOrder) return;
    if (!accountForm.email || !accountForm.password) {
      showNotification('Email dan password akun wajib diisi');
      return;
    }
    await handleAction(selectedOrder.id, 'input_account', {
      accountEmail: accountForm.email,
      accountPassword: accountForm.password,
    });
    setAccountForm({ email: '', password: '' });
    loadOrders();
  };

  const handleDeliver = async (method: string) => {
    if (!selectedOrder) return;
    await handleAction(selectedOrder.id, 'deliver', { deliveryMethod: method });
    loadOrders();
  };

  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
    COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  };

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Management</h1>
          <p className="text-slate-400 mt-1">Kelola pesanan, verifikasi pembayaran, dan kirim akun</p>
        </div>
        <button
          onClick={() => loadOrders()}
          className="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === status
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {status === 'all' ? 'Semua' : status}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
          placeholder="Cari order number, nama, email..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 outline-none focus:border-blue-500"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
                Belum ada order
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setAccountForm({ email: order.accountEmail || '', password: order.accountPassword || '' });
                  }}
                  className={`bg-[#1e293b] rounded-xl p-4 border cursor-pointer transition-all hover:border-blue-500/50 ${
                    selectedOrder?.id === order.id ? 'border-blue-500' : 'border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">{order.orderNumber}</span>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${paymentStatusColors[order.paymentStatus] || ''}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-300">{order.customerName}</p>
                      <p className="text-slate-500 text-xs">{order.productName}</p>
                    </div>
                    <span className="text-white font-bold">{formatRupiah(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{order.paymentMethod || 'Belum pilih'}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Detail Panel */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 sticky top-6">
              <h3 className="text-white font-bold text-lg mb-1">{selectedOrder.orderNumber}</h3>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-4 ${statusColors[selectedOrder.status]}`}>
                {selectedOrder.status}
              </span>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer</span>
                  <span className="text-white">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white text-xs">{selectedOrder.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WhatsApp</span>
                  <span className="text-white">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Produk</span>
                  <span className="text-white">{selectedOrder.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total</span>
                  <span className="text-green-400 font-bold">{formatRupiah(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment</span>
                  <span className={`font-semibold ${paymentStatusColors[selectedOrder.paymentStatus]?.split(' ')[1]}`}>
                    {selectedOrder.paymentMethod || '-'} / {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* ACTIONS based on status */}
              <div className="space-y-3 border-t border-slate-700/50 pt-4">

                {/* Step 1: Verify Payment (PENDING → PROCESSING) */}
                {selectedOrder.status === 'PENDING' && selectedOrder.paymentStatus === 'PENDING' && (
                  <div>
                    <p className="text-yellow-400 text-xs mb-2">⏳ Customer sudah konfirmasi bayar. Verifikasi sekarang?</p>
                    <button
                      onClick={() => handleAction(selectedOrder.id, 'verify_payment')}
                      disabled={actionLoading === 'verify_payment'}
                      className="w-full py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                    >
                      {actionLoading === 'verify_payment' ? 'Memverifikasi...' : '✓ Verifikasi Pembayaran'}
                    </button>
                  </div>
                )}

                {/* Step 2: Input Account (PROCESSING) */}
                {selectedOrder.status === 'PROCESSING' && (
                  <div>
                    <p className="text-blue-400 text-xs mb-2">📝 Input akun yang akan dikirim ke customer:</p>
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        placeholder="Email Akun"
                        className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none text-sm"
                      />
                      <input
                        type="text"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                        placeholder="Password Akun"
                        className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none text-sm"
                      />
                      <button
                        onClick={handleInputAccount}
                        disabled={actionLoading === 'input_account'}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 text-sm"
                      >
                        {actionLoading === 'input_account' ? 'Menyimpan...' : '💾 Simpan Akun'}
                      </button>
                    </div>

                    {/* Show saved account */}
                    {selectedOrder.accountEmail && (
                      <div className="bg-slate-800 rounded-lg p-3 mb-3">
                        <p className="text-xs text-slate-400 mb-1">Akun yang tersimpan:</p>
                        <p className="text-white text-xs">📧 {selectedOrder.accountEmail}</p>
                        <p className="text-white text-xs">🔑 {selectedOrder.accountPassword}</p>
                      </div>
                    )}

                    {/* Step 3: Deliver (need account first) */}
                    {selectedOrder.accountEmail && selectedOrder.accountPassword && (
                      <div>
                        <p className="text-green-400 text-xs mb-2">🚀 Kirim akun ke customer:</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeliver('whatsapp')}
                            disabled={actionLoading === 'deliver'}
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 text-xs"
                          >
                            📱 WhatsApp
                          </button>
                          <button
                            onClick={() => handleDeliver('email')}
                            disabled={actionLoading === 'deliver'}
                            className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50 text-xs"
                          >
                            📧 Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* COMPLETED */}
                {selectedOrder.status === 'COMPLETED' && (
                  <div className="bg-green-500/10 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-semibold">✅ Order Selesai</p>
                    {selectedOrder.accountEmail && (
                      <div className="mt-2 text-xs text-slate-300">
                        <p>📧 {selectedOrder.accountEmail}</p>
                        <p>🔑 {selectedOrder.accountPassword}</p>
                        <p className="text-slate-500 mt-1">Dikirim via {selectedOrder.deliveryMethod} pada {selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString('id-ID') : '-'}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancel button (for PENDING and PROCESSING) */}
                {['PENDING', 'PROCESSING'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      if (confirm('Yakin ingin membatalkan order ini?')) {
                        handleAction(selectedOrder.id, 'cancel');
                      }
                    }}
                    disabled={actionLoading === 'cancel'}
                    className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 disabled:opacity-50 text-sm"
                  >
                    ✕ Batalkan Order
                  </button>
                )}

                {/* Refund button (for PROCESSING with 30min timeout) */}
                {selectedOrder.status === 'PROCESSING' && (
                  <button
                    onClick={() => {
                      if (confirm('Proses refund untuk order ini? Customer akan diberitahu via WhatsApp.')) {
                        handleAction(selectedOrder.id, 'refund');
                      }
                    }}
                    disabled={actionLoading === 'refund'}
                    className="w-full py-2 bg-orange-500/20 text-orange-400 rounded-lg font-semibold hover:bg-orange-500/30 disabled:opacity-50 text-sm"
                  >
                    💰 Proses Refund
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 text-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-50">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>Pilih order untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

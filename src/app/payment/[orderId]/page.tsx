'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatRupiah } from '@/lib/types';

interface PaymentMethodData {
  id: string;
  method: string;
  label: string;
  qrisImage: string | null;
  bankName: string | null;
  vaNumber: string | null;
  accountName: string | null;
  gopayNumber: string | null;
  gopayName: string | null;
  instructions: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  productName: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentExpiry: string;
  paymentMethod: string | null;
}

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const loadPaymentData = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments?orderId=${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          setError('Pembayaran sudah expired. Silakan buat order baru.');
        } else {
          setError(data.error || 'Gagal memuat data');
        }
        return;
      }

      setOrder(data.order);
      setPaymentMethods(data.paymentMethods);
      if (data.order.paymentMethod) {
        setSelectedMethod(data.order.paymentMethod);
      }
    } catch {
      setError('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // Countdown timer
  useEffect(() => {
    if (!order?.paymentExpiry) return;

    const updateTimer = () => {
      const expiry = new Date(order.paymentExpiry).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0 && order.paymentStatus !== 'SUCCESS') {
        setError('Pembayaran sudah expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectMethod = async (method: string) => {
    setSelectedMethod(method);
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod: method, action: 'select_method' }),
      });
    } catch {
      // Silent fail for method selection
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      setError('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'confirm_payment' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal konfirmasi pembayaran');
        return;
      }

      setConfirmed(true);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setConfirming(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qris':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
            <rect x="18" y="18" width="3" height="3" />
          </svg>
        );
      case 'va':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'gopay':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat halaman pembayaran...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (confirmed) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="max-w-md mx-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Konfirmasi Pembayaran Dikirim!</h2>
            <p className="text-gray-500 mb-2">
              Order <span className="font-bold">{order?.orderNumber}</span> sedang menunggu verifikasi admin.
            </p>
            <p className="text-gray-500 mb-8">
              Anda akan menerima notifikasi WhatsApp setelah pembayaran diverifikasi.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/order-status/${orderId}`)}
                className="w-full h-12 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors"
              >
                Cek Status Pesanan
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="w-full h-12 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Kembali ke Shop
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="container mx-auto px-4 py-16 pt-32">
        <div className="max-w-2xl mx-auto">
          {/* Timer */}
          {timeLeft > 0 && (
            <div className={`text-center mb-6 p-4 rounded-xl ${timeLeft < 300 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className="text-sm text-gray-600 mb-1">Selesaikan pembayaran dalam</p>
              <p className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-yellow-600'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
              {error.includes('expired') && (
                <button
                  onClick={() => router.push('/shop')}
                  className="block mt-2 text-[#ee626b] font-semibold hover:underline"
                >
                  Kembali ke Shop →
                </button>
              )}
            </div>
          )}

          {order && (
            <>
              {/* Order Info */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{order.orderNumber}</h3>
                    <p className="text-gray-500 text-sm">{order.productName}</p>
                  </div>
                  <span className="text-2xl font-bold text-[#ee626b]">{formatRupiah(order.total)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pilih Metode Pembayaran</h3>
              
              <div className="space-y-4 mb-8">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.method}
                    onClick={() => handleSelectMethod(pm.method)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      selectedMethod === pm.method
                        ? 'border-[#ee626b] bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        selectedMethod === pm.method ? 'bg-[#ee626b] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {getMethodIcon(pm.method)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{pm.label}</h4>
                        {pm.instructions && (
                          <p className="text-sm text-gray-500 mt-1">{pm.instructions}</p>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === pm.method ? 'border-[#ee626b] bg-[#ee626b]' : 'border-gray-300'
                      }`}>
                        {selectedMethod === pm.method && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Show payment details when selected */}
                    {selectedMethod === pm.method && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {pm.method === 'qris' && pm.qrisImage && (
                          <div className="text-center">
                            <img src={pm.qrisImage} alt="QRIS" className="w-48 h-48 mx-auto rounded-xl" />
                            <p className="text-sm text-gray-500 mt-2">Scan QR code di atas untuk membayar</p>
                          </div>
                        )}
                        {pm.method === 'va' && (
                          <div className="space-y-2">
                            {pm.bankName && <p className="text-sm"><span className="text-gray-500">Bank:</span> <span className="font-semibold">{pm.bankName}</span></p>}
                            {pm.vaNumber && <p className="text-sm"><span className="text-gray-500">No. VA:</span> <span className="font-bold text-lg">{pm.vaNumber}</span></p>}
                            {pm.accountName && <p className="text-sm"><span className="text-gray-500">Atas Nama:</span> <span className="font-semibold">{pm.accountName}</span></p>}
                          </div>
                        )}
                        {pm.method === 'gopay' && (
                          <div className="space-y-2">
                            {pm.gopayNumber && <p className="text-sm"><span className="text-gray-500">No. GoPay:</span> <span className="font-bold text-lg">{pm.gopayNumber}</span></p>}
                            {pm.gopayName && <p className="text-sm"><span className="text-gray-500">Atas Nama:</span> <span className="font-semibold">{pm.gopayName}</span></p>}
                          </div>
                        )}
                        <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-yellow-700">
                            💰 Transfer tepat <span className="font-bold">{formatRupiah(order.total)}</span> agar pembayaran terverifikasi otomatis.
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Belum ada metode pembayaran yang dikonfigurasi.</p>
                    <p className="text-sm mt-1">Hubungi admin untuk informasi pembayaran.</p>
                  </div>
                )}
              </div>

              {/* Confirm Button */}
              {selectedMethod && timeLeft > 0 && (
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full h-14 bg-[#ee626b] text-white text-lg font-bold rounded-xl hover:bg-[#d4555d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {confirming ? 'Mengkonfirmasi...' : 'Saya Sudah Bayar'}
                </button>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

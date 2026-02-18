'use client';

import { useState, useEffect } from 'react';

interface PaymentSettingData {
  id?: string;
  method: string;
  label: string;
  enabled: boolean;
  qrisImage: string;
  bankName: string;
  vaNumber: string;
  accountName: string;
  gopayNumber: string;
  gopayName: string;
  instructions: string;
}

const defaultSettings: PaymentSettingData[] = [
  { method: 'qris', label: 'QRIS', enabled: true, qrisImage: '', bankName: '', vaNumber: '', accountName: '', gopayNumber: '', gopayName: '', instructions: 'Scan QR code untuk pembayaran' },
  { method: 'va', label: 'Virtual Account (VA)', enabled: true, qrisImage: '', bankName: '', vaNumber: '', accountName: '', gopayNumber: '', gopayName: '', instructions: 'Transfer ke nomor Virtual Account' },
  { method: 'gopay', label: 'GoPay', enabled: true, qrisImage: '', bankName: '', vaNumber: '', accountName: '', gopayNumber: '', gopayName: '', instructions: 'Transfer ke nomor GoPay' },
];

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettingData[]>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.settings && data.settings.length > 0) {
        setSettings(data.settings.map((s: PaymentSettingData) => ({
          ...s,
          qrisImage: s.qrisImage || '',
          bankName: s.bankName || '',
          vaNumber: s.vaNumber || '',
          accountName: s.accountName || '',
          gopayNumber: s.gopayNumber || '',
          gopayName: s.gopayName || '',
          instructions: s.instructions || '',
        })));
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (method: string, field: string, value: string | boolean) => {
    setSettings(prev => prev.map(s => 
      s.method === method ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const qris = settings.find(s => s.method === 'qris')!;
  const va = settings.find(s => s.method === 'va')!;
  const gopay = settings.find(s => s.method === 'gopay')!;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Settings</h1>
          <p className="text-slate-400 mt-1">Konfigurasi metode pembayaran QRIS, VA, dan GoPay</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Semua'}
        </button>
      </div>

      <div className="space-y-6">
        {/* QRIS Settings */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">QRIS</h3>
                <p className="text-slate-400 text-sm">Pembayaran via QR Code</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={qris.enabled}
                onChange={(e) => handleChange('qris', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-checked:bg-green-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">URL Gambar QRIS</label>
              <input
                type="text"
                value={qris.qrisImage}
                onChange={(e) => handleChange('qris', 'qrisImage', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-purple-500"
                placeholder="https://example.com/qris.png"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Instruksi Pembayaran</label>
              <input
                type="text"
                value={qris.instructions}
                onChange={(e) => handleChange('qris', 'instructions', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-purple-500"
                placeholder="Instruksi untuk customer"
              />
            </div>
          </div>
          {qris.qrisImage && (
            <div className="mt-4">
              <img src={qris.qrisImage} alt="QRIS Preview" className="w-32 h-32 rounded-xl object-cover border border-slate-700" />
            </div>
          )}
        </div>

        {/* VA Settings */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Virtual Account (VA)</h3>
                <p className="text-slate-400 text-sm">Transfer bank via Virtual Account</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={va.enabled}
                onChange={(e) => handleChange('va', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-checked:bg-green-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nama Bank</label>
              <input
                type="text"
                value={va.bankName}
                onChange={(e) => handleChange('va', 'bankName', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="BCA, BNI, Mandiri, dll"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nomor VA</label>
              <input
                type="text"
                value={va.vaNumber}
                onChange={(e) => handleChange('va', 'vaNumber', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Atas Nama</label>
              <input
                type="text"
                value={va.accountName}
                onChange={(e) => handleChange('va', 'accountName', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Nama pemilik rekening"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Instruksi</label>
              <input
                type="text"
                value={va.instructions}
                onChange={(e) => handleChange('va', 'instructions', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Instruksi untuk customer"
              />
            </div>
          </div>
        </div>

        {/* GoPay Settings */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">GoPay</h3>
                <p className="text-slate-400 text-sm">Pembayaran via GoPay</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gopay.enabled}
                onChange={(e) => handleChange('gopay', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-checked:bg-green-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nomor GoPay</label>
              <input
                type="text"
                value={gopay.gopayNumber}
                onChange={(e) => handleChange('gopay', 'gopayNumber', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-green-500"
                placeholder="0859xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nama GoPay</label>
              <input
                type="text"
                value={gopay.gopayName}
                onChange={(e) => handleChange('gopay', 'gopayName', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-green-500"
                placeholder="Nama pemilik GoPay"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Instruksi</label>
              <input
                type="text"
                value={gopay.instructions}
                onChange={(e) => handleChange('gopay', 'instructions', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-green-500"
                placeholder="Instruksi untuk customer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bottom */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}

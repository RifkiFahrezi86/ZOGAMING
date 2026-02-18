// WhatsApp notification via Fonnte API
// Register at https://fonnte.com to get your API token

const FONNTE_API_URL = 'https://api.fonnte.com/send';

interface SendMessageParams {
  phone: string;  // Format: 6285xxxxxxxxx (with country code)
  message: string;
}

export async function sendWhatsApp({ phone, message }: SendMessageParams): Promise<boolean> {
  const token = process.env.FONNTE_API_TOKEN;
  
  if (!token || token === 'your-fonnte-api-token') {
    console.log('[WhatsApp] Token not configured. Message would be sent to:', phone);
    console.log('[WhatsApp] Message:', message);
    return false;
  }

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: '62',
      }),
    });

    const data = await response.json();
    console.log('[WhatsApp] Send result:', data);
    return data.status === true;
  } catch (error) {
    console.error('[WhatsApp] Failed to send:', error);
    return false;
  }
}

// Notify admin about successful payment
export async function notifyAdminPayment(orderNumber: string, customerName: string, total: number): Promise<boolean> {
  const adminPhone = process.env.ADMIN_WHATSAPP || '6285954092060';
  const message = `🔔 *PEMBAYARAN BERHASIL*\n\n` +
    `Order *${orderNumber}* sudah dibayar dan siap diproses.\n\n` +
    `👤 Customer: ${customerName}\n` +
    `💰 Total: Rp ${total.toLocaleString('id-ID')}\n\n` +
    `Silakan proses pesanan di Admin Panel.`;
  
  return sendWhatsApp({ phone: adminPhone, message });
}

// Notify customer about processing status
export async function notifyCustomerProcessing(phone: string, orderNumber: string): Promise<boolean> {
  const message = `✅ *PEMBAYARAN DITERIMA*\n\n` +
    `Halo! Pembayaran untuk order *${orderNumber}* telah diterima.\n\n` +
    `Pesanan Anda sedang diproses oleh admin.\n\n` +
    `⏰ *Estimasi waktu: Maksimal 30 menit*\n` +
    `Jika lebih dari 30 menit pesanan belum diterima, uang akan dikembalikan.\n\n` +
    `Terima kasih telah berbelanja di ZOGAMING! 🎮`;
  
  return sendWhatsApp({ phone, message });
}

// Notify customer about account delivery
export async function notifyCustomerDelivery(
  phone: string, 
  orderNumber: string, 
  accountEmail: string, 
  accountPassword: string
): Promise<boolean> {
  const message = `🎮 *PESANAN SELESAI*\n\n` +
    `Order ID: *${orderNumber}*\n\n` +
    `Berikut akun Anda:\n` +
    `📧 Email: ${accountEmail}\n` +
    `🔑 Password: ${accountPassword}\n\n` +
    `Segera ubah password setelah login.\n` +
    `Terima kasih telah berbelanja di ZOGAMING! 🎮`;
  
  return sendWhatsApp({ phone, message });
}

// Notify customer about cancellation/refund
export async function notifyCustomerCancelled(phone: string, orderNumber: string): Promise<boolean> {
  const message = `❌ *PESANAN DIBATALKAN*\n\n` +
    `Order *${orderNumber}* telah dibatalkan karena pembayaran expired.\n\n` +
    `Jika Anda sudah melakukan pembayaran, silakan hubungi admin untuk proses refund.\n\n` +
    `ZOGAMING 🎮`;
  
  return sendWhatsApp({ phone, message });
}

// Notify customer about refund (30 min timeout)
export async function notifyCustomerRefund(phone: string, orderNumber: string): Promise<boolean> {
  const message = `💰 *REFUND DIPROSES*\n\n` +
    `Order *${orderNumber}* belum diproses dalam 30 menit.\n\n` +
    `Uang Anda akan dikembalikan. Mohon tunggu 1x24 jam untuk proses refund.\n\n` +
    `Kami mohon maaf atas ketidaknyamanannya.\n` +
    `ZOGAMING 🎮`;
  
  return sendWhatsApp({ phone, message });
}

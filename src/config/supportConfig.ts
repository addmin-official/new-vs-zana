/**
 * ZANA Platform - Official Support & Payment Configuration
 * ڕێکخستنی فەرمی ژووری پشتگیری و پارەدانی فاستپەی
 */

export interface SupportConfig {
  whatsappNumber: string;
  fastPayNumber: string;
  telegramUsername: string;
  monthlyPrice: string;
  yearlyPrice: string;
}

export const SUPPORT_CONFIG: SupportConfig = {
  // ژمارەی مۆبایل و واتسئەپی فەرمی
  whatsappNumber: (import.meta.env.VITE_SUPPORT_WHATSAPP as string) || "9647511559892",

  // ژمارەی فاستپەی (FastPay) بۆ وەرگرتنی پارەی بەشداریکردن
  fastPayNumber: (import.meta.env.VITE_FASTPAY_NUMBER as string) || "0751 155 9892",

  // ناوی بەکارهێنەری تێلیگرام بۆ پەیوەندی ڕاستەوخۆ
  telegramUsername: (import.meta.env.VITE_SUPPORT_TELEGRAM as string) || "zana_support",

  // نرخی بەشداریکردنی مانگانە و ساڵانە
  monthlyPrice: "١٥,٠٠٠ دینار",
  yearlyPrice: "٩٥,٠٠٠ دینار",
};

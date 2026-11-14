import React, { useState } from "react";
import { Bell, Globe, Shield } from "lucide-react";
import { ku } from "../i18n/translations.ts";

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-[600px] mx-auto w-full p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-sans font-bold text-2xl text-slate-900">
          {ku.settings.title}
        </h1>
        <p className="font-sans text-xs text-slate-500 mt-1">
          ڕێکخستنی ئاگادارکردنەوەکان، زمان، و شێوازی فێربوون
        </p>
      </div>

      {/* Notifications card */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-slate-800 font-sans font-bold text-base border-b border-slate-50 pb-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2>ئاگادارکردنەوە و دەنگ</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans font-bold text-sm text-slate-800">{ku.settings.notifications}</p>
              <p className="font-sans text-xs text-slate-500 mt-0.5">{ku.settings.notificationsDesc}</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                notifications ? "bg-blue-600 justify-start" : "bg-slate-300 justify-end"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div>
              <p className="font-sans font-bold text-sm text-slate-800">{ku.settings.emailUpdates}</p>
              <p className="font-sans text-xs text-slate-500 mt-0.5">{ku.settings.emailUpdatesDesc}</p>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                emailAlerts ? "bg-blue-600 justify-start" : "bg-slate-300 justify-end"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div>
              <p className="font-sans font-bold text-sm text-slate-800">دەنگی فێربوون و تاقیکردنەوەکان</p>
              <p className="font-sans text-xs text-slate-500 mt-0.5">لێدانی دەنگ لە کاتی وەڵامدانەوەی ڕاست و هەڵە</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                soundEnabled ? "bg-blue-600 justify-start" : "bg-slate-300 justify-end"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>
      </section>

      {/* Language & Theme */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-sans font-bold text-base border-b border-slate-50 pb-3">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2>زمان و ڕووکار</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans font-bold text-sm text-slate-800">زمانی پلاتفۆرم</p>
            <p className="font-sans text-xs text-slate-500 mt-0.5">کوردی سۆرانی (RTL)</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg">
            فەرمی
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div>
            <p className="font-sans font-bold text-sm text-slate-800">{ku.settings.theme}</p>
            <p className="font-sans text-xs text-slate-500 mt-0.5">{ku.settings.themeLight}</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg">
            ڕووناک
          </span>
        </div>
      </section>

      {/* Security Info */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-2 text-right">
        <div className="flex items-center gap-2 text-slate-800 font-sans font-bold text-base">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2>پاراستن و بەڵگەنامەکان</h2>
        </div>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          سەرجەم داتاکان پارێزراون لەژێر ڕێساکانی توندوتۆڵی Cloudflare Workers و مۆڵەتی فەرمیی خوێندنی وەزارەتی پەروەردەی هەرێمی کوردستان.
        </p>
      </section>
    </div>
  );
}

export default Settings;

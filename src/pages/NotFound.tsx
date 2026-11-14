import React from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

export interface NotFoundProps {
  onBackHome?: () => void;
}

export function NotFound({ onBackHome }: NotFoundProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="font-sans font-bold text-2xl text-slate-900">
        پەڕەکە نەدۆزرایەوە (404)
      </h1>

      <p className="font-sans text-sm text-slate-600 leading-relaxed">
        ببوورە، ئەو پەڕەیەی بەدوایدا دەگەڕێیت لە پلاتفۆرمی زانا بەردەست نییە یان ناونیشانەکەی گۆڕدراوە.
      </p>

      {onBackHome && (
        <button
          onClick={onBackHome}
          className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>گەڕانەوە بۆ سەرەتا</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default NotFound;

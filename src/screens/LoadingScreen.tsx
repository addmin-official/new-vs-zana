import { GraduationCap, Loader2 } from "lucide-react";

interface LoadingScreenProps {
 message?: string;
}

export function LoadingScreen({ message = "چاوەڕوان بە..." }: LoadingScreenProps) {
 return (
 <div
 dir="rtl"
 className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4 transition-colors font-sans selection:bg-blue-600 selection:text-white"
 >
 <div className="bg-white/80/80 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
 <div className="relative">
 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
 <GraduationCap className="w-9 h-9" />
 </div>
 <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
 <span className="w-2 h-2 bg-white rounded-full animate-ping" />
 </div>
 </div>

 <div className="space-y-1">
 <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
 زانا
 </h1>
 <p className="text-xs text-blue-600 font-medium">
 هاوڕێی زیرەکی فێربوونی تۆ
 </p>
 </div>

 <div className="flex items-center gap-2.5 text-slate-600 pt-2">
 <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
 <span className="text-sm font-medium">{message}</span>
 </div>
 </div>
 </div>
 );
}

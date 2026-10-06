import React, { useEffect } from "react";
import { useIsAdmin } from "../hooks/useIsAdmin.ts";

export function AdminRoute({ children }: { children: React.ReactNode }) {
 const { isAdmin, loading } = useIsAdmin();

 useEffect(() => {
 if (!loading && !isAdmin && typeof window !== "undefined") {
 if (window.location.pathname.startsWith("/admin")) {
 // Safe redirect to root if unauthorized
 window.history.replaceState(null, "", "/");
 }
 }
 }, [isAdmin, loading]);

 if (loading) {
 return (
 <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
 <span className="text-xs font-mono">پشکنینی دەسەڵاتەکانی ئادمین...</span>
 </div>
 );
 }

 if (!isAdmin) {
 return (
 <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center" dir="rtl">
 <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
 <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center mb-4">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <h2 className="text-lg font-bold text-white mb-2">دەستگەیشتن سنووردارکراوە (403 Forbidden)</h2>
 <p className="text-sm text-slate-400 mb-6">
 داشبۆردی مێشکی پۆرتاڵ تەنها بۆ بەڕێوەبەری پڕۆژە (addmin.official.idg@gmail.com) ڕێپێدراوە.
 </p>
 <button
 type="button"
 onClick={() => {
 window.location.href = "/";
 }}
 className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
 >
 گەڕانەوە بۆ پۆرتاڵی خوێندکار
 </button>
 </div>
 </div>
 );
 }

 return <>{children}</>;
}

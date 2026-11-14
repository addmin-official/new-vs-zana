import React, { useState } from "react";
import { User, Camera, LogOut, Trash2, ShieldAlert, Lock } from "lucide-react";
import { Modal } from "../components/Modal.tsx";
import { useAppStore } from "../store/appStore.ts";
import { ku } from "../i18n/translations.ts";

export function Profile() {
  const user = useAppStore((state) => state.user);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const clearChatHistory = useAppStore((state) => state.clearChatHistory);
  const logout = useAppStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const _grade = user.grade;
  const _stream = user.stream;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(false);

  // Modals for danger actions
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
  };

  return (
    <div className="max-w-[600px] mx-auto w-full p-4 sm:p-6 space-y-6" dir="rtl">
      {/* 1. Avatar & Basic Info Card */}
      <section className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full border-4 border-blue-600 bg-blue-50 text-blue-700 flex items-center justify-center overflow-hidden shadow-xs">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-blue-600" />
            )}
          </div>
          <button
            onClick={() => alert("گۆڕینی وێنەی پرۆفایل لەم وەشانەدا پشتیوانی دەکرێت.")}
            className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={ku.profile.uploadPhoto}
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="font-sans font-bold text-xl text-slate-900">{user.name}</h2>
          <p className="font-sans text-xs text-slate-500 mt-0.5">{user.email}</p>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-blue-50 text-blue-700 font-sans font-bold text-xs px-3 py-1 rounded-full">
            <span>پۆلی {user.grade}</span>
            <span>•</span>
            <span>{user.stream === "scientific" ? ku.profile.streamScientific : ku.profile.streamLiterary}</span>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            {ku.profile.editProfile}
          </button>
        )}
      </section>

      {/* 2. Edit Profile Form */}
      {isEditing && (
        <section className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100 space-y-4 animate-in fade-in duration-150">
          <h3 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
            {ku.profile.editProfile}
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">{ku.profile.nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{ku.profile.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-700 text-xs">{ku.profile.gradeLabel}</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold">
                <span>پۆلی {user.grade || "١٢"}ی ئامادەیی</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>جێگیرکراوە</span>
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-700 text-xs">{ku.profile.streamLabel}</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <span>{user.stream === "literary" ? "بەشی وێژەیی 📚" : "بەشی زانستی 🔬"}</span>
                  {user.stream === "literary" && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>جێگیرکراوە</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                پۆل و بەش تەنها یەک جار لە کاتی خۆتۆمارکردن دیاری دەکرێن و ناتوانرێت بگۆڕدرێن.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              >
                {ku.profile.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
              >
                {ku.profile.saveChanges}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 3. Settings Section */}
      <section className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100 space-y-4">
        <h3 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
          {ku.settings.title}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans font-bold text-sm text-slate-800">{ku.settings.notifications}</p>
              <p className="font-sans text-xs text-slate-500 mt-0.5">{ku.settings.notificationsDesc}</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                notificationsEnabled ? "bg-blue-600 justify-start" : "bg-slate-300 justify-end"
              }`}
              aria-label={ku.settings.notifications}
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
              onClick={() => setEmailUpdatesEnabled(!emailUpdatesEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                emailUpdatesEnabled ? "bg-blue-600 justify-start" : "bg-slate-300 justify-end"
              }`}
              aria-label={ku.settings.emailUpdates}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Danger Zone */}
      <section className="bg-white shadow-sm rounded-2xl p-6 border border-red-100 space-y-4">
        <div className="flex items-center gap-2 text-red-600 border-b border-red-50 pb-2">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-sans font-bold text-base">{ku.profile.dangerZone}</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setConfirmClearOpen(true)}
            className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 rounded-xl px-4 py-2.5 font-sans font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{ku.profile.clearHistory}</span>
          </button>

          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 font-sans font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{ku.profile.logout}</span>
          </button>
        </div>
      </section>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title={ku.profile.clearHistory}
      >
        <div className="space-y-4 text-right">
          <p className="text-slate-600 text-sm leading-relaxed">
            {ku.profile.clearHistoryConfirm}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmClearOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              {ku.profile.cancel}
            </button>
            <button
              onClick={() => {
                clearChatHistory();
                setConfirmClearOpen(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              بەڵێ، پاکیبکەرەوە
            </button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title={ku.profile.logout}
      >
        <div className="space-y-4 text-right">
          <p className="text-slate-600 text-sm leading-relaxed">
            {ku.profile.logoutConfirm}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmLogoutOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              {ku.profile.cancel}
            </button>
            <button
              onClick={() => {
                logout();
                setConfirmLogoutOpen(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              دەرچوون
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Profile;

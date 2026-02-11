'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG } from '@/types';

export default function ProfilePage() {
  const { currentUser, authUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    role: '', // Job title
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role || '',
      });
    }
  }, [currentUser]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authUser && !currentUser) {
      router.push('/login');
    }
  }, [authUser, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          avatar: formData.avatar,
          role: formData.role || null,
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Refresh the page to reload user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fout bij opslaan van profiel. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  // Generate avatar URL from name (using UI Avatars)
  const generateAvatar = () => {
    const initials = formData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const colors = ['3b82f6', '8b5cf6', 'ec4899', '10b981', 'f59e0b', 'ef4444'];
    const colorIndex = formData.name.length % colors.length;
    const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=${colors[colorIndex]}&color=fff&size=128`;
    setFormData({ ...formData, avatar: newAvatar });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roleConfig = USER_ROLE_CONFIG[currentUser.userRole];
  const statusConfig = USER_STATUS_CONFIG[currentUser.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mijn Profiel</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
            <div className="flex items-center gap-4">
              <Image
                src={formData.avatar || currentUser.avatar}
                alt={formData.name || currentUser.name}
                width={80}
                height={80}
                unoptimized
                className="w-20 h-20 rounded-full ring-4 ring-white/30"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{formData.name || currentUser.name}</h2>
                <p className="text-blue-100">{currentUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleConfig.bgColor} ${roleConfig.color}`}>
                    {roleConfig.label}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Profiel succesvol bijgewerkt!</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Naam *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Je volledige naam"
              />
            </div>

            {/* Job Title / Role Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Functie
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="bijv. Frontend Developer, UX Designer"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
                <button
                  type="button"
                  onClick={generateAvatar}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                             hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors
                             whitespace-nowrap"
                >
                  Genereer
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Voer een URL in of klik op &quot;Genereer&quot; voor een avatar op basis van je naam
              </p>
            </div>

            {/* Avatar Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <Image
                  src={formData.avatar || currentUser.avatar}
                  alt="Avatar preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.name || 'Je naam'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formData.role || 'Geen functie'}</p>
                </div>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={currentUser.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                           bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400
                           cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                E-mailadres kan niet worden gewijzigd
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/"
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 
                           dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
                           rounded-lg transition-colors"
              >
                Annuleren
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                           text-white rounded-lg transition-colors font-medium flex items-center 
                           justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Opslaan...
                  </>
                ) : (
                  'Profiel Opslaan'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

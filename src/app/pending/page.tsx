'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

export default function PendingApprovalPage() {
  const { currentUser, signOut, isRejected } = useAuth();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  if (isRejected) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`w-full max-w-md p-8 rounded-xl shadow-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Toegang geweigerd
          </h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Je aanvraag is helaas afgewezen door een beheerder. Neem contact op met de administrator voor meer informatie.
          </p>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition"
          >
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Wachten op goedkeuring
        </h2>
        <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Welkom, <strong>{currentUser?.name || 'gebruiker'}</strong>!
        </p>
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Je account wacht nog op goedkeuring door een beheerder. Je krijgt toegang zodra je aanvraag is goedgekeurd.
        </p>
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Status: Wachtend op goedkeuring
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition"
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}

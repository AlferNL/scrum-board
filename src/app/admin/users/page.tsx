'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole, UserStatus, USER_ROLE_CONFIG, USER_STATUS_CONFIG } from '@/types';
import Image from 'next/image';

interface DbUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  user_role: string;
  status: string;
  auth_id: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    user_role: 'MEMBER' as UserRole,
    status: 'APPROVED' as UserStatus,
    avatar: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users by status
  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const approvedUsers = users.filter(u => u.status === 'APPROVED');
  const rejectedUsers = users.filter(u => u.status === 'REJECTED');

  const handleOpenModal = (user?: DbUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role || '',
        user_role: (user.user_role as UserRole) || 'MEMBER',
        status: (user.status as UserStatus) || 'PENDING',
        avatar: user.avatar || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: '',
        user_role: 'MEMBER',
        status: 'APPROVED',
        avatar: '',
      });
    }
    setShowModal(true);
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'APPROVED' })
        .eq('id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Fout bij goedkeuren: ' + (error as Error).message);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt afwijzen?')) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'REJECTED' })
        .eq('id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Fout bij afwijzen: ' + (error as Error).message);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return;

    setSaving(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        user_role: formData.user_role,
        status: formData.status,
        avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name)}`,
      };

      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert([userData]);
        if (error) throw error;
      }

      await fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Fout bij opslaan: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fout bij verwijderen: ' + (error as Error).message);
    }
  };

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'ADMIN', label: 'Admin', description: 'Volledige toegang tot alles' },
    { value: 'PRODUCT_OWNER', label: 'Product Owner', description: 'Kan stories beheren en prioriteren' },
    { value: 'SCRUM_MASTER', label: 'Scrum Master', description: 'Kan stories beheren en prioriteren' },
    { value: 'MEMBER', label: 'Lid', description: 'Kan taken verplaatsen en bewerken' },
    { value: 'VIEWER', label: 'Kijker', description: 'Alleen bekijken, geen wijzigingen' },
  ];

  const statusOptions: { value: UserStatus; label: string; description: string }[] = [
    { value: 'APPROVED', label: 'Goedgekeurd', description: 'Heeft toegang tot het systeem' },
    { value: 'PENDING', label: 'Wachtend', description: 'Wacht op goedkeuring' },
    { value: 'REJECTED', label: 'Afgewezen', description: 'Geen toegang' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  const UserRow = ({ user, showApprovalButtons = false }: { user: DbUser; showApprovalButtons?: boolean }) => {
    const roleConfig = USER_ROLE_CONFIG[user.user_role as UserRole] || USER_ROLE_CONFIG.MEMBER;
    const statusConfig = USER_STATUS_CONFIG[user.status as UserStatus] || USER_STATUS_CONFIG.PENDING;
    
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-gray-700 dark:text-gray-300">{user.role || '-'}</span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
            {roleConfig.label}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {showApprovalButtons && (
              <>
                <button
                  onClick={() => handleApprove(user.id)}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Goedkeuren"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleReject(user.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Afwijzen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={() => handleOpenModal(user)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Bewerken"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Verwijderen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const TableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-700/50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Gebruiker
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Functie
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Rol
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Acties
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gebruikers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Beheer gebruikers en hun rollen
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe Gebruiker
        </button>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Wachtend op goedkeuring ({pendingUsers.length})
            </h2>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800 overflow-hidden">
            <table className="w-full">
              <TableHeader />
              <tbody className="divide-y divide-yellow-200 dark:divide-yellow-800">
                {pendingUsers.map((user) => (
                  <UserRow key={user.id} user={user} showApprovalButtons />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Actieve gebruikers ({approvedUsers.length})
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <TableHeader />
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {approvedUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
              {approvedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Geen actieve gebruikers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Afgewezen ({rejectedUsers.length})
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-200 dark:border-red-800 overflow-hidden">
            <table className="w-full">
              <TableHeader />
              <tbody className="divide-y divide-red-200 dark:divide-red-800">
                {rejectedUsers.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Avatar Preview */}
              <div className="flex justify-center">
                <Image
                  src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || 'default')}`}
                  alt="Avatar"
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Volledige naam"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@voorbeeld.nl"
                />
              </div>

              {/* Job Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Functie
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="bv. Frontend Developer"
                />
              </div>

              {/* User Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol in systeem *
                </label>
                <div className="space-y-2">
                  {roleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                        ${formData.user_role === option.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="user_role"
                        value={option.value}
                        checked={formData.user_role === option.value}
                        onChange={(e) => setFormData({ ...formData, user_role: e.target.value as UserRole })}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                        ${formData.status === option.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.email}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {editingUser ? 'Opslaan' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

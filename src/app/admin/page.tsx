'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalSprints: number;
  totalStories: number;
  totalTasks: number;
  completedTasks: number;
  usersByRole: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalSprints: 0,
    totalStories: 0,
    totalTasks: 0,
    completedTasks: 0,
    usersByRole: {},
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch counts
      const [
        { count: usersCount },
        { count: projectsCount },
        { count: sprintsCount },
        { count: storiesCount },
        { count: tasksCount },
        { count: completedCount },
        { data: usersData },
        { data: recentTasks },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('sprints').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('users').select('user_role'),
        supabase.from('tasks').select('*, users:assignee_id(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      // Calculate users by role
      const roleCount: Record<string, number> = {};
      usersData?.forEach((u: any) => {
        const role = u.user_role || 'MEMBER';
        roleCount[role] = (roleCount[role] || 0) + 1;
      });

      setStats({
        totalUsers: usersCount || 0,
        totalProjects: projectsCount || 0,
        totalSprints: sprintsCount || 0,
        totalStories: storiesCount || 0,
        totalTasks: tasksCount || 0,
        completedTasks: completedCount || 0,
        usersByRole: roleCount,
      });

      setRecentActivity(recentTasks || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Gebruikers', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500', href: '/admin/users' },
    { label: 'Projecten', value: stats.totalProjects, icon: '📁', color: 'bg-purple-500', href: '/admin/projects' },
    { label: 'Sprints', value: stats.totalSprints, icon: '🏃', color: 'bg-green-500', href: '/admin/projects' },
    { label: 'User Stories', value: stats.totalStories, icon: '📋', color: 'bg-amber-500', href: '/admin/projects' },
    { label: 'Taken', value: stats.totalTasks, icon: '✅', color: 'bg-indigo-500', href: '/' },
    { label: 'Voltooid', value: stats.completedTasks, icon: '🎉', color: 'bg-emerald-500', href: '/' },
  ];

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admins',
    PRODUCT_OWNER: 'Product Owners',
    MEMBER: 'Leden',
    VIEWER: 'Kijkers',
  };

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overzicht van je Scrum Board applicatie
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Users by Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gebruikers per Rol
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    role === 'ADMIN' ? 'bg-red-500' :
                    role === 'PRODUCT_OWNER' ? 'bg-purple-500' :
                    role === 'MEMBER' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {roleLabels[role] || role}
                  </span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
            {Object.keys(stats.usersByRole).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Geen gebruikers gevonden</p>
            )}
          </div>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Beheer gebruikers →
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recente Taken
          </h2>
          <div className="space-y-3">
            {recentActivity.map((task) => (
              <div key={task.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  task.status === 'done' ? 'bg-green-500' :
                  task.status === 'in-progress' ? 'bg-blue-500' :
                  task.status === 'review' ? 'bg-amber-500' : 'bg-gray-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.users?.name || 'Niet toegewezen'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  task.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Geen recente taken</p>
            )}
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Bekijk board →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Snelle Acties
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            + Nieuwe Gebruiker
          </Link>
          <Link
            href="/admin/projects"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            + Nieuw Project
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            Naar Scrum Board
          </Link>
        </div>
      </div>
    </div>
  );
}

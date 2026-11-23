import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FileText,
  UserPlus,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer } from '../common/Toast';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      name: 'Overview',
      path: '/admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true,
    },
    {
      name: 'Documents',
      path: '/admin/documents',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      name: 'Employee Accounts',
      path: '/admin/employees',
      icon: <UserPlus className="w-4 h-4" />,
    },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/admin') return 'Overview';
    if (location.pathname.startsWith('/admin/documents')) return 'Policy Documents';
    if (location.pathname.startsWith('/admin/employees')) return 'Employee Accounts';
    return 'Admin Portal';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm shadow-sky-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white">PolicyPilot</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">Admin Management</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin User Profile & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Admin
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block w-64 h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-slate-900">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Engine Connected
            </span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

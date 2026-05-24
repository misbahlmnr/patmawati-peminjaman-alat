import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Box,
  FileText,
  Users,
  Bell,
  Settings,
  LogOut,
  Camera,
  ClipboardList,
  History,
  BarChart3,
  X,
  Wrench,
  Package,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Kelola Pengguna', path: '/users' },
  { icon: Wrench, label: 'Kelola Alat', path: '/equipment?tab=alat' },
  { icon: Package, label: 'Kelola Bahan', path: '/equipment?tab=bahan' },
  { icon: ClipboardList, label: 'Peminjaman', path: '/loans' },
  { icon: CreditCard, label: 'Jaminan Kartu', path: '/collateral' },
  { icon: Bell, label: 'Notifikasi', path: '/notifications' },
  { icon: BarChart3, label: 'Laporan', path: '/reports' },
];

const guruMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Box, label: 'Inventaris', path: '/equipment' },
  { icon: ClipboardList, label: 'Peminjaman Siswa', path: '/loans' },
  { icon: History, label: 'Riwayat', path: '/history' },
  { icon: BarChart3, label: 'Laporan', path: '/reports' },
];

const siswaMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Wrench, label: 'Alat Lab', path: '/equipment?tab=alat' },
  { icon: Package, label: 'Bahan Lab', path: '/equipment?tab=bahan' },
  { icon: FileText, label: 'Ajukan Peminjaman', path: '/request-loan' },
  { icon: ClipboardList, label: 'Peminjaman Saya', path: '/my-loans' },
  { icon: History, label: 'Riwayat', path: '/history' },
  { icon: Bell, label: 'Notifikasi', path: '/notifications' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = user?.role === 'admin' 
    ? adminMenuItems 
    : user?.role === 'guru' 
    ? guruMenuItems 
    : siswaMenuItems;


  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 gradient-hero flex flex-col transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Camera className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-sidebar-foreground text-sm">Lab Audio Video</h1>
                <p className="text-xs text-sidebar-foreground/60">SMKN 7 Bekasi</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const [pathOnly, queryStr] = item.path.split('?');
              const itemTab = new URLSearchParams(queryStr || '').get('tab');
              const currentTab = new URLSearchParams(location.search).get('tab');
              const isActive = location.pathname === pathOnly &&
                (itemTab ? currentTab === itemTab : true);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "nav-link",
                      isActive && "nav-link-active"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="nav-link w-full text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}

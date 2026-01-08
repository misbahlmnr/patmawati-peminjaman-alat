import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsData } from '@/data/mockData';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  
  const unreadNotifications = notificationsData.filter(
    n => n.userId === user?.id && !n.read
  ).length;

  return (
    <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-secondary lg:hidden"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-4 py-2 w-72">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari peralatan, peminjaman..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <div className="hidden sm:block text-sm text-muted-foreground">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">
              {user?.name?.charAt(0)}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'siswa' ? user.class : user?.role === 'admin' ? 'Administrator' : 'Guru'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

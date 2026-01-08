import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsData } from '@/data/mockData';
import { Bell, AlertTriangle, CheckCircle2, Info, XCircle, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(notificationsData);

  const userNotifications = notifications.filter(n => 
    user?.role === 'admin' || n.userId === user?.id
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success bg-success/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'error': return 'text-destructive bg-destructive/10';
      default: return 'text-info bg-info/10';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="btn-outline"
          >
            <Check className="w-4 h-4 mr-2" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Notifications List */}
      {userNotifications.length > 0 ? (
        <div className="space-y-3">
          {userNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={cn(
                  "bg-card rounded-xl border p-5 transition-all hover:shadow-elevated",
                  notification.read ? 'border-border' : 'border-primary/30 bg-primary/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    getIconColor(notification.type)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          "font-medium",
                          !notification.read && 'text-foreground',
                          notification.read && 'text-muted-foreground'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.createdAt), "d MMMM yyyy, HH:mm", { locale: id })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Tandai dibaca"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">Tidak ada notifikasi</p>
          <p className="text-muted-foreground">
            Anda akan menerima notifikasi terkait peminjaman di sini
          </p>
        </div>
      )}
    </div>
  );
}

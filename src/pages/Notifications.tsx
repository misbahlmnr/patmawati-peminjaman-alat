import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Bell, AlertTriangle, CheckCircle2, Info, XCircle, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, markRead, markAllRead, deleteNotification } = useData();
  const navigate = useNavigate();

  const myNotifs = useMemo(() => notifications
    .filter(n => user?.role === 'admin' ? n.userId === user.id : n.userId === user?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  , [notifications, user]);

  const unreadCount = myNotifs.filter(n => !n.read).length;

  const getIcon = (t: string) => t === 'success' ? CheckCircle2 : t === 'warning' ? AlertTriangle : t === 'error' ? XCircle : Info;
  const getColor = (t: string) => t === 'success' ? 'text-success bg-success/10' : t === 'warning' ? 'text-warning bg-warning/10' : t === 'error' ? 'text-destructive bg-destructive/10' : 'text-info bg-info/10';

  const handleClick = (id: string, loanId?: string) => {
    markRead(id);
    if (loanId) {
      navigate(user?.role === 'admin' || user?.role === 'guru' ? '/loans' : '/my-loans');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && user && (
          <button onClick={() => markAllRead(user.id)} className="btn-outline">
            <Check className="w-4 h-4 mr-2" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {myNotifs.length > 0 ? (
        <div className="space-y-3">
          {myNotifs.map(n => {
            const Icon = getIcon(n.type);
            return (
              <div key={n.id} className={cn('bg-card rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md',
                n.read ? 'border-border' : 'border-primary/30 bg-primary/5')}
                onClick={() => handleClick(n.id, n.loanId)}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', getColor(n.type))}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={cn('font-medium text-sm', !n.read && 'text-foreground')}>{n.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(n.createdAt), 'd MMM yyyy, HH:mm', { locale: localeId })}
                        </p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <p className="font-medium mb-1">Tidak ada notifikasi</p>
        </div>
      )}
    </div>
  );
}

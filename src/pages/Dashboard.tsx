import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentLoansTable } from '@/components/dashboard/RecentLoansTable';
import {
  ClipboardCheck, FileText, AlertTriangle, PackageMinus, Bell,
  Wrench, Package, ArrowRight, CheckCircle2, Users as UsersIcon,
  CalendarDays, CreditCard, ListOrdered,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user } = useAuth();
  const { loans, equipment, notifications, schedules, getSchedulesForClass } = useData();

  const pendingAlat = loans.filter(l => l.status === 'diminta' && l.itemType === 'alat');
  const queueAlat = loans.filter(l => l.status === 'antrian' && l.itemType === 'alat');
  const activeAlat = loans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const overdue = loans.filter(l => l.status === 'terlambat');
  const lowStock = equipment.filter(e => e.itemType === 'bahan' && e.minStock !== undefined && (e.stockRemaining ?? e.available) <= e.minStock);
  const heldCards = loans.filter(l => l.collateral?.status === 'ditahan');

  const today = new Date(); const weekEnd = new Date(); weekEnd.setDate(today.getDate() + 7);
  const activeSchedulesWeek = schedules.filter(s => s.status === 'aktif' && s.tanggal >= today.toISOString().slice(0, 10) && s.tanggal <= weekEnd.toISOString().slice(0, 10));

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const bahanThisWeek = loans.filter(l => l.itemType === 'bahan' && new Date(l.requestDate) >= weekAgo);

  // ===== ADMIN =====
  const renderAdmin = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Permintaan Pending" value={pendingAlat.length} icon={ClipboardCheck} variant={pendingAlat.length > 0 ? 'warning' : 'default'} />
        <StatCard title="Antrian Konflik Stok" value={queueAlat.length} icon={ListOrdered} variant={queueAlat.length > 0 ? 'warning' : 'default'} />
        <StatCard title="Jadwal Aktif (7 hari)" value={activeSchedulesWeek.length} icon={CalendarDays} variant="primary" />
        <StatCard title="Kartu Ditahan" value={heldCards.length} icon={CreditCard} variant={heldCards.length > 0 ? 'warning' : 'default'} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Alat Dipinjam" value={activeAlat.length} icon={FileText} variant="primary" />
        <StatCard title="Keterlambatan" value={overdue.length} icon={AlertTriangle} variant={overdue.length > 0 ? 'danger' : 'default'} />
        <StatCard title="Stok Bahan Menipis" value={lowStock.length} icon={PackageMinus} variant={lowStock.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Verifikasi Permintaan
              {pendingAlat.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-xs font-bold">{pendingAlat.length}</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Permintaan peminjaman alat menunggu persetujuan.</p>
          </div>
          <Button asChild>
            <Link to="/loans">Buka Verifikasi <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
        {pendingAlat.length > 0 ? (
          <RecentLoansTable loans={pendingAlat.slice(0, 5)} />
        ) : (
          <div className="text-center py-10">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Tidak ada permintaan menunggu</p>
          </div>
        )}
      </div>
    </>
  );

  // ===== GURU =====
  const renderGuru = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Siswa Pinjam Aktif" value={activeAlat.length} icon={UsersIcon} variant="primary" />
        <StatCard title="Keterlambatan" value={overdue.length} icon={AlertTriangle} variant={overdue.length > 0 ? 'danger' : 'default'} />
        <StatCard title="Bahan Diambil (7 hari)" value={bahanThisWeek.length} icon={Package} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Peminjaman Siswa Terbaru</h2>
            <p className="text-sm text-muted-foreground mt-1">Pantau aktivitas peminjaman siswa Anda.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/loans">Lihat Semua <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
        <RecentLoansTable loans={loans.slice(0, 5)} />
      </div>
    </>
  );

  // ===== SISWA =====
  const renderSiswa = () => {
    const my = loans.filter(l => l.borrowerId === user?.id);
    const myActive = my.filter(l => l.status === 'dipinjam' || l.status === 'disetujui' || l.status === 'terlambat');
    const myPending = my.filter(l => l.status === 'diminta' || l.status === 'antrian');
    const myPendingComp = my.filter(l => l.compensation?.status === 'pending');
    const unread = notifications.filter(n => n.userId === user?.id && !n.read);
    const upcoming = user?.class ? getSchedulesForClass(user.class)
      .filter(s => s.tanggal >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => (a.tanggal + a.jamMulai).localeCompare(b.tanggal + b.jamMulai))
      .slice(0, 3) : [];

    return (
      <>
        {unread.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
            <Bell className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{unread.length} notifikasi belum dibaca</p>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{unread[0]?.message}</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/notifications">Buka</Link></Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Pinjaman Alat Aktif" value={myActive.length} icon={FileText} variant="primary" />
          <StatCard title="Pengajuan Pending" value={myPending.length} icon={ClipboardCheck} variant={myPending.length > 0 ? 'warning' : 'default'} />
          <StatCard title="Notifikasi Baru" value={unread.length} icon={Bell} variant={unread.length > 0 ? 'warning' : 'default'} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/request-loan?tab=alat" className="group bg-card rounded-2xl border border-border p-6 hover:border-primary hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Ajukan Pinjam Alat</h3>
            <p className="text-sm text-muted-foreground">Pinjam kamera, mixer, mikrofon, dan alat lab lainnya.</p>
            <span className="inline-flex items-center text-sm text-primary font-medium mt-4">Mulai <ArrowRight className="w-4 h-4 ml-1" /></span>
          </Link>
          <Link to="/request-loan?tab=bahan" className="group bg-card rounded-2xl border border-border p-6 hover:border-warning hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-4 group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Ambil Bahan</h3>
            <p className="text-sm text-muted-foreground">Komponen elektro, kabel, timah, dan bahan habis pakai.</p>
            <span className="inline-flex items-center text-sm text-warning font-medium mt-4">Mulai <ArrowRight className="w-4 h-4 ml-1" /></span>
          </Link>
        </div>
        {myPendingComp.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Kompensasi pending</p>
              <p className="text-sm text-muted-foreground mt-0.5">Selesaikan kompensasi agar kartu pelajar Anda dapat diambil.</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/my-loans">Lihat</Link></Button>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-6 bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Jadwal Praktikum Terdekat</h2>
            <ul className="space-y-2">
              {upcoming.map(s => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' })} • {s.jamMulai}-{s.jamSelesai} {s.ruangan ? `• ${s.ruangan}` : ''}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${s.priority === 'lomba' ? 'bg-destructive/15 text-destructive' : s.priority === 'tinggi' ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                    {s.priority === 'lomba' ? 'Lomba' : s.priority === 'tinggi' ? 'Tinggi' : 'Normal'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Halo, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'admin' ? 'Ringkasan operasional laboratorium hari ini.'
              : user?.role === 'guru' ? 'Pantauan peminjaman siswa Anda.'
              : 'Apa yang ingin kamu lakukan hari ini?'}
          </p>
        </div>
      </div>

      {user?.role === 'admin' && renderAdmin()}
      {user?.role === 'guru' && renderGuru()}
      {user?.role === 'siswa' && renderSiswa()}
    </div>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentLoansTable } from '@/components/dashboard/RecentLoansTable';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import {
  Box,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { loans: loansData, equipment: equipmentData, notifications, approveLoan, rejectLoan } = useData();
  const navigate = useNavigate();

  const pendingLoans = loansData.filter(l => l.status === 'diminta' && l.itemType === 'alat');
  const activeLoans = loansData.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const overdueLoans = loansData.filter(l => l.status === 'terlambat');
  const userNotifications = notifications.filter(n => n.userId === user?.id && !n.read);

  const dashboardStats = {
    totalEquipment: equipmentData.length,
    totalLoans: loansData.length,
    activeLoans: activeLoans.length,
    overdueLoans: overdueLoans.length,
    pendingRequests: pendingLoans.length,
  };

  const renderAdminDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Peralatan"
          value={dashboardStats.totalEquipment}
          icon={Box}
          variant="primary"
        />
        <StatCard
          title="Peminjaman Aktif"
          value={dashboardStats.activeLoans}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={dashboardStats.pendingRequests}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Keterlambatan"
          value={dashboardStats.overdueLoans}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Pending Requests */}
      {pendingLoans.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Permintaan Menunggu Verifikasi
            </h2>
            <Link 
              to="/loans" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RecentLoansTable
            loans={pendingLoans}
            showActions
            onApprove={(id) => approveLoan(id)}
            onReject={(id) => rejectLoan(id, 'Ditolak dari dashboard')}
          />
        </div>
      )}

      {/* Active & Overdue Loans */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Peminjaman Aktif
            </h2>
            <span className="text-sm text-muted-foreground">
              {activeLoans.length} peminjaman
            </span>
          </div>
          <RecentLoansTable loans={activeLoans.slice(0, 5)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Keterlambatan
            </h2>
          </div>
          {overdueLoans.length > 0 ? (
            <RecentLoansTable loans={overdueLoans} />
          ) : (
            <div className="stat-card text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada keterlambatan</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderGuruDashboard = () => (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Peralatan"
          value={dashboardStats.totalEquipment}
          icon={Box}
          variant="primary"
        />
        <StatCard
          title="Peminjaman Siswa Aktif"
          value={dashboardStats.activeLoans}
          icon={FileText}
        />
        <StatCard
          title="Keterlambatan"
          value={dashboardStats.overdueLoans}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Recent Student Loans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Peminjaman Siswa Terbaru
          </h2>
          <Link 
            to="/loans" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Lihat semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <RecentLoansTable loans={loansData.slice(0, 5)} />
      </div>

      {/* Popular Equipment */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Peralatan Populer
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentData.slice(0, 3).map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} showBorrowButton={false} />
          ))}
        </div>
      </div>
    </>
  );

  const renderSiswaDashboard = () => {
    const myLoans = loansData.filter(l => l.borrowerId === user?.id);
    const myActiveLoans = myLoans.filter(l => l.status === 'dipinjam' || l.status === 'disetujui');
    const myOverdue = myLoans.filter(l => l.status === 'terlambat');

    return (
      <>
        {/* Notifications Banner */}
        {userNotifications.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-4">
            <Bell className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Kamu memiliki {userNotifications.length} notifikasi baru</p>
              <p className="text-sm text-muted-foreground mt-1">
                {userNotifications[0]?.message}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Peminjaman Aktif"
            value={myActiveLoans.length}
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="Total Riwayat"
            value={myLoans.length}
            icon={Clock}
          />
          <StatCard
            title="Keterlambatan"
            value={myOverdue.length}
            icon={AlertTriangle}
            variant={myOverdue.length > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* My Active Loans */}
        {myActiveLoans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Peminjaman Aktif Saya
            </h2>
            <RecentLoansTable loans={myActiveLoans} />
          </div>
        )}

        {/* Available Equipment */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Peralatan Tersedia
            </h2>
            <Link 
              to="/equipment" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipmentData.filter(e => e.available > 0).slice(0, 4).map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                onBorrow={() => navigate(`/request-loan?tab=${eq.itemType}&id=${eq.id}`)}
              />
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">
            {user?.role === 'admin' ? 'Dashboard Admin' : 
             user?.role === 'guru' ? 'Dashboard Guru' : 'Dashboard Siswa'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang kembali, {user?.name}
          </p>
        </div>
      </div>

      {/* Role-specific content */}
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'guru' && renderGuruDashboard()}
      {user?.role === 'siswa' && renderSiswaDashboard()}
    </div>
  );
}

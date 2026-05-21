import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { equipmentData, loansData, usersData } from '@/data/mockData';
import { LoanStatus } from '@/types';
import { 
  FileText, Download, Calendar, Filter, 
  Box, ClipboardList, Users, FileSpreadsheet, File
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateField } from '@/components/ui/date-field';

type ReportType = 'equipment' | 'loans' | 'users';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('equipment');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'siswa' | 'guru'>('all');

  // Check access
  if (user?.role !== 'admin' && user?.role !== 'guru') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  const getFilteredLoans = () => {
    return loansData.filter(loan => {
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
      const matchesDateFrom = !dateFrom || new Date(loan.requestDate) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(loan.requestDate) <= new Date(dateTo);
      return matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const getFilteredUsers = () => {
    return usersData.filter(u => {
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesRole && u.role !== 'admin';
    });
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SMK Negeri 7 Bekasi', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Laboratorium Audio Video', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(14);
    const reportTitle = reportType === 'equipment' ? 'Laporan Peralatan' 
      : reportType === 'loans' ? 'Laporan Peminjaman' 
      : 'Laporan Pengguna';
    doc.text(reportTitle, pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 42);

    if (reportType === 'equipment') {
      autoTable(doc, {
        startY: 48,
        head: [['No', 'Nama Peralatan', 'Kategori', 'Stok', 'Tersedia', 'Kondisi', 'Lokasi']],
        body: equipmentData.map((eq, i) => [
          i + 1,
          eq.name,
          eq.category,
          eq.stock,
          eq.available,
          eq.condition === 'baik' ? 'Baik' : eq.condition === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat',
          eq.location,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
      });
    } else if (reportType === 'loans') {
      const filteredLoans = getFilteredLoans();
      autoTable(doc, {
        startY: 48,
        head: [['No', 'Peminjam', 'Kelas', 'Peralatan', 'Qty', 'Tgl Pinjam', 'Batas Waktu', 'Status']],
        body: filteredLoans.map((loan, i) => [
          i + 1,
          loan.borrowerName,
          loan.borrowerClass || '-',
          loan.equipmentName,
          loan.quantity,
          loan.borrowDate ? `${loan.borrowDate} ${loan.borrowTime}` : '-',
          loan.dueDate ? `${loan.dueDate} ${loan.dueTime}` : '-',
          loan.status.charAt(0).toUpperCase() + loan.status.slice(1),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
      });
    } else {
      const filteredUsers = getFilteredUsers();
      autoTable(doc, {
        startY: 48,
        head: [['No', 'Nama', 'Email', 'Role', 'NISN/NIP', 'Kelas', 'Telepon']],
        body: filteredUsers.map((u, i) => [
          i + 1,
          u.name,
          u.email,
          u.role.charAt(0).toUpperCase() + u.role.slice(1),
          u.nisn || u.nip || '-',
          u.class || '-',
          u.phone || '-',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const filename = `laporan_${reportType}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(filename);
    toast.success('Laporan PDF berhasil diunduh');
  };

  const exportToExcel = () => {
    let data: any[] = [];
    let sheetName = '';

    if (reportType === 'equipment') {
      sheetName = 'Peralatan';
      data = equipmentData.map((eq, i) => ({
        'No': i + 1,
        'Nama Peralatan': eq.name,
        'Kategori': eq.category,
        'Stok': eq.stock,
        'Tersedia': eq.available,
        'Kondisi': eq.condition === 'baik' ? 'Baik' : eq.condition === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat',
        'Lokasi': eq.location,
        'Deskripsi': eq.description || '-',
      }));
    } else if (reportType === 'loans') {
      sheetName = 'Peminjaman';
      const filteredLoans = getFilteredLoans();
      data = filteredLoans.map((loan, i) => ({
        'No': i + 1,
        'Nama Peminjam': loan.borrowerName,
        'Kelas': loan.borrowerClass || '-',
        'Peralatan': loan.equipmentName,
        'Jumlah': loan.quantity,
        'Tgl Request': `${loan.requestDate} ${loan.requestTime}`,
        'Tgl Pinjam': loan.borrowDate ? `${loan.borrowDate} ${loan.borrowTime}` : '-',
        'Batas Waktu': loan.dueDate ? `${loan.dueDate} ${loan.dueTime}` : '-',
        'Tgl Kembali': loan.returnDate ? `${loan.returnDate} ${loan.returnTime}` : '-',
        'Status': loan.status.charAt(0).toUpperCase() + loan.status.slice(1),
        'Catatan': loan.notes || '-',
      }));
    } else {
      sheetName = 'Pengguna';
      const filteredUsers = getFilteredUsers();
      data = filteredUsers.map((u, i) => ({
        'No': i + 1,
        'Nama': u.name,
        'Email': u.email,
        'Role': u.role.charAt(0).toUpperCase() + u.role.slice(1),
        'NISN': u.nisn || '-',
        'NIP': u.nip || '-',
        'Kelas': u.class || '-',
        'Telepon': u.phone || '-',
        'Tgl Dibuat': u.createdAt || '-',
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const filename = `laporan_${reportType}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const getReportStats = () => {
    if (reportType === 'equipment') {
      return {
        total: equipmentData.length,
        tersedia: equipmentData.reduce((sum, eq) => sum + eq.available, 0),
        baik: equipmentData.filter(eq => eq.condition === 'baik').length,
        rusak: equipmentData.filter(eq => eq.condition !== 'baik').length,
      };
    } else if (reportType === 'loans') {
      const filtered = getFilteredLoans();
      return {
        total: filtered.length,
        aktif: filtered.filter(l => l.status === 'dipinjam').length,
        terlambat: filtered.filter(l => l.status === 'terlambat').length,
        selesai: filtered.filter(l => l.status === 'dikembalikan').length,
      };
    } else {
      const filtered = getFilteredUsers();
      return {
        total: filtered.length,
        siswa: filtered.filter(u => u.role === 'siswa').length,
        guru: filtered.filter(u => u.role === 'guru').length,
      };
    }
  };

  const stats = getReportStats();

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Laporan & Export</h1>
          <p className="text-muted-foreground mt-1">
            Generate dan export laporan dalam format PDF atau Excel
          </p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            <span className="hidden sm:inline">Peralatan</span>
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Peminjaman</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Pengguna</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Filters */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Filter Laporan</span>
          </div>
          
          <TabsContent value="equipment" className="mt-0">
            <p className="text-muted-foreground text-sm">
              Laporan peralatan menampilkan semua data inventaris laboratorium.
            </p>
          </TabsContent>

          <TabsContent value="loans" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <DateField value={dateFrom} onChange={setDateFrom} placeholder="Pilih tanggal" />
              </div>
              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <DateField value={dateTo} onChange={setDateTo} placeholder="Pilih tanggal" min={dateFrom} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as LoanStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="diminta">Diminta</SelectItem>
                    <SelectItem value="disetujui">Disetujui</SelectItem>
                    <SelectItem value="dipinjam">Dipinjam</SelectItem>
                    <SelectItem value="terlambat">Terlambat</SelectItem>
                    <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <div className="space-y-2 max-w-xs">
              <Label>Role Pengguna</Label>
              <Select
                value={userRoleFilter}
                onValueChange={(v) => setUserRoleFilter(v as 'all' | 'siswa' | 'guru')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="siswa">Siswa</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {reportType === 'equipment' && (
          <>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Peralatan</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Unit Tersedia</p>
              <p className="text-2xl font-bold text-status-success">{stats.tersedia}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Kondisi Baik</p>
              <p className="text-2xl font-bold text-primary">{stats.baik}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Perlu Perbaikan</p>
              <p className="text-2xl font-bold text-status-warning">{stats.rusak}</p>
            </div>
          </>
        )}
        {reportType === 'loans' && (
          <>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Peminjaman</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Sedang Dipinjam</p>
              <p className="text-2xl font-bold text-primary">{stats.aktif}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Terlambat</p>
              <p className="text-2xl font-bold text-status-overdue">{stats.terlambat}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Dikembalikan</p>
              <p className="text-2xl font-bold text-status-success">{stats.selesai}</p>
            </div>
          </>
        )}
        {reportType === 'users' && (
          <>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Pengguna</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Siswa</p>
              <p className="text-2xl font-bold text-primary">{stats.siswa}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Guru</p>
              <p className="text-2xl font-bold text-status-success">{stats.guru}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border invisible">
              <p className="text-sm text-muted-foreground">-</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </>
        )}
      </div>

      {/* Export Buttons */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Export Laporan</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Pilih format export untuk laporan{' '}
          {reportType === 'equipment' ? 'peralatan' : reportType === 'loans' ? 'peminjaman' : 'pengguna'}
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={exportToPdf} className="bg-red-600 hover:bg-red-700">
            <File className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Preview Data
          </h3>
        </div>
        <div className="overflow-x-auto">
          {reportType === 'equipment' && (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="table-header">No</th>
                  <th className="table-header">Nama</th>
                  <th className="table-header">Kategori</th>
                  <th className="table-header">Stok</th>
                  <th className="table-header">Tersedia</th>
                  <th className="table-header">Kondisi</th>
                  <th className="table-header">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {equipmentData.slice(0, 5).map((eq, i) => (
                  <tr key={eq.id} className="hover:bg-muted/30">
                    <td className="table-cell">{i + 1}</td>
                    <td className="table-cell font-medium">{eq.name}</td>
                    <td className="table-cell">{eq.category}</td>
                    <td className="table-cell">{eq.stock}</td>
                    <td className="table-cell">{eq.available}</td>
                    <td className="table-cell capitalize">{eq.condition.replace('_', ' ')}</td>
                    <td className="table-cell">{eq.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {reportType === 'loans' && (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="table-header">No</th>
                  <th className="table-header">Peminjam</th>
                  <th className="table-header">Peralatan</th>
                  <th className="table-header">Tipe</th>
                  <th className="table-header">Batas Waktu</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getFilteredLoans().slice(0, 5).map((loan, i) => (
                  <tr key={loan.id} className="hover:bg-muted/30">
                    <td className="table-cell">{i + 1}</td>
                    <td className="table-cell font-medium">{loan.borrowerName}</td>
                    <td className="table-cell">{loan.equipmentName}</td>
                    <td className="table-cell capitalize">{loan.durationType}</td>
                    <td className="table-cell">
                      {loan.dueDate ? `${loan.dueDate} ${loan.dueTime}` : '-'}
                    </td>
                    <td className="table-cell capitalize">{loan.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {reportType === 'users' && (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="table-header">No</th>
                  <th className="table-header">Nama</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">NISN/NIP</th>
                  <th className="table-header">Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getFilteredUsers().slice(0, 5).map((u, i) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="table-cell">{i + 1}</td>
                    <td className="table-cell font-medium">{u.name}</td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell capitalize">{u.role}</td>
                    <td className="table-cell">{u.nisn || u.nip || '-'}</td>
                    <td className="table-cell">{u.class || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {((reportType === 'equipment' && equipmentData.length > 5) ||
          (reportType === 'loans' && getFilteredLoans().length > 5) ||
          (reportType === 'users' && getFilteredUsers().length > 5)) && (
          <div className="p-4 text-center text-muted-foreground text-sm border-t border-border">
            Menampilkan 5 dari{' '}
            {reportType === 'equipment' ? equipmentData.length : 
             reportType === 'loans' ? getFilteredLoans().length : 
             getFilteredUsers().length} data. Export untuk melihat semua data.
          </div>
        )}
      </div>
    </div>
  );
}

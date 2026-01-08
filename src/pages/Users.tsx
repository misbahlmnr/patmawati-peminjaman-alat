import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersData, classOptions } from '@/data/mockData';
import { User, UserRole } from '@/types';
import { 
  Search, Plus, Edit2, Trash2, Upload, Download, 
  Users as UsersIcon, GraduationCap, UserCog, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { toast } from 'sonner';
import Papa from 'papaparse';

type UserFilter = 'all' | 'siswa' | 'guru' | 'admin';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  class?: string;
  nisn?: string;
  nip?: string;
  phone?: string;
}

const emptyFormData: UserFormData = {
  name: '',
  email: '',
  role: 'siswa',
  class: '',
  nisn: '',
  nip: '',
  phone: '',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(usersData);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserFilter>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyFormData);
  const [csvData, setCsvData] = useState<UserFormData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Check if admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nisn && u.nisn.includes(searchQuery)) ||
      (u.nip && u.nip.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    all: users.length,
    siswa: users.filter(u => u.role === 'siswa').length,
    guru: users.filter(u => u.role === 'guru').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      toast.error('Nama dan email harus diisi');
      return;
    }

    const newUser: User = {
      id: String(Date.now()),
      ...formData,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);
    setFormData(emptyFormData);
    setIsAddDialogOpen(false);
    toast.success('Pengguna berhasil ditambahkan');
  };

  const handleEditUser = () => {
    if (!selectedUser || !formData.name || !formData.email) {
      toast.error('Nama dan email harus diisi');
      return;
    }

    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...formData }
        : u
    ));
    setFormData(emptyFormData);
    setSelectedUser(null);
    setIsEditDialogOpen(false);
    toast.success('Pengguna berhasil diperbarui');
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast.success('Pengguna berhasil dihapus');
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class || '',
      nisn: user.nisn || '',
      nip: user.nip || '',
      phone: user.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const validData: UserFormData[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 because of header and 0-index

          if (!row.name || !row.email || !row.role) {
            errors.push(`Baris ${rowNum}: Kolom name, email, dan role wajib diisi`);
            return;
          }

          if (!['siswa', 'guru', 'admin'].includes(row.role)) {
            errors.push(`Baris ${rowNum}: Role harus 'siswa', 'guru', atau 'admin'`);
            return;
          }

          if (row.role === 'siswa' && !row.nisn) {
            errors.push(`Baris ${rowNum}: NISN wajib untuk siswa`);
            return;
          }

          if ((row.role === 'guru' || row.role === 'admin') && !row.nip) {
            errors.push(`Baris ${rowNum}: NIP wajib untuk guru/admin`);
            return;
          }

          validData.push({
            name: row.name,
            email: row.email,
            role: row.role as UserRole,
            class: row.class || '',
            nisn: row.nisn || '',
            nip: row.nip || '',
            phone: row.phone || '',
          });
        });

        setCsvErrors(errors);
        setCsvData(validData);
        setIsCsvDialogOpen(true);
      },
      error: (error) => {
        toast.error('Gagal membaca file CSV: ' + error.message);
      },
    });

    // Reset input
    event.target.value = '';
  };

  const handleImportCsv = () => {
    const newUsers: User[] = csvData.map((data, index) => ({
      id: String(Date.now() + index),
      ...data,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setUsers([...users, ...newUsers]);
    setCsvData([]);
    setCsvErrors([]);
    setIsCsvDialogOpen(false);
    toast.success(`${newUsers.length} pengguna berhasil diimpor`);
  };

  const downloadCsvTemplate = () => {
    const template = 'name,email,role,class,nisn,nip,phone\nContoh Siswa,siswa@email.com,siswa,XII TAV 1,0051234567,,081234567890\nContoh Guru,guru@email.com,guru,,,198501152010011001,081234567891';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_pengguna.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'siswa': return <GraduationCap className="w-4 h-4" />;
      case 'guru': return <UsersIcon className="w-4 h-4" />;
      case 'admin': return <UserCog className="w-4 h-4" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'siswa': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'guru': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Kelola Pengguna</h1>
          <p className="text-muted-foreground mt-1">
            {filteredUsers.length} pengguna terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <label className="btn-outline cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </label>
          <button onClick={downloadCsvTemplate} className="btn-outline">
            <Download className="w-4 h-4 mr-2" />
            Template CSV
          </button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Isi data pengguna yang akan ditambahkan ke sistem.
                </DialogDescription>
              </DialogHeader>
              <UserForm 
                formData={formData} 
                setFormData={setFormData}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddUser}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'siswa', 'guru', 'admin'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              roleFilter === role
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {role !== 'all' && getRoleIcon(role)}
            {role === 'all' ? 'Semua' : role === 'siswa' ? 'Siswa' : role === 'guru' ? 'Guru' : 'Admin'}
            <span className="ml-1">({roleCounts[role]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, email, NISN, atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="table-header">Nama</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">NISN/NIP</th>
                <th className="table-header">Kelas</th>
                <th className="table-header">Telepon</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="table-cell font-medium">{user.name}</td>
                  <td className="table-cell text-muted-foreground">{user.email}</td>
                  <td className="table-cell">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize",
                      getRoleBadgeClass(user.role)
                    )}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="table-cell text-muted-foreground">
                    {user.nisn || user.nip || '-'}
                  </td>
                  <td className="table-cell text-muted-foreground">
                    {user.class || '-'}
                  </td>
                  <td className="table-cell text-muted-foreground">
                    {user.phone || '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditDialog(user)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Anda yakin ingin menghapus <strong>{user.name}</strong>? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna.
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            formData={formData} 
            setFormData={setFormData}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Data CSV</DialogTitle>
            <DialogDescription>
              Preview data yang akan diimpor dari file CSV.
            </DialogDescription>
          </DialogHeader>
          
          {csvErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
              <p className="font-medium text-destructive mb-2">Terdapat kesalahan:</p>
              <ul className="text-sm text-destructive space-y-1">
                {csvErrors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {csvErrors.length > 5 && (
                  <li>• ...dan {csvErrors.length - 5} kesalahan lainnya</li>
                )}
              </ul>
            </div>
          )}

          {csvData.length > 0 && (
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">NISN/NIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvData.slice(0, 10).map((data, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{data.name}</td>
                      <td className="px-3 py-2">{data.email}</td>
                      <td className="px-3 py-2 capitalize">{data.role}</td>
                      <td className="px-3 py-2">{data.nisn || data.nip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <p className="text-center py-2 text-muted-foreground text-sm">
                  ...dan {csvData.length - 10} data lainnya
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCsvDialogOpen(false);
              setCsvData([]);
              setCsvErrors([]);
            }}>
              Batal
            </Button>
            <Button 
              onClick={handleImportCsv}
              disabled={csvData.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Import {csvData.length} Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserFormProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
}

function UserForm({ formData, setFormData }: UserFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masukkan nama lengkap"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@smkn7bekasi.sch.id"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="siswa">Siswa</SelectItem>
              <SelectItem value="guru">Guru</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">No. Telepon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="081234567890"
          />
        </div>
      </div>

      {formData.role === 'siswa' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nisn">NISN *</Label>
            <Input
              id="nisn"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              placeholder="0051234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class">Kelas</Label>
            <Select
              value={formData.class}
              onValueChange={(value) => setFormData({ ...formData, class: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(formData.role === 'guru' || formData.role === 'admin') && (
        <div className="space-y-2">
          <Label htmlFor="nip">NIP *</Label>
          <Input
            id="nip"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            placeholder="198501152010011001"
          />
        </div>
      )}
    </div>
  );
}

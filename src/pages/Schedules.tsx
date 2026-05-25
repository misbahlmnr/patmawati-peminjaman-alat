import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { JadwalPraktikum, SchedulePriority, ScheduleStatus } from '@/types';
import { usersData, classOptions } from '@/data/mockData';
import { Plus, Edit2, Trash2, Calendar, X, MapPin, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField } from '@/components/ui/date-field';
import { TimeField } from '@/components/ui/time-field';
import { NumberInput } from '@/components/ui/number-input';

const PRIORITY_LABEL: Record<SchedulePriority, string> = {
  normal: 'Normal',
  tinggi: 'Tinggi',
  lomba: 'Lomba',
};
const PRIORITY_CLASS: Record<SchedulePriority, string> = {
  normal: 'bg-secondary text-muted-foreground',
  tinggi: 'bg-warning/15 text-warning',
  lomba: 'bg-destructive/15 text-destructive',
};
const STATUS_LABEL: Record<ScheduleStatus, string> = {
  draft: 'Draft', aktif: 'Aktif', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
};

const teachersList = usersData.filter(u => u.role === 'guru');

interface FormState {
  id?: string;
  title: string;
  mataKuliah: string;
  jurusan: string;
  kelas: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan: string;
  guruId: string;
  priority: SchedulePriority;
  status: ScheduleStatus;
  notes: string;
  requiredEquipment: { equipmentId: string; quantity: number }[];
}

const emptyForm = (): FormState => ({
  title: '', mataKuliah: '', jurusan: 'Audio Video', kelas: '',
  tanggal: '', jamMulai: '', jamSelesai: '', ruangan: '',
  guruId: '', priority: 'normal', status: 'aktif', notes: '',
  requiredEquipment: [],
});

export default function Schedules() {
  const { user } = useAuth();
  const { schedules, equipment, addSchedule, updateSchedule, deleteSchedule } = useData();
  const isAdmin = user?.role === 'admin';
  const [editing, setEditing] = useState<FormState | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | SchedulePriority>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | ScheduleStatus>('all');
  const [filterKelas, setFilterKelas] = useState<string>('all');

  const alatList = useMemo(() => equipment.filter(e => e.itemType === 'alat'), [equipment]);

  const filtered = useMemo(() => schedules
    .filter(s => filterPriority === 'all' || s.priority === filterPriority)
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .filter(s => filterKelas === 'all' || s.kelas === filterKelas)
    .filter(s => user?.role !== 'guru' || s.guruId === user.id)
    .sort((a, b) => (b.tanggal + b.jamMulai).localeCompare(a.tanggal + a.jamMulai))
  , [schedules, filterPriority, filterStatus, filterKelas, user]);

  const openCreate = () => setEditing(emptyForm());
  const openEdit = (s: JadwalPraktikum) => setEditing({
    id: s.id, title: s.title, mataKuliah: s.mataKuliah, jurusan: s.jurusan, kelas: s.kelas,
    tanggal: s.tanggal, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai, ruangan: s.ruangan ?? '',
    guruId: s.guruId, priority: s.priority, status: s.status, notes: s.notes ?? '',
    requiredEquipment: (s.requiredEquipment ?? []).map(r => ({ equipmentId: r.equipmentId, quantity: r.quantity })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const teacher = teachersList.find(t => t.id === editing.guruId);
    const payload: JadwalPraktikum = {
      id: editing.id ?? `S-${Date.now()}`,
      title: editing.title,
      mataKuliah: editing.mataKuliah,
      jurusan: editing.jurusan || 'Audio Video',
      kelas: editing.kelas,
      tanggal: editing.tanggal,
      jamMulai: editing.jamMulai,
      jamSelesai: editing.jamSelesai,
      ruangan: editing.ruangan || undefined,
      guruId: editing.guruId,
      guruName: teacher?.name ?? '',
      priority: editing.priority,
      status: editing.status,
      notes: editing.notes || undefined,
      requiredEquipment: editing.requiredEquipment
        .filter(r => r.equipmentId && r.quantity > 0)
        .map(r => {
          const eq = alatList.find(e => e.id === r.equipmentId);
          return { equipmentId: r.equipmentId, equipmentName: eq?.name ?? '', quantity: r.quantity };
        }),
      createdAt: editing.id ? schedules.find(s => s.id === editing.id)!.createdAt : new Date().toISOString(),
    };
    if (editing.id) updateSchedule(editing.id, payload);
    else addSchedule(payload);
    setEditing(null);
  };

  const updateReq = (idx: number, patch: Partial<{ equipmentId: string; quantity: number }>) => {
    if (!editing) return;
    const next = [...editing.requiredEquipment];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, requiredEquipment: next });
  };
  const addReq = () => editing && setEditing({ ...editing, requiredEquipment: [...editing.requiredEquipment, { equipmentId: '', quantity: 1 }] });
  const removeReq = (idx: number) => editing && setEditing({ ...editing, requiredEquipment: editing.requiredEquipment.filter((_, i) => i !== idx) });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Jadwal Praktikum</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} jadwal {isAdmin ? '' : '(read-only)'}</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Jadwal Baru</Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
          <SelectTrigger><SelectValue placeholder="Prioritas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="tinggi">Tinggi</SelectItem>
            <SelectItem value="lomba">Lomba</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
            <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Jadwal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Kelas/Guru</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Alat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Prioritas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-sm text-muted-foreground">Belum ada jadwal</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.mataKuliah}</p>
                    {s.ruangan && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{s.ruangan}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">{s.kelas}</p>
                    <p className="text-xs text-muted-foreground">{s.guruName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p>{new Date(s.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-muted-foreground">{s.jamMulai} - {s.jamSelesai}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(s.requiredEquipment ?? []).length === 0 ? <span className="text-muted-foreground">—</span> :
                      <ul className="space-y-0.5">
                        {s.requiredEquipment!.map(r => (
                          <li key={r.equipmentId}>{r.equipmentName} <span className="text-muted-foreground">×{r.quantity}</span></li>
                        ))}
                      </ul>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORITY_CLASS[s.priority])}>
                      {PRIORITY_LABEL[s.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{STATUS_LABEL[s.status]}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Hapus jadwal "${s.title}"?`)) deleteSchedule(s.id); }} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 max-w-2xl w-full my-8 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5" /> {editing.id ? 'Edit Jadwal' : 'Jadwal Baru'}</h3>
              <button type="button" onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Judul</Label>
                <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Mata Kuliah</Label>
                <Input value={editing.mataKuliah} onChange={e => setEditing({ ...editing, mataKuliah: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ruangan</Label>
                <Input value={editing.ruangan} onChange={e => setEditing({ ...editing, ruangan: e.target.value })} placeholder="Mis. Lab AV-1" />
              </div>
              <div className="space-y-1.5">
                <Label>Kelas</Label>
                <Select value={editing.kelas} onValueChange={(v) => setEditing({ ...editing, kelas: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Guru Pengampu</Label>
                <Select value={editing.guruId} onValueChange={(v) => setEditing({ ...editing, guruId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                  <SelectContent>{teachersList.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <DateField value={editing.tanggal} onChange={(v) => setEditing({ ...editing, tanggal: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>Jam Mulai</Label>
                <TimeField value={editing.jamMulai} onChange={(v) => setEditing({ ...editing, jamMulai: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>Jam Selesai</Label>
                <TimeField value={editing.jamSelesai} onChange={(v) => setEditing({ ...editing, jamSelesai: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>Prioritas</Label>
                <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v as SchedulePriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="tinggi">Tinggi</SelectItem>
                    <SelectItem value="lomba">Lomba (tertinggi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as ScheduleStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Catatan</Label>
                <Textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} className="min-h-[64px] resize-none" />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alat yang Dibutuhkan</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addReq}><Plus className="w-3 h-3 mr-1" /> Tambah</Button>
                </div>
                {editing.requiredEquipment.length === 0 && <p className="text-xs text-muted-foreground">Belum ada alat dipesan.</p>}
                {editing.requiredEquipment.map((r, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select value={r.equipmentId} onValueChange={(v) => updateReq(i, { equipmentId: v })}>
                        <SelectTrigger><SelectValue placeholder="Pilih alat" /></SelectTrigger>
                        <SelectContent>{alatList.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.name} (stok {eq.available}/{eq.stock})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <NumberInput value={r.quantity} onChange={(v) => updateReq(i, { quantity: v })} min={1} max={50} className="w-28" />
                    <button type="button" onClick={() => removeReq(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {editing.priority === 'lomba' && editing.requiredEquipment.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded p-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                    <span>Alat ini akan diprioritaskan untuk lomba. Pengajuan siswa lain dapat masuk antrian.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(null)}>Batal</Button>
              <Button type="submit" className="flex-1">Simpan</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

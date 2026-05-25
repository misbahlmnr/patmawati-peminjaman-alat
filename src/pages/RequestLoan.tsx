import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usersData } from '@/data/mockData';
import { Equipment, BorrowScope } from '@/types';
import { Search, ShoppingCart, X, Calendar, FileText, Send, Check, User, Wrench, Package, Info, MapPin, CreditCard, AlertTriangle, CalendarDays, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/ui/date-field';
import { TimeField } from '@/components/ui/time-field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface CartItem {
  equipment: Equipment;
  quantity: number;
}

const teachersList = usersData.filter(u => u.role === 'guru');

type Tab = 'alat' | 'bahan';

export default function RequestLoan() {
  const { user } = useAuth();
  const { equipment, submitLoan, getSchedulesForClass } = useData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get('tab') as Tab) === 'bahan' ? 'bahan' : 'alat';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [borrowTime, setBorrowTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [borrowScope, setBorrowScope] = useState<BorrowScope>('dalam_lab');
  const [agreeCollateral, setAgreeCollateral] = useState(false);
  const [scheduleId, setScheduleId] = useState('');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const studentSchedules = useMemo(() => {
    if (!user?.class) return [];
    const today = new Date().toISOString().slice(0, 10);
    return getSchedulesForClass(user.class)
      .filter(s => s.tanggal >= today)
      .sort((a, b) => (a.tanggal + a.jamMulai).localeCompare(b.tanggal + b.jamMulai));
  }, [user, getSchedulesForClass]);
  const selectedSchedule = useMemo(() => studentSchedules.find(s => s.id === scheduleId), [studentSchedules, scheduleId]);

  // Preselect via ?id=
  useEffect(() => {
    const id = params.get('id');
    if (id) {
      const eq = equipment.find(e => e.id === id);
      if (eq) {
        setTab(eq.itemType);
        setCart(c => c.find(i => i.equipment.id === eq.id) ? c : [...c, { equipment: eq, quantity: 1 }]);
      }
    }
  }, [params, equipment]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setCart([]);
    setParams({ tab: t });
  };

  const available = useMemo(() => equipment.filter(e =>
    e.itemType === tab &&
    (e.stockRemaining ?? e.available) > 0 &&
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     e.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [equipment, tab, searchQuery]);

  const maxQty = (eq: Equipment) => (tab === 'bahan' ? (eq.stockRemaining ?? eq.available) : eq.available);

  const addToCart = (eq: Equipment) => {
    const existing = cart.find(i => i.equipment.id === eq.id);
    if (existing) {
      if (existing.quantity < maxQty(eq)) {
        setCart(cart.map(i => i.equipment.id === eq.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
    } else {
      setCart([...cart, { equipment: eq, quantity: 1 }]);
    }
  };
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return setCart(cart.filter(i => i.equipment.id !== id));
    setCart(cart.map(i => i.equipment.id === id ? { ...i, quantity: Math.min(qty, maxQty(i.equipment)) } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (tab === 'alat' && borrowScope === 'bawa_pulang' && !agreeCollateral) return;
    const teacher = teachersList.find(t => t.id === teacherId);
    const items = cart.map(i => ({
      equipmentId: i.equipment.id,
      quantity: i.quantity,
      itemType: tab,
      borrowerId: user.id,
      borrowerName: user.name,
      borrowerClass: user.class,
      teacherId,
      teacherName: teacher?.name,
      notes,
      ...(tab === 'alat' ? { borrowDate, borrowTime, dueDate, dueTime, borrowScope, scheduleId } : {}),
    }));
    submitLoan(items);
    setShowSuccess(tab === 'bahan'
      ? 'Pengambilan bahan berhasil dicatat! Stok telah diperbarui.'
      : borrowScope === 'bawa_pulang'
        ? 'Permintaan terkirim! Siapkan kartu pelajar untuk diserahkan saat pengambilan alat.'
        : 'Permintaan peminjaman terkirim! Menunggu verifikasi admin.');
    setCart([]); setNotes(''); setBorrowDate(''); setBorrowTime(''); setDueDate(''); setDueTime(''); setTeacherId('');
    setBorrowScope('dalam_lab'); setAgreeCollateral(false); setScheduleId('');
    setTimeout(() => { setShowSuccess(null); navigate('/my-loans'); }, 2500);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const isBahan = tab === 'bahan';

  return (
    <div className="animate-fade-in">
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Berhasil!</h3>
            <p className="text-muted-foreground">{showSuccess}</p>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="section-title">Ajukan Peminjaman</h1>
          <p className="text-muted-foreground mt-1">Pilih jenis: pinjam alat atau ambil bahan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-secondary p-1 rounded-lg w-fit">
        <button onClick={() => switchTab('alat')} className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
          tab === 'alat' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
          <Wrench className="w-4 h-4" /> Pinjam Alat
        </button>
        <button onClick={() => switchTab('bahan')} className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
          tab === 'bahan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
          <Package className="w-4 h-4" /> Ambil Bahan
        </button>
      </div>

      {/* Info banner */}
      <div className={cn('flex items-start gap-3 p-3 rounded-lg mb-6 text-sm',
        isBahan ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info')}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{isBahan ? 'Bahan sekali pakai, tidak perlu dikembalikan. Stok akan otomatis berkurang.' : 'Alat harus dikembalikan sebelum batas waktu. Permintaan akan diverifikasi admin.'}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Cari ${isBahan ? 'bahan' : 'alat'}...`} className="form-input pl-10" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {available.map(eq => {
              const inCart = cart.find(i => i.equipment.id === eq.id);
              const remain = maxQty(eq);
              const low = isBahan && eq.minStock !== undefined && remain <= eq.minStock;
              const indicator = remain <= 0 ? 'bg-destructive/10 text-destructive'
                : low ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success';
              return (
                <div key={eq.id} className="equipment-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{eq.name}</h3>
                      <p className="text-xs text-muted-foreground">{eq.category}</p>
                    </div>
                    {inCart && <span className="px-2 py-0.5 bg-success text-success-foreground text-xs rounded">×{inCart.quantity}</span>}
                  </div>
                  <div className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mb-3', indicator)}>
                    {isBahan ? `Stok: ${remain} ${eq.unit ?? ''}` : `Tersedia: ${remain} dari ${eq.stock} unit`}
                  </div>
                  {low && <p className="text-xs text-warning mb-2">⚠ Stok menipis</p>}
                  <button
                    onClick={() => addToCart(eq)}
                    disabled={remain <= 0 || (inCart && inCart.quantity >= remain)}
                    className="btn-primary w-full text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isBahan ? 'Ambil' : 'Tambah ke Keranjang'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart & Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Keranjang</h2>
                <p className="text-sm text-muted-foreground">{totalItems} item</p>
              </div>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-2 mb-5">
                {cart.map(item => (
                  <div key={item.equipment.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.equipment.name}</p>
                      <p className="text-xs text-muted-foreground">Max: {maxQty(item.equipment)} {item.equipment.unit ?? 'unit'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.equipment.id, item.quantity - 1)} className="w-6 h-6 rounded border text-sm">-</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.equipment.id, item.quantity + 1)} disabled={item.quantity >= maxQty(item.equipment)} className="w-6 h-6 rounded border text-sm disabled:opacity-50">+</button>
                      <button onClick={() => updateQty(item.equipment.id, 0)} className="ml-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada item</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Guru Pembimbing</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru..." /></SelectTrigger>
                  <SelectContent>
                    {teachersList.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {!isBahan && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Lokasi Penggunaan</Label>
                    <RadioGroup value={borrowScope} onValueChange={(v) => setBorrowScope(v as BorrowScope)} className="gap-2">
                      <label className={cn('flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer', borrowScope === 'dalam_lab' ? 'border-primary bg-primary/5' : 'border-border')}>
                        <RadioGroupItem value="dalam_lab" className="mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Pakai di Lab</p>
                          <p className="text-xs text-muted-foreground">Alat tidak dibawa keluar. Tanpa jaminan.</p>
                        </div>
                      </label>
                      <label className={cn('flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer', borrowScope === 'bawa_pulang' ? 'border-warning bg-warning/5' : 'border-border')}>
                        <RadioGroupItem value="bawa_pulang" className="mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Bawa Pulang</p>
                          <p className="text-xs text-muted-foreground">Wajib jaminan kartu pelajar.</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {borrowScope === 'bawa_pulang' && (
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-warning mt-0.5" />
                        <p className="text-xs text-warning-foreground">
                          Anda wajib menyerahkan <strong>kartu pelajar</strong> sebagai jaminan. Kartu akan dikembalikan setelah alat dikembalikan dalam keadaan lengkap. Jika ada barang tidak lengkap/rusak, kartu ditahan sampai penggantian selesai.
                        </p>
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-warning/20">
                        <Checkbox checked={agreeCollateral} onCheckedChange={(v) => setAgreeCollateral(v === true)} className="mt-0.5" />
                        <span className="text-xs font-medium">Saya setuju menyerahkan kartu pelajar sebagai jaminan</span>
                      </label>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Mulai Pinjam</Label>
                    <DateField value={borrowDate} onChange={setBorrowDate} placeholder="Tanggal mulai" />
                    <TimeField value={borrowTime} onChange={setBorrowTime} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Batas Kembali</Label>
                    <DateField value={dueDate} onChange={setDueDate} placeholder="Tanggal batas" min={borrowDate} />
                    <TimeField value={dueTime} onChange={setDueTime} />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Catatan / Keperluan</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={isBahan ? 'Untuk praktikum...' : 'Untuk tugas praktik...'}
                  className="min-h-[72px] resize-none" required />
              </div>

              <Button type="submit" disabled={
                cart.length === 0 || !teacherId ||
                (!isBahan && (!borrowDate || !borrowTime || !dueDate || !dueTime)) ||
                (!isBahan && borrowScope === 'bawa_pulang' && !agreeCollateral)
              } className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {isBahan ? 'Ambil Bahan' : 'Ajukan Peminjaman'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

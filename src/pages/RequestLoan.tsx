import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usersData } from '@/data/mockData';
import { Equipment } from '@/types';
import { Search, ShoppingCart, X, Calendar, FileText, Send, Check, User, Wrench, Package, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/ui/date-field';
import { TimeField } from '@/components/ui/time-field';

interface CartItem {
  equipment: Equipment;
  quantity: number;
}

const teachersList = usersData.filter(u => u.role === 'guru');

type Tab = 'alat' | 'bahan';

export default function RequestLoan() {
  const { user } = useAuth();
  const { equipment, submitLoan } = useData();
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
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

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
      ...(tab === 'alat' ? { borrowDate, borrowTime, dueDate, dueTime } : {}),
    }));
    submitLoan(items);
    setShowSuccess(tab === 'bahan'
      ? 'Pengambilan bahan berhasil dicatat! Stok telah diperbarui.'
      : 'Permintaan peminjaman terkirim! Menunggu verifikasi admin.');
    setCart([]); setNotes(''); setBorrowDate(''); setBorrowTime(''); setDueDate(''); setDueTime(''); setTeacherId('');
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1"><User className="w-3 h-3 inline mr-1" /> Guru Pembimbing</label>
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="form-input" required>
                  <option value="">Pilih guru...</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {!isBahan && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1"><Calendar className="w-3 h-3 inline mr-1" /> Pinjam (tgl & jam)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={borrowDate} onChange={e => setBorrowDate(e.target.value)} className="form-input" required />
                      <input type="time" value={borrowTime} onChange={e => setBorrowTime(e.target.value)} className="form-input" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1"><Calendar className="w-3 h-3 inline mr-1" /> Batas Kembali (tgl & jam)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={borrowDate} className="form-input" required />
                      <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="form-input" required />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1"><FileText className="w-3 h-3 inline mr-1" /> Catatan / Keperluan</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isBahan ? 'Untuk praktikum...' : 'Untuk tugas praktik...'} className="form-input min-h-[70px] resize-none" required />
              </div>

              <button type="submit" disabled={cart.length === 0 || !teacherId} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-4 h-4 mr-2" />
                {isBahan ? 'Ambil Bahan' : 'Ajukan Peminjaman'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

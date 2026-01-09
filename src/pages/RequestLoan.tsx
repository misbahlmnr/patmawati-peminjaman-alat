import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { equipmentData, usersData } from '@/data/mockData';
import { Equipment } from '@/types';
import { Search, ShoppingCart, X, Calendar, FileText, Send, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
  equipment: Equipment;
  quantity: number;
}

// Get list of teachers
const teachersList = usersData.filter(u => u.role === 'guru');

export default function RequestLoan() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [borrowTime, setBorrowTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const availableEquipment = equipmentData.filter(e => 
    e.available > 0 && 
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     e.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (equipment: Equipment) => {
    const existing = cart.find(item => item.equipment.id === equipment.id);
    if (existing) {
      if (existing.quantity < equipment.available) {
        setCart(cart.map(item =>
          item.equipment.id === equipment.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { equipment, quantity: 1 }]);
    }
  };

  const removeFromCart = (equipmentId: string) => {
    setCart(cart.filter(item => item.equipment.id !== equipmentId));
  };

  const updateQuantity = (equipmentId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(equipmentId);
      return;
    }
    setCart(cart.map(item =>
      item.equipment.id === equipmentId
        ? { ...item, quantity: Math.min(quantity, item.equipment.available) }
        : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = teachersList.find(t => t.id === selectedTeacherId);
    // Simulate submission
    console.log('Submit loan request:', { 
      cart, 
      notes, 
      borrowDate, 
      borrowTime,
      dueDate, 
      dueTime,
      teacherId: selectedTeacherId,
      teacherName: selectedTeacher?.name
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setNotes('');
      setBorrowDate('');
      setBorrowTime('');
      setDueDate('');
      setDueTime('');
      setSelectedTeacherId('');
    }, 3000);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="animate-fade-in">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Permintaan Terkirim!</h3>
            <p className="text-muted-foreground">
              Permintaan peminjaman Anda sedang diproses. Tunggu verifikasi dari admin.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Ajukan Peminjaman</h1>
          <p className="text-muted-foreground mt-1">
            Pilih peralatan yang ingin dipinjam
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Equipment Selection */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari peralatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Equipment Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {availableEquipment.map((eq) => {
              const inCart = cart.find(item => item.equipment.id === eq.id);
              return (
                <div key={eq.id} className="relative">
                  <EquipmentCard
                    equipment={eq}
                    showBorrowButton={!inCart}
                    onBorrow={() => addToCart(eq)}
                  />
                  {inCart && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-success text-success-foreground text-xs font-medium rounded-lg">
                      Dalam keranjang ({inCart.quantity})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart & Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Keranjang Peminjaman</h2>
                  <p className="text-sm text-muted-foreground">{totalItems} item dipilih</p>
                </div>
              </div>

              {/* Cart Items */}
              {cart.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div 
                      key={item.equipment.id}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.equipment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tersedia: {item.equipment.available}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.equipment.id, item.quantity - 1)}
                          className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-sm hover:bg-secondary"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.equipment.id, item.quantity + 1)}
                          disabled={item.quantity >= item.equipment.available}
                          className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-sm hover:bg-secondary disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.equipment.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-6">
                  <p className="text-muted-foreground text-sm">
                    Belum ada peralatan dipilih
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Guru Pembimbing */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Guru Pembimbing
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Pilih guru pembimbing...</option>
                    {teachersList.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal & Waktu Pinjam */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Tanggal & Waktu Pinjam
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={borrowDate}
                      onChange={(e) => setBorrowDate(e.target.value)}
                      className="form-input"
                      required
                    />
                    <input
                      type="time"
                      value={borrowTime}
                      onChange={(e) => setBorrowTime(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                {/* Tanggal & Waktu Pengembalian */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Batas Waktu Pengembalian
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={borrowDate}
                      className="form-input"
                      required
                    />
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Catatan / Keperluan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Untuk tugas praktik videografi"
                    className="form-input min-h-[80px] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0 || !selectedTeacherId}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Ajukan Peminjaman
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

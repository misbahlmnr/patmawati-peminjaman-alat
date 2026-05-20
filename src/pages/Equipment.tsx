import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { equipmentData, equipmentCategories, materialCategories, materialUnits } from '@/data/mockData';
import { Equipment, ItemType, MaterialUnit } from '@/types';
import { Search, Filter, Plus, Grid, List, X, Check, Upload, Wrench, Package, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'alat' | 'bahan';

interface NewItemState {
  name: string;
  category: string;
  description: string;
  stock: string;
  // alat
  available: string;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  location: string;
  // bahan
  unit: MaterialUnit;
  stockRemaining: string;
  minStock: string;
}

const emptyForm: NewItemState = {
  name: '', category: '', description: '',
  stock: '', available: '', condition: 'baik', location: '',
  unit: 'pcs', stockRemaining: '', minStock: '',
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) === 'bahan' ? 'bahan' : 'alat';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [items, setItems] = useState<Equipment[]>(equipmentData);
  const [form, setForm] = useState<NewItemState>(emptyForm);

  // Keep tab in sync with URL
  useEffect(() => {
    const t = (searchParams.get('tab') as TabType) === 'bahan' ? 'bahan' : 'alat';
    setActiveTab(t);
  }, [searchParams]);

  const switchTab = (t: TabType) => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSearchParams({ tab: t });
  };

  const isAdmin = user?.role === 'admin';
  const isBahan = activeTab === 'bahan';

  const filteredItems = useMemo(() => {
    return items.filter(eq => {
      if (eq.itemType !== activeTab) return false;
      const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           eq.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || eq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, activeTab, searchQuery, selectedCategory]);

  const categoryOptions = isBahan ? materialCategories : equipmentCategories;
  const usedCategories = ['all', ...new Set(items.filter(e => e.itemType === activeTab).map(e => e.category))];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${isBahan ? 'B' : 'A'}${Date.now()}`;
    const base: Equipment = isBahan
      ? {
          id, name: form.name, category: form.category, itemType: 'bahan',
          stock: Number(form.stock),
          available: Number(form.stockRemaining || form.stock),
          stockRemaining: Number(form.stockRemaining || form.stock),
          unit: form.unit,
          minStock: form.minStock ? Number(form.minStock) : undefined,
          description: form.description, createdAt: new Date().toISOString().slice(0, 10),
        }
      : {
          id, name: form.name, category: form.category, itemType: 'alat',
          stock: Number(form.stock),
          available: Number(form.available || form.stock),
          condition: form.condition, location: form.location,
          description: form.description, createdAt: new Date().toISOString().slice(0, 10),
        };
    setItems(prev => [base, ...prev]);
    setShowAddModal(false);
    setShowSuccess(true);
    setForm(emptyForm);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus item ini dari inventaris?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('CSV file uploaded:', file.name);
    }
  };

  const alatCount = items.filter(i => i.itemType === 'alat').length;
  const bahanCount = items.filter(i => i.itemType === 'bahan').length;

  return (
    <div className="animate-fade-in">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {isBahan ? 'Bahan' : 'Alat'} Ditambahkan!
            </h3>
            <p className="text-muted-foreground">
              {isBahan ? 'Bahan' : 'Alat'} baru berhasil ditambahkan ke inventaris.
            </p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full animate-scale-in my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                Tambah {isBahan ? 'Bahan' : 'Alat'} Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-6 p-4 border-2 border-dashed border-border rounded-lg text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload CSV untuk input massal</p>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="inline-flex items-center px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg cursor-pointer hover:bg-secondary/80">
                Pilih File CSV
              </label>
            </div>

            <div className="text-center text-muted-foreground text-sm mb-6">atau isi form manual</div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nama {isBahan ? 'Bahan' : 'Alat'}</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isBahan ? 'Contoh: Resistor 1/4W' : 'Contoh: Kamera DSLR Canon EOS 80D'}
                  className="form-input" required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="form-input" required
                >
                  <option value="">Pilih kategori</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {isBahan ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Total Stok</label>
                      <input
                        type="number" min="1" value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="100" className="form-input" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Sisa</label>
                      <input
                        type="number" min="0" max={form.stock || undefined}
                        value={form.stockRemaining}
                        onChange={(e) => setForm({ ...form, stockRemaining: e.target.value })}
                        placeholder="100" className="form-input" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Unit</label>
                      <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value as MaterialUnit })}
                        className="form-input" required
                      >
                        {materialUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Ambang Stok Menipis (opsional)</label>
                    <input
                      type="number" min="0" value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                      placeholder="20" className="form-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Total Stok</label>
                      <input
                        type="number" min="1" value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="5" className="form-input" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Tersedia</label>
                      <input
                        type="number" min="0" max={form.stock || undefined}
                        value={form.available}
                        onChange={(e) => setForm({ ...form, available: e.target.value })}
                        placeholder="5" className="form-input" required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Kondisi</label>
                      <select
                        value={form.condition}
                        onChange={(e) => setForm({ ...form, condition: e.target.value as Equipment['condition'] })}
                        className="form-input" required
                      >
                        <option value="baik">Baik</option>
                        <option value="rusak_ringan">Rusak Ringan</option>
                        <option value="rusak_berat">Rusak Berat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Lokasi Rak</label>
                      <input
                        type="text" value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Rak A1" className="form-input" required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Deskripsi (Opsional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat..."
                  className="form-input min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah {isBahan ? 'Bahan' : 'Alat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">
            {isAdmin ? `Kelola ${isBahan ? 'Bahan' : 'Alat'}` : `${isBahan ? 'Bahan' : 'Alat'} Laboratorium`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredItems.length} {isBahan ? 'bahan' : 'alat'} ditampilkan
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tambah {isBahan ? 'Bahan' : 'Alat'}
          </button>
        )}
      </div>

      {/* Tabs Alat / Bahan */}
      <div className="flex items-center gap-2 mb-6 bg-secondary p-1 rounded-lg w-fit">
        <button
          onClick={() => switchTab('alat')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'alat' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Wrench className="w-4 h-4" />
          Alat <span className="opacity-60">({alatCount})</span>
        </button>
        <button
          onClick={() => switchTab('bahan')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'bahan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Package className="w-4 h-4" />
          Bahan <span className="opacity-60">({bahanCount})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Cari ${isBahan ? 'bahan' : 'alat'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input w-auto"
          >
            {usedCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'Semua Kategori' : cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      {filteredItems.length > 0 ? (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        )}>
          {filteredItems.map((eq) => (
            <div key={eq.id} className="relative group">
              <EquipmentCard
                equipment={eq}
                showBorrowButton={user?.role === 'siswa'}
                onBorrow={() => console.log('Borrow:', eq.id)}
              />
              {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(eq.id)}
                    className="p-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada {isBahan ? 'bahan' : 'alat'} ditemukan</p>
        </div>
      )}
    </div>
  );
}

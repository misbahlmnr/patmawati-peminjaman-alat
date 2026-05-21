import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { equipmentCategories, materialCategories, materialUnits } from '@/data/mockData';
import { Equipment, ItemType, MaterialUnit } from '@/types';
import { Search, Filter, Plus, Grid, List, X, Check, Upload, Wrench, Package, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';

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
  const { equipment: items, addEquipment, deleteEquipment } = useData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) === 'bahan' ? 'bahan' : 'alat';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
    addEquipment(base);
    setShowAddModal(false);
    setShowSuccess(true);
    setForm(emptyForm);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus item ini dari inventaris?')) {
      deleteEquipment(id);
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
              <div className="space-y-1.5">
                <Label>Nama {isBahan ? 'Bahan' : 'Alat'}</Label>
                <Input value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isBahan ? 'Contoh: Resistor 1/4W' : 'Contoh: Kamera DSLR Canon EOS 80D'}
                  required />
              </div>

              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isBahan ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Total Stok</Label>
                      <NumberInput value={form.stock ? Number(form.stock) : 0}
                        onChange={(n) => setForm({ ...form, stock: String(n) })} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sisa</Label>
                      <NumberInput value={form.stockRemaining ? Number(form.stockRemaining) : 0}
                        onChange={(n) => setForm({ ...form, stockRemaining: String(n) })}
                        min={0} max={form.stock ? Number(form.stock) : undefined} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as MaterialUnit })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {materialUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ambang Stok Menipis (opsional)</Label>
                    <NumberInput value={form.minStock ? Number(form.minStock) : 0}
                      onChange={(n) => setForm({ ...form, minStock: String(n) })} min={0} />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Total Stok</Label>
                      <NumberInput value={form.stock ? Number(form.stock) : 0}
                        onChange={(n) => setForm({ ...form, stock: String(n) })} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tersedia</Label>
                      <NumberInput value={form.available ? Number(form.available) : 0}
                        onChange={(n) => setForm({ ...form, available: String(n) })}
                        min={0} max={form.stock ? Number(form.stock) : undefined} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Kondisi</Label>
                      <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as Equipment['condition'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baik">Baik</SelectItem>
                          <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                          <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Lokasi Rak</Label>
                      <Input value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Rak A1" required />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Deskripsi (Opsional)</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat..."
                  className="min-h-[80px] resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah {isBahan ? 'Bahan' : 'Alat'}
                </Button>
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
                onBorrow={() => navigate(`/request-loan?tab=${eq.itemType}&id=${eq.id}`)}
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

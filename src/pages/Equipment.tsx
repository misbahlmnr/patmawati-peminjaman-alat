import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { equipmentData, equipmentCategories } from '@/data/mockData';
import { Equipment } from '@/types';
import { Search, Filter, Plus, Grid, List, X, Check, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EquipmentPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state for new equipment
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    category: '',
    stock: '',
    available: '',
    condition: 'baik' as Equipment['condition'],
    location: '',
    description: '',
  });

  const categories = ['all', ...new Set(equipmentData.map(e => e.category))];

  const filteredEquipment = equipmentData.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         eq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Add equipment:', newEquipment);
    setShowAddModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    // Reset form
    setNewEquipment({
      name: '',
      category: '',
      stock: '',
      available: '',
      condition: 'baik',
      location: '',
      description: '',
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('CSV file uploaded:', file.name);
      // In real implementation, parse CSV and add equipment
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Peralatan Ditambahkan!</h3>
            <p className="text-muted-foreground">
              Peralatan baru berhasil ditambahkan ke inventaris.
            </p>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full animate-scale-in my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Tambah Peralatan Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* CSV Upload */}
            <div className="mb-6 p-4 border-2 border-dashed border-border rounded-lg text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload CSV untuk input massal</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label 
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg cursor-pointer hover:bg-secondary/80"
              >
                Pilih File CSV
              </label>
            </div>

            <div className="text-center text-muted-foreground text-sm mb-6">atau isi form manual</div>
            
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nama Peralatan
                </label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  placeholder="Contoh: Kamera DSLR Canon EOS 80D"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kategori
                  </label>
                  <select
                    value={newEquipment.category}
                    onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {equipmentCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kondisi
                  </label>
                  <select
                    value={newEquipment.condition}
                    onChange={(e) => setNewEquipment({ ...newEquipment, condition: e.target.value as Equipment['condition'] })}
                    className="form-input"
                    required
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Total Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEquipment.stock}
                    onChange={(e) => setNewEquipment({ ...newEquipment, stock: e.target.value })}
                    placeholder="5"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tersedia
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newEquipment.stock || undefined}
                    value={newEquipment.available}
                    onChange={(e) => setNewEquipment({ ...newEquipment, available: e.target.value })}
                    placeholder="5"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Lokasi Penyimpanan
                </label>
                <input
                  type="text"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  placeholder="Contoh: Rak A1"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  placeholder="Deskripsi singkat peralatan..."
                  className="form-input min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Peralatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Peralatan Laboratorium</h1>
          <p className="text-muted-foreground mt-1">
            {equipmentData.length} peralatan tersedia
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Peralatan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input w-auto"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Semua Kategori' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Equipment Grid/List */}
      {filteredEquipment.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        )}>
          {filteredEquipment.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              showBorrowButton={user?.role === 'siswa'}
              onBorrow={() => console.log('Borrow:', eq.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada peralatan ditemukan</p>
        </div>
      )}
    </div>
  );
}

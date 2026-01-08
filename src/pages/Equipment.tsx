import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { equipmentData } from '@/data/mockData';
import { Search, Filter, Plus, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Equipment() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['all', ...new Set(equipmentData.map(e => e.category))];

  const filteredEquipment = equipmentData.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         eq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Peralatan Laboratorium</h1>
          <p className="text-muted-foreground mt-1">
            {equipmentData.length} peralatan tersedia
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary">
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

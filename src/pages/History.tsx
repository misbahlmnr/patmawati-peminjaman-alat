import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { loansData } from '@/data/mockData';
import { Search, Calendar, Package, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function History() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Get completed loans
  const completedLoans = loansData.filter(l => l.status === 'dikembalikan');

  const filteredLoans = completedLoans.filter(loan => {
    const matchesSearch = 
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.equipmentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Riwayat Peminjaman</h1>
          <p className="text-muted-foreground mt-1">
            {completedLoans.length} peminjaman selesai
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari peminjam atau peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-input w-auto"
          >
            <option value="all">Semua Waktu</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredLoans.length > 0 ? (
        <div className="space-y-3">
          {filteredLoans.map((loan) => (
            <div 
              key={loan.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-elevated transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Equipment Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {loan.equipmentName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Peminjam: {loan.borrowerName} {loan.borrowerClass && `(${loan.borrowerClass})`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Jumlah: {loan.quantity} unit
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-6 md:gap-8">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dipinjam</p>
                      <p className="text-sm font-medium">
                        {loan.borrowDate 
                          ? format(new Date(loan.borrowDate), 'd MMM yyyy', { locale: id })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dikembalikan</p>
                      <p className="text-sm font-medium">
                        {loan.returnDate 
                          ? format(new Date(loan.returnDate), 'd MMM yyyy', { locale: id })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={loan.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">Belum ada riwayat</p>
          <p className="text-muted-foreground">
            Riwayat peminjaman yang sudah selesai akan muncul di sini
          </p>
        </div>
      )}
    </div>
  );
}

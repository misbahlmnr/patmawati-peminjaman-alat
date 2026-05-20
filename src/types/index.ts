export type UserRole = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  class?: string;
  nisn?: string;
  nip?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  status?: 'active' | 'inactive';
}

export type ItemType = 'alat' | 'bahan';
export type MaterialUnit = 'pcs' | 'pack' | 'roll' | 'meter' | 'set';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  itemType: ItemType;
  // Common
  stock: number;        // total stok
  available: number;    // tersedia (alat: tersedia dipinjam, bahan: sisa stok)
  image?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  // Alat only
  condition?: 'baik' | 'rusak_ringan' | 'rusak_berat';
  location?: string;
  // Bahan only
  unit?: MaterialUnit;          // pcs / pack / roll / meter
  stockRemaining?: number;      // alias jelas untuk sisa bahan
  minStock?: number;            // ambang stok menipis
}

export type LoanStatus = 'diminta' | 'disetujui' | 'dipinjam' | 'terlambat' | 'dikembalikan' | 'ditolak' | 'diambil';
export type LoanDurationType = 'jam' | 'harian';

export interface Loan {
  id: string;
  equipmentId: string;
  equipmentName: string;
  itemType: ItemType;
  borrowerId: string;
  borrowerName: string;
  borrowerClass?: string;
  teacherId?: string;
  teacherName?: string;
  quantity: number;
  status: LoanStatus;
  durationType?: LoanDurationType;
  requestDate: string;
  requestTime: string;
  approvalDate?: string;
  approvalTime?: string;
  borrowDate?: string;
  borrowTime?: string;
  dueDate?: string;
  dueTime?: string;
  returnDate?: string;
  returnTime?: string;
  returnRequestedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  loanId?: string;
}

export interface DashboardStats {
  totalEquipment: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  pendingRequests: number;
}

// Helper function to check if loan is overdue based on date AND time
export function isLoanOverdue(loan: Loan): boolean {
  if (!loan.dueDate || !loan.dueTime) {
    return false;
  }
  if (loan.status === 'dikembalikan') {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = loan.dueTime.split(':').map(Number);
  const dueDateTime = new Date(loan.dueDate);
  dueDateTime.setHours(hours, minutes, 0, 0);
  
  return now > dueDateTime;
}

// Format date and time for display
export function formatDateTime(date: string, time: string): string {
  const dateObj = new Date(date);
  return `${dateObj.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })} ${time}`;
}

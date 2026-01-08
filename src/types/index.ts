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
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  stock: number;
  available: number;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  location: string;
  image?: string;
  description?: string;
}

export type LoanStatus = 'diminta' | 'disetujui' | 'dipinjam' | 'terlambat' | 'dikembalikan';

export interface Loan {
  id: string;
  equipmentId: string;
  equipmentName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerClass?: string;
  quantity: number;
  status: LoanStatus;
  requestDate: string;
  approvalDate?: string;
  borrowDate?: string;
  dueDate?: string;
  returnDate?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalEquipment: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  pendingRequests: number;
}

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Equipment, Loan, Notification, ItemType, isLoanOverdue } from '@/types';
import {
  equipmentData as seedEquipment,
  loansData as seedLoans,
  notificationsData as seedNotifications,
  usersData,
} from '@/data/mockData';

interface NewLoanInput {
  equipmentId: string;
  quantity: number;
  borrowerId: string;
  borrowerName: string;
  borrowerClass?: string;
  teacherId?: string;
  teacherName?: string;
  notes?: string;
  itemType: ItemType;
  borrowDate?: string;
  borrowTime?: string;
  dueDate?: string;
  dueTime?: string;
}

interface DataContextType {
  equipment: Equipment[];
  loans: Loan[];
  notifications: Notification[];
  // equipment
  addEquipment: (eq: Equipment) => void;
  updateEquipment: (id: string, patch: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  // loans
  submitLoan: (input: NewLoanInput[] | NewLoanInput, shared?: Partial<NewLoanInput>) => Loan[];
  approveLoan: (id: string) => void;
  rejectLoan: (id: string, reason: string) => void;
  requestReturn: (id: string, notes?: string) => void;
  confirmReturn: (id: string) => void;
  // notifications
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  deleteNotification: (id: string) => void;
  unreadCount: (userId: string, role: string) => number;
  pushNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LS = {
  eq: 'lab.equipment.v1',
  loan: 'lab.loans.v1',
  notif: 'lab.notifications.v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function nowParts() {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
    iso: d.toISOString(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>(() => load(LS.eq, seedEquipment));
  const [loans, setLoans] = useState<Loan[]>(() => load(LS.loan, seedLoans));
  const [notifications, setNotifications] = useState<Notification[]>(() => load(LS.notif, seedNotifications));

  useEffect(() => localStorage.setItem(LS.eq, JSON.stringify(equipment)), [equipment]);
  useEffect(() => localStorage.setItem(LS.loan, JSON.stringify(loans)), [loans]);
  useEffect(() => localStorage.setItem(LS.notif, JSON.stringify(notifications)), [notifications]);

  const adminId = useMemo(() => usersData.find(u => u.role === 'admin')?.id ?? '1', []);

  const pushNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications(prev => [
      { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  // Auto-update terlambat status & generate overdue notifications (run on mount + every minute)
  useEffect(() => {
    const tick = () => {
      setLoans(prev => {
        let changed = false;
        const next = prev.map(l => {
          if ((l.status === 'dipinjam' || l.status === 'disetujui') && isLoanOverdue(l) && l.status !== 'terlambat') {
            changed = true;
            // notify
            setNotifications(n => {
              const exists = n.some(x => x.loanId === l.id && x.title.includes('Terlambat'));
              if (exists) return n;
              return [
                {
                  id: `n-od-${l.id}-${Date.now()}`,
                  userId: l.borrowerId,
                  title: 'PERINGATAN: Terlambat',
                  message: `Anda terlambat mengembalikan ${l.equipmentName}.`,
                  type: 'error',
                  read: false,
                  createdAt: new Date().toISOString(),
                  loanId: l.id,
                },
                {
                  id: `n-od-a-${l.id}-${Date.now()}`,
                  userId: adminId,
                  title: 'Keterlambatan Pengembalian',
                  message: `${l.borrowerName} terlambat mengembalikan ${l.equipmentName}.`,
                  type: 'error',
                  read: false,
                  createdAt: new Date().toISOString(),
                  loanId: l.id,
                },
                ...n,
              ];
            });
            return { ...l, status: 'terlambat' as const };
          }
          return l;
        });
        return changed ? next : prev;
      });
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [adminId]);

  const addEquipment = useCallback((eq: Equipment) => setEquipment(prev => [eq, ...prev]), []);
  const updateEquipment = useCallback((id: string, patch: Partial<Equipment>) => {
    setEquipment(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  }, []);
  const deleteEquipment = useCallback((id: string) => setEquipment(prev => prev.filter(e => e.id !== id)), []);

  const submitLoan = useCallback((input: NewLoanInput[] | NewLoanInput, shared?: Partial<NewLoanInput>): Loan[] => {
    const arr = Array.isArray(input) ? input : [input];
    const { date, time } = nowParts();
    const created: Loan[] = [];
    setLoans(prev => {
      const next = [...prev];
      arr.forEach((inp, i) => {
        const merged = { ...inp, ...shared } as NewLoanInput;
        const eq = equipment.find(e => e.id === merged.equipmentId);
        const isBahan = merged.itemType === 'bahan';
        const loan: Loan = {
          id: `L-${Date.now()}-${i}`,
          equipmentId: merged.equipmentId,
          equipmentName: eq?.name ?? '',
          itemType: merged.itemType,
          borrowerId: merged.borrowerId,
          borrowerName: merged.borrowerName,
          borrowerClass: merged.borrowerClass,
          teacherId: merged.teacherId,
          teacherName: merged.teacherName,
          quantity: merged.quantity,
          status: isBahan ? 'diambil' : 'diminta',
          requestDate: date,
          requestTime: time,
          notes: merged.notes,
          borrowDate: merged.borrowDate,
          borrowTime: merged.borrowTime,
          dueDate: isBahan ? undefined : merged.dueDate,
          dueTime: isBahan ? undefined : merged.dueTime,
          approvalDate: isBahan ? date : undefined,
          approvalTime: isBahan ? time : undefined,
        };
        next.unshift(loan);
        created.push(loan);
      });
      return next;
    });

    // Stock updates & notifications
    arr.forEach(inp => {
      const merged = { ...inp, ...shared } as NewLoanInput;
      if (merged.itemType === 'bahan') {
        // bahan: stok berkurang langsung
        setEquipment(prev => prev.map(e => {
          if (e.id !== merged.equipmentId) return e;
          const newRemain = Math.max(0, (e.stockRemaining ?? e.available) - merged.quantity);
          // low stock notif
          if (e.minStock !== undefined && newRemain <= e.minStock) {
            pushNotification({
              userId: adminId,
              title: 'Stok Bahan Menipis',
              message: `${e.name} tersisa ${newRemain} ${e.unit ?? ''}.`,
              type: 'warning',
            });
          }
          return { ...e, available: newRemain, stockRemaining: newRemain };
        }));
        pushNotification({
          userId: adminId,
          title: 'Pengambilan Bahan',
          message: `${merged.borrowerName} mengambil ${merged.quantity} unit ${equipment.find(e => e.id === merged.equipmentId)?.name}.`,
          type: 'info',
        });
      } else {
        // alat: notif ke admin permintaan baru
        pushNotification({
          userId: adminId,
          title: 'Permintaan Peminjaman Baru',
          message: `${merged.borrowerName} mengajukan peminjaman ${equipment.find(e => e.id === merged.equipmentId)?.name} (${merged.quantity} unit).`,
          type: 'info',
        });
      }
    });
    return created;
  }, [equipment, adminId, pushNotification]);

  const approveLoan = useCallback((id: string) => {
    const { date, time } = nowParts();
    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      // kurangi stok alat saat disetujui
      setEquipment(eq => eq.map(e =>
        e.id === l.equipmentId ? { ...e, available: Math.max(0, e.available - l.quantity) } : e
      ));
      pushNotification({
        userId: l.borrowerId,
        title: 'Permintaan Disetujui',
        message: `Peminjaman ${l.equipmentName} telah disetujui. Silakan ambil di lab.`,
        type: 'success',
        loanId: l.id,
      });
      return { ...l, status: 'dipinjam', approvalDate: date, approvalTime: time };
    }));
  }, [pushNotification]);

  const rejectLoan = useCallback((id: string, reason: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      pushNotification({
        userId: l.borrowerId,
        title: 'Permintaan Ditolak',
        message: `Peminjaman ${l.equipmentName} ditolak: ${reason}`,
        type: 'error',
        loanId: l.id,
      });
      return { ...l, status: 'ditolak', rejectionReason: reason };
    }));
  }, [pushNotification]);

  const requestReturn = useCallback((id: string, notes?: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      pushNotification({
        userId: adminId,
        title: 'Permintaan Pengembalian',
        message: `${l.borrowerName} mengajukan pengembalian ${l.equipmentName}.`,
        type: 'info',
        loanId: l.id,
      });
      return { ...l, returnRequestedAt: new Date().toISOString(), notes: notes ? `${l.notes ?? ''}\nPengembalian: ${notes}` : l.notes };
    }));
  }, [adminId, pushNotification]);

  const confirmReturn = useCallback((id: string) => {
    const { date, time } = nowParts();
    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      // kembalikan stok alat
      setEquipment(eq => eq.map(e =>
        e.id === l.equipmentId ? { ...e, available: Math.min(e.stock, e.available + l.quantity) } : e
      ));
      pushNotification({
        userId: l.borrowerId,
        title: 'Pengembalian Selesai',
        message: `${l.equipmentName} telah berhasil dikembalikan.`,
        type: 'success',
        loanId: l.id,
      });
      return { ...l, status: 'dikembalikan', returnDate: date, returnTime: time };
    }));
  }, [pushNotification]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => (n.userId === userId ? { ...n, read: true } : n)));
  }, []);
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  const unreadCount = useCallback((userId: string, role: string) => {
    return notifications.filter(n => (role === 'admin' ? n.userId === adminId : n.userId === userId) && !n.read).length;
  }, [notifications, adminId]);

  return (
    <DataContext.Provider value={{
      equipment, loans, notifications,
      addEquipment, updateEquipment, deleteEquipment,
      submitLoan, approveLoan, rejectLoan, requestReturn, confirmReturn,
      markRead, markAllRead, deleteNotification, unreadCount, pushNotification,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

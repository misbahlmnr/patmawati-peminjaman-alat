import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    name: 'Admin Lab AV',
    email: 'admin@smkn7bekasi.sch.id',
    role: 'admin',
    nip: '198501152010011001',
  },
  guru: {
    id: '2',
    name: 'Bpk. Ahmad Wijaya',
    email: 'ahmad.wijaya@smkn7bekasi.sch.id',
    role: 'guru',
    nip: '198705202012011002',
  },
  siswa: {
    id: '3',
    name: 'Rina Permata',
    email: 'rina.permata@siswa.smkn7bekasi.sch.id',
    role: 'siswa',
    nisn: '0051234567',
    class: 'XII TAV 1',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo login - accepts any password
    if (email && password) {
      setUser(demoUsers[role]);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

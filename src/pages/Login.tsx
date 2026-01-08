import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Camera, User, GraduationCap, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('siswa');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Email atau password salah');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: 'siswa' as UserRole, label: 'Siswa', icon: GraduationCap, desc: 'Pinjam peralatan lab' },
    { value: 'guru' as UserRole, label: 'Guru', icon: User, desc: 'Pantau peminjaman siswa' },
    { value: 'admin' as UserRole, label: 'Admin', icon: Users, desc: 'Kelola sistem' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute bottom-40 right-20 w-96 h-96 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border-2 border-white rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <Camera className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Lab Audio Video</h1>
              <p className="text-white/70">SMK Negeri 7 Bekasi</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-6">
            Sistem Peminjaman<br />
            <span className="text-accent">Peralatan Laboratorium</span>
          </h2>

          <p className="text-lg text-white/80 max-w-md mb-8">
            Platform digital untuk mengelola peminjaman peralatan praktik Audio Video secara efisien dan terstruktur.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {['Manajemen Stok', 'Tracking Realtime', 'Notifikasi Otomatis', 'Laporan Digital'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-white/80">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Lab Audio Video</h1>
              <p className="text-sm text-muted-foreground">SMKN 7 Bekasi</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">Selamat Datang</h2>
            <p className="text-muted-foreground mt-1">Masuk untuk mengakses sistem peminjaman</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Masuk sebagai
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                      selectedRole === role.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6 mx-auto mb-2",
                      selectedRole === role.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <p className={cn(
                      "text-sm font-medium",
                      selectedRole === role.value ? "text-primary" : "text-foreground"
                    )}>
                      {role.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {role.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smkn7bekasi.sch.id"
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-input" />
                <span className="text-sm text-muted-foreground">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo Login:</p>
            <p className="text-xs text-muted-foreground">
              Gunakan email apapun dan password bebas untuk demo
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            © 2026 SMK Negeri 7 Bekasi - Jurusan Audio Video
          </p>
        </div>
      </div>
    </div>
  );
}

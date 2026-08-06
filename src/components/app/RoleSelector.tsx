'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faChalkboardTeacher, faLock, faUser, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExamStore } from '@/lib/store';
// import { login } from '@/app/actions/auth'; // We will build this next

export function RoleSelector() {
  const { setRole, setView } = useExamStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // For now, hardcode bypass to show the UI
    setTimeout(() => {
      if (username === 'admin') {
        setRole('admin');
        setView('admin_dashboard');
      } else if (username === 'guru') {
        setRole('teacher');
        setView('teacher_dashboard');
      } else {
        setRole('student');
        setView('student_dashboard');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-cool-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden bg-white rounded-3xl">
        <div className="bg-gradient-to-br from-[#5B6ABF] to-[#4554A0] p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ulanganku</h1>
          <p className="text-white/80 text-sm">Masuk ke portal ujian Anda</p>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray-400 text-sm" />
                <Input 
                  placeholder="Username / NIS" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-cool-gray-100 border-transparent focus:bg-white transition-colors h-12 rounded-2xl"
                  required
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray-400 text-sm" />
                <Input 
                  type="password"
                  placeholder="Kata Sandi" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-cool-gray-100 border-transparent focus:bg-white transition-colors h-12 rounded-2xl"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#5B6ABF] hover:bg-[#4554A0] text-white h-12 text-base font-medium group rounded-2xl"
            >
              {loading ? 'Memeriksa...' : 'Masuk Sekarang'}
              {!loading && <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-sm group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-cool-gray-400">
              Uji Coba: Ketik <span className="font-semibold text-charcoal">admin</span>, <span className="font-semibold text-charcoal">guru</span>, atau <span className="font-semibold text-charcoal">siswa</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

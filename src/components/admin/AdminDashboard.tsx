'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminStats, getStudentExamSessions, createTeacher, createStudent } from '@/app/actions/admin';
import { Icon } from '@/components/shared/Icon';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, activeExams: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [teacherForm, setTeacherForm] = useState({ name: '', username: '', password: '' });
  const [studentForm, setStudentForm] = useState({ name: '', nis: '', password: '', classGrade: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, sessionsData] = await Promise.all([
        getAdminStats(),
        getStudentExamSessions()
      ]);
      setStats(statsData);
      setSessions(sessionsData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTeacher(teacherForm);
    if (res.success) {
      alert('Guru berhasil ditambahkan!');
      setTeacherForm({ name: '', username: '', password: '' });
      fetchData();
    } else {
      alert('Gagal menambahkan guru: ' + res.error);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createStudent(studentForm);
    if (res.success) {
      alert('Siswa berhasil ditambahkan!');
      setStudentForm({ name: '', nis: '', password: '', classGrade: '' });
      fetchData();
    } else {
      alert('Gagal menambahkan siswa: ' + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Guru</CardTitle>
            <Icon icon="chalkboard-user" className="text-primary text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.teachers}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Siswa</CardTitle>
            <Icon icon="user-graduate" className="text-teal text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.students}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ujian Aktif</CardTitle>
            <Icon icon="file-lines" className="text-amber-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.activeExams}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Buat Akun Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Lengkap</label>
                <Input value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Username</label>
                <Input value={teacherForm.username} onChange={e => setTeacherForm({...teacherForm, username: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <Input type="password" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} required />
              </div>
              <Button type="submit" className="w-full">Simpan Guru</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Buat Akun Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Lengkap</label>
                <Input value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">NIS</label>
                <Input value={studentForm.nis} onChange={e => setStudentForm({...studentForm, nis: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Kelas</label>
                <Input value={studentForm.classGrade} onChange={e => setStudentForm({...studentForm, classGrade: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <Input type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required />
              </div>
              <Button type="submit" className="w-full">Simpan Siswa</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Sesi Ujian Siswa (Monitor)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Siswa</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">ID Ujian</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Nilai</th>
                  <th className="px-4 py-3 rounded-tr-lg">Strikes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Memuat data...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Belum ada sesi ujian</td></tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{session.student?.name}</td>
                      <td className="px-4 py-3">{session.student?.classGrade}</td>
                      <td className="px-4 py-3">{session.examId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.status === 'completed' ? 'bg-green-100 text-green-700' :
                          session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'flagged' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{session.score ?? '-'}</td>
                      <td className="px-4 py-3 text-red-500 font-bold">{session.antiCheatStrikes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

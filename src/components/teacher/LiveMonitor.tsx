'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faPlay,
  faUnlink,
  faWarning,
  faCircle,
  faCheck,
  faStop,
  faExclamationTriangle,
  faEye,
  faSync,
  faBell,
  faClock,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { getLiveMonitoringData } from '@/app/actions/monitor';
import { getActiveExams } from '@/app/actions/exam';
import { StudentExamSession, StudentExamStatus, MonitoringData, Exam } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AntiCheatAlert {
  id: string;
  timestamp: string;
  studentName: string;
  event: string;
  severity: 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  StudentExamStatus,
  { label: string; icon: typeof faCircle; className: string }
> = {
  active: {
    label: 'Aktif',
    icon: faCircle,
    className: 'bg-emerald-100 text-emerald-700',
  },
  disconnected: {
    label: 'Terputus',
    icon: faUnlink,
    className: 'bg-amber-100 text-amber-700',
  },
  flagged: {
    label: 'Diberi Flag',
    icon: faWarning,
    className: 'bg-red-100 text-red-700',
  },
  completed: {
    label: 'Selesai',
    icon: faCheck,
    className: 'bg-slate-200 text-slate-700',
  },
  auto_submitted: {
    label: 'Auto-Submit',
    icon: faStop,
    className: 'bg-red-200 text-red-900',
  },
  not_started: {
    label: 'Belum Mulai',
    icon: faCircle,
    className: 'bg-slate-50 text-slate-400',
  },
};

// ---------------------------------------------------------------------------
// Initial alert data
// ---------------------------------------------------------------------------
const INITIAL_ALERTS: AntiCheatAlert[] = [
  {
    id: 'a1',
    timestamp: '09:12:34',
    studentName: 'Budi Santoso',
    event: 'Tab switch terdeteksi (3x dalam 30 detik)',
    severity: 'medium',
  },
  {
    id: 'a2',
    timestamp: '09:15:02',
    studentName: 'Dewi Kartika',
    event: 'Copy/paste terdeteksi pada textarea jawaban',
    severity: 'high',
  },
  {
    id: 'a3',
    timestamp: '09:18:45',
    studentName: 'Dewi Kartika',
    event: 'Window lost focus selama lebih dari 10 detik',
    severity: 'high',
  },
  {
    id: 'a4',
    timestamp: '09:22:10',
    studentName: 'Budi Santoso',
    event: 'Koneksi terputus secara tiba-tiba',
    severity: 'medium',
  },
];

const RANDOM_EVENTS = [
  'Tab switch terdeteksi',
  'Window lost focus selama 5 detik',
  'Koneksi tidak stabil',
  'Right-click terdeteksi',
  'DevTools terbuka terdeteksi',
  'Screen resize terdeteksi',
  'Copy/paste terdeteksi',
];

// ---------------------------------------------------------------------------
// Chart mock data
// ---------------------------------------------------------------------------
const ACTIVITY_DATA = [
  { time: '09:00', aktif: 6, terputus: 0 },
  { time: '09:10', aktif: 5, terputus: 1 },
  { time: '09:20', aktif: 4, terputus: 1 },
  { time: '09:30', aktif: 4, terputus: 2 },
  { time: '09:40', aktif: 3, terputus: 1 },
  { time: '09:50', aktif: 3, terputus: 1 },
  { time: '10:00', aktif: 2, terputus: 1 },
  { time: '10:10', aktif: 3, terputus: 0 },
];

// ---------------------------------------------------------------------------
// Helper: format elapsed time
// ---------------------------------------------------------------------------
function formatElapsed(startTime?: string): string {
  if (!startTime) return '--:--';
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - start) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Helper: get initials
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Avatar colors for student initials
// ---------------------------------------------------------------------------
const AVATAR_COLORS = [
  '#5B6ABF', '#6C5CE7', '#00B894', '#E17055', '#0984E3',
  '#D63031', '#FDCB6E', '#E84393', '#00CEC9', '#636E72',
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Main Component
export default function LiveMonitor() {
  const [monitoring, setMonitoring] = useState<MonitoringData>({
    examId: '',
    examTitle: '',
    totalStudents: 0,
    activeStudents: 0,
    disconnectedStudents: 0,
    flaggedStudents: 0,
    completedStudents: 0,
    sessions: [],
  });
  const [alerts, setAlerts] = useState<AntiCheatAlert[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudentExamSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const alertEndRef = useRef<HTMLDivElement>(null);

  // Fetch active exams on mount
  useEffect(() => {
    getActiveExams().then(res => {
      if (res.success && res.data) {
        setActiveExams(res.data);
        if (res.data.length > 0) {
          setSelectedExamId(res.data[0].id);
        }
      }
    });
  }, []);

  const currentExam = activeExams.find(e => e.id === selectedExamId);

  // Auto-scroll alerts to bottom
  useEffect(() => {
    if (alertEndRef.current) {
      alertEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [alerts]);

  const fetchData = useCallback(async () => {
    if (!selectedExamId) return;
    setIsRefreshing(true);
    const res = await getLiveMonitoringData(selectedExamId);
    if (res.success && res.data) {
      setMonitoring(res.data);
      setAlerts(res.data.alerts || []);
    }
    setIsRefreshing(false);
  }, [selectedExamId]);

  // Polling for real-time updates
  useEffect(() => {
    fetchData(); // initial fetch
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleViewDetail = useCallback((session: StudentExamSession) => {
    setSelectedSession(session);
    setDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleClearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const handleSendWarning = useCallback(() => {
    // Simulated action
  }, []);

  const handleForceSubmit = useCallback(() => {
    if (selectedSession) {
      setMonitoring(prev => ({
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === selectedSession.id
            ? { ...s, status: 'auto_submitted' as StudentExamStatus, endTime: new Date().toISOString() }
            : s
        ),
      }));
      setDialogOpen(false);
    }
  }, [selectedSession]);

  const handleDisconnect = useCallback(() => {
    if (selectedSession) {
      setMonitoring(prev => ({
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === selectedSession.id
            ? { ...s, status: 'disconnected' as StudentExamStatus }
            : s
        ),
      }));
      setDialogOpen(false);
    }
  }, [selectedSession]);

  // ---------------------------------------------------------------------------
  // Summary cards config
  // ---------------------------------------------------------------------------
  const summaryCards = [
    {
      title: 'Total Siswa',
      value: monitoring.totalStudents,
      icon: faUsers,
      gradientFrom: '#5B6ABF',
      gradientTo: '#7B8AD4',
      iconBgClass: 'bg-gradient-to-br from-[#5B6ABF] to-[#7B8AD4]',
      progressValue: 100,
      progressColor: '#5B6ABF',
    },
    {
      title: 'Aktif',
      value: monitoring.activeStudents,
      icon: faPlay,
      gradientFrom: '#10b981',
      gradientTo: '#34d399',
      iconBgClass: 'bg-gradient-to-br from-emerald-500 to-emerald-400',
      progressValue: monitoring.totalStudents > 0 ? (monitoring.activeStudents / monitoring.totalStudents) * 100 : 0,
      progressColor: '#10b981',
      pulse: true,
    },
    {
      title: 'Terputus',
      value: monitoring.disconnectedStudents,
      icon: faUnlink,
      gradientFrom: '#f59e0b',
      gradientTo: '#fbbf24',
      iconBgClass: 'bg-gradient-to-br from-amber-500 to-amber-400',
      progressValue: monitoring.totalStudents > 0 ? (monitoring.disconnectedStudents / monitoring.totalStudents) * 100 : 0,
      progressColor: '#f59e0b',
    },
    {
      title: 'Diberi Flag',
      value: monitoring.flaggedStudents,
      icon: faWarning,
      gradientFrom: '#FF6B6B',
      gradientTo: '#FF9B9B',
      iconBgClass: 'bg-gradient-to-br from-[#FF6B6B] to-[#FF9B9B]',
      progressValue: monitoring.totalStudents > 0 ? (monitoring.flaggedStudents / monitoring.totalStudents) * 100 : 0,
      progressColor: '#FF6B6B',
      pulseWarning: monitoring.flaggedStudents > 0,
    },
  ];

  // ---------------------------------------------------------------------------
  // Pie chart data
  // ---------------------------------------------------------------------------
  const pieData = [
    { name: 'Aktif', value: monitoring.activeStudents, color: '#10b981' },
    { name: 'Terputus', value: monitoring.disconnectedStudents, color: '#f59e0b' },
    { name: 'Diberi Flag', value: monitoring.flaggedStudents, color: '#FF6B6B' },
    { name: 'Selesai', value: monitoring.completedStudents, color: '#64748b' },
  ].filter(d => d.value > 0);

  // ---------------------------------------------------------------------------
  // Heatmap Data (Question index distribution)
  // ---------------------------------------------------------------------------
  const heatmapData = currentExam
    ? Array(currentExam.questions?.length || 0)
        .fill(0)
        .map((_, i) => ({
          question: `Q${i + 1}`,
          students: monitoring.sessions.filter(
            (s) => s.status === 'active' && s.currentQuestionIndex === i
          ).length,
        }))
    : [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#5B6ABF] to-[#7B8AD4]" />
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B6ABF] to-[#7B8AD4] flex items-center justify-center">
                <FontAwesomeIcon icon={faEye} className="text-white text-sm" />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: '#2D3436' }}>
                  Live Monitor
                </h2>
                <p className="text-xs" style={{ color: '#636e72' }}>
                  Pantau ujian secara real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-full sm:w-[280px] h-9 text-sm">
                  <SelectValue placeholder="Pilih ujian aktif" />
                </SelectTrigger>
                <SelectContent>
                  {activeExams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-9 px-3 shrink-0 border-slate-300"
              >
                <FontAwesomeIcon
                  icon={faSync}
                  className={`text-xs mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
          {currentExam && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#636e72' }}>
                <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                <span>{currentExam.durationMinutes} menit</span>
              </div>
              <Badge
                className={`text-[10px] px-2 py-0 ${
                  currentExam.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {currentExam.status === 'active' ? 'Berlangsung' : 'Terjadwal'}
              </Badge>
              <span className="text-xs" style={{ color: '#636e72' }}>
                {currentExam.questions?.length || 0} soal
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card key={card.title} className="border border-slate-200 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBgClass}`}
                >
                  <FontAwesomeIcon icon={card.icon} className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#636e72' }}>
                    {card.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold" style={{ color: '#2D3436' }}>
                      {card.value}
                    </p>
                    {card.pulse && card.value > 0 && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                    )}
                    {card.pulseWarning && card.value > 0 && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#FF6B6B' }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#FF6B6B' }} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Progress
                value={card.progressValue}
                className="h-1.5"
                style={
                  {
                    '--progress-background': card.progressColor,
                  } as React.CSSProperties
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Status Table */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ color: '#2D3436' }}>
            Status Siswa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Nama Siswa</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Strike</TableHead>
                  <TableHead className="text-xs font-semibold">Progress</TableHead>
                  <TableHead className="text-xs font-semibold">Waktu</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoring.sessions.map((session, sIdx) => {
                  const statusConfig = STATUS_CONFIG[session.status];
                  const progressPercent = Math.round(((session.currentQuestionIndex + 1) / 10) * 100);
                  const isThreeStrikes = session.antiCheatStrikes >= 3;
                  return (
                    <TableRow
                      key={session.id}
                      className={`transition-colors ${
                        isThreeStrikes
                          ? 'bg-red-50/50 hover:bg-red-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: getAvatarColor(sIdx) }}
                          >
                            {getInitials(session.student.name)}
                          </div>
                          <div>
                            <span className="font-medium text-sm block" style={{ color: '#2D3436' }}>
                              {session.student.name}
                            </span>
                            <span className="text-[10px]" style={{ color: '#636e72' }}>
                              {session.student.classGrade}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${statusConfig.className}`}
                        >
                          <FontAwesomeIcon icon={statusConfig.icon} className="text-[8px]" />
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                                i < session.antiCheatStrikes
                                  ? ''
                                  : 'bg-slate-200'
                              }`}
                              style={
                                i < session.antiCheatStrikes
                                  ? { backgroundColor: '#FF6B6B', boxShadow: isThreeStrikes ? '0 0 6px rgba(255,107,107,0.5)' : undefined }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress
                            value={progressPercent}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-[11px] font-medium w-8 text-right" style={{ color: '#636e72' }}>
                            {progressPercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-[10px]" style={{ color: '#b2bec3' }} />
                          <span className="text-xs font-mono" style={{ color: '#2D3436' }}>
                            {formatElapsed(session.startTime)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(session)}
                            className="h-7 px-2.5 text-[11px] border-slate-300"
                            style={{ color: '#5B6ABF' }}
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1 text-[10px]" />
                            Detail
                          </Button>
                          {session.status === 'flagged' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(session)}
                              className="h-7 px-2.5 text-[11px] border-[#FF6B6B]/30 text-[#FF6B6B] hover:bg-[#FF6B6B]/5"
                            >
                              <FontAwesomeIcon icon={faBell} className="mr-1 text-[10px]" />
                              Warn
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Area Chart */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: '#2D3436' }}>
              Aktivitas Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="aktifGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="terputusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#636e72' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#636e72' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aktif"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#aktifGrad)"
                    name="Aktif"
                  />
                  <Area
                    type="monotone"
                    dataKey="terputus"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#terputusGrad)"
                    name="Terputus"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: '#2D3436' }}>
              Distribusi Status Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-col gap-2 ml-4">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span style={{ color: '#636e72' }}>{entry.name}</span>
                    <span className="font-semibold" style={{ color: '#2D3436' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Heatmap Section */}
      {currentExam && (
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: '#2D3436' }}>
              Live Activity Heatmap
            </CardTitle>
            <p className="text-xs text-slate-500">
              Sebaran posisi soal yang sedang dikerjakan siswa. Bar berwarna merah menunjukkan di mana banyak siswa yang terhenti (mandek).
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="question" tick={{ fontSize: 10, fill: '#636e72' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#636e72' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(91, 106, 191, 0.1)' }}
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar
                    dataKey="students"
                    name="Siswa"
                    radius={[4, 4, 0, 0]}
                  >
                    {heatmapData.map((entry, index) => {
                      const isHot = entry.students >= monitoring.activeStudents * 0.3 && entry.students > 1; 
                      return (
                        <Cell key={`cell-${index}`} fill={isHot ? '#FF6B6B' : '#5B6ABF'} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anti-Cheat Alert Log */}
      <Card className="border border-slate-200 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base" style={{ color: '#2D3436' }}>
                Log Anti-Cheat
              </CardTitle>
              <Badge className="text-[10px] px-1.5 py-0 bg-[#FF6B6B] text-white">
                {alerts.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAlerts}
              className="h-7 px-2 text-xs text-slate-500 hover:text-[#FF6B6B]"
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-3">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs" style={{ color: '#b2bec3' }}>
                  Tidak ada alert
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-100"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: alert.severity === 'high' ? '#FF6B6B' : '#f59e0b',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: alert.severity === 'high' ? '#FFF1F1' : '#FFF8E1',
                      }}
                    >
                      <FontAwesomeIcon
                        icon={alert.severity === 'high' ? faExclamationTriangle : faWarning}
                        className="text-xs"
                        style={{
                          color: alert.severity === 'high' ? '#FF6B6B' : '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: '#2D3436' }}>
                          {alert.studentName}
                        </span>
                        <Badge
                          className={`text-[9px] px-1 py-0 ${
                            alert.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {alert.severity === 'high' ? 'HIGH' : 'MEDIUM'}
                        </Badge>
                      </div>
                      <p className="text-xs" style={{ color: '#636e72' }}>
                        {alert.event}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 mt-1" style={{ color: '#b2bec3' }}>
                      {alert.timestamp}
                    </span>
                  </div>
                ))
              )}
              <div ref={alertEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#2D3436' }}>
              Detail Siswa
            </DialogTitle>
            <DialogDescription>
              Informasi detail sesi ujian siswa
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (() => {
            const sIdx = monitoring.sessions.findIndex(s => s.id === selectedSession.id);
            const progressPercent = Math.round(((selectedSession.currentQuestionIndex + 1) / 10) * 100);
            return (
              <div className="space-y-5">
                {/* Student header with avatar */}
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: getAvatarColor(sIdx >= 0 ? sIdx : 0) }}
                  >
                    {getInitials(selectedSession.student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base" style={{ color: '#2D3436' }}>
                      {selectedSession.student.name}
                    </p>
                    <p className="text-xs" style={{ color: '#636e72' }}>
                      {selectedSession.student.classGrade}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_CONFIG[selectedSession.status].className}`}
                  >
                    <FontAwesomeIcon icon={STATUS_CONFIG[selectedSession.status].icon} className="text-[8px]" />
                    {STATUS_CONFIG[selectedSession.status].label}
                  </span>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Session Stats */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#636e72' }}>
                        Statistik Sesi
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-xs" style={{ color: '#636e72' }}>Waktu Mulai</span>
                          <span className="text-xs font-mono font-medium" style={{ color: '#2D3436' }}>
                            {selectedSession.startTime
                              ? new Date(selectedSession.startTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false,
                                })
                              : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-xs" style={{ color: '#636e72' }}>Waktu Berlalu</span>
                          <span className="text-xs font-mono font-medium" style={{ color: '#2D3436' }}>
                            {formatElapsed(selectedSession.startTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-xs" style={{ color: '#636e72' }}>Anti-Cheat Strikes</span>
                          <span className="text-xs font-medium" style={{ color: selectedSession.antiCheatStrikes >= 2 ? '#FF6B6B' : '#2D3436' }}>
                            {selectedSession.antiCheatStrikes} / 3
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Strike visualization */}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#636e72' }}>
                        Strike Status
                      </p>
                      <div className="flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                              i < selectedSession.antiCheatStrikes
                                ? 'text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                            style={
                              i < selectedSession.antiCheatStrikes
                                ? {
                                    backgroundColor:
                                      selectedSession.antiCheatStrikes >= 3
                                        ? '#FF6B6B'
                                        : selectedSession.antiCheatStrikes >= 2
                                          ? '#f59e0b'
                                          : '#5B6ABF',
                                  }
                                : undefined
                            }
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      {selectedSession.antiCheatStrikes >= 3 && (
                        <p className="text-[10px] font-medium mt-1.5" style={{ color: '#FF6B6B' }}>
                          Auto-submit triggered
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Progress Visualization */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#636e72' }}>
                        Progress Soal
                      </p>
                      <div className="p-3 rounded-lg bg-white border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold" style={{ color: '#2D3436' }}>
                            {selectedSession.currentQuestionIndex + 1} / 10
                          </span>
                          <span className="text-xs font-medium" style={{ color: '#5B6ABF' }}>
                            {progressPercent}%
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2.5" />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px]" style={{ color: '#b2bec3' }}>Soal 1</span>
                          <span className="text-[10px]" style={{ color: '#b2bec3' }}>Soal 10</span>
                        </div>
                      </div>
                    </div>

                    {/* Anti-Cheat Timeline */}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#636e72' }}>
                        Timeline Anti-Cheat
                      </p>
                      {selectedSession.antiCheatStrikes > 0 ? (
                        <div className="space-y-0">
                          {Array.from({ length: selectedSession.antiCheatStrikes }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 relative">
                              {/* Timeline line */}
                              {i < selectedSession.antiCheatStrikes - 1 && (
                                <div
                                  className="absolute left-[7px] top-5 w-0.5 h-4"
                                  style={{ backgroundColor: i >= 2 ? '#FF6B6B' : '#f59e0b' }}
                                />
                              )}
                              <div
                                className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 z-10"
                                style={{
                                  backgroundColor: i >= 2 ? '#FF6B6B' : i >= 1 ? '#f59e0b' : '#5B6ABF',
                                }}
                              />
                              <div className="pb-3">
                                <p className="text-xs font-medium" style={{ color: '#2D3436' }}>
                                  Strike {i + 1}
                                </p>
                                <p className="text-[10px]" style={{ color: '#636e72' }}>
                                  {RANDOM_EVENTS[i % RANDOM_EVENTS.length]}
                                </p>
                                <p className="text-[10px] font-mono" style={{ color: '#b2bec3' }}>
                                  {new Date().toLocaleTimeString('id-ID', { hour12: false })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                          Tidak ada pelanggaran terdeteksi
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendWarning}
                    className="text-xs border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    <FontAwesomeIcon icon={faBell} className="mr-1.5 text-[10px]" />
                    Send Warning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceSubmit}
                    className="text-xs border-[#FF6B6B]/30 text-[#FF6B6B] hover:bg-[#FF6B6B]/5"
                  >
                    <FontAwesomeIcon icon={faStop} className="mr-1.5 text-[10px]" />
                    Force Submit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={faUnlink} className="mr-1.5 text-[10px]" />
                    Disconnect
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

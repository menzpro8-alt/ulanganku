'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/lib/store';
import type { AppView, ExamStatus } from '@/lib/types';
import { getDashboardStats } from '@/app/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChalkboardUser,
  faBook,
  faPlay,
  faUsers,
  faChartBar,
  faArrowUp,
  faArrowDown,
  faPlus,
  faUpload,
  faBolt,
  faEye,
  faClock,
  faShieldHalved,
  faCircle,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#5B6ABF', '#00B894', '#FDCB6E', '#FF6B6B', '#74B9FF'];

// ============================================================
// Stats Config
// ============================================================
const STATS = [
  {
    label: 'Total Soal',
    value: '156',
    icon: faBook,
    iconBg: 'bg-[#5B6ABF]/10',
    iconColor: 'text-[#5B6ABF]',
    borderColor: 'border-l-[#5B6ABF]',
    trend: '+12%',
    trendUp: true,
  },
  {
    label: 'Ujian Aktif',
    value: '3',
    icon: faPlay,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-l-emerald-500',
    trend: '+8%',
    trendUp: true,
  },
  {
    label: 'Siswa Online',
    value: '24',
    icon: faUsers,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-l-amber-500',
    trend: '-3%',
    trendUp: false,
  },
  {
    label: 'Rata-rata Nilai',
    value: '78.5',
    icon: faChartBar,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    borderColor: 'border-l-sky-500',
    trend: '+5%',
    trendUp: true,
  },
];

// Function to time ago
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
}

// ============================================================
// Quick Actions
// ============================================================
const QUICK_ACTIONS = [
  {
    key: 'teacher_question_editor' as AppView,
    label: 'Buat Soal Baru',
    icon: faPlus,
    bg: 'bg-[#5B6ABF]',
    hoverBg: 'hover:bg-[#4A59AE]',
  },
  {
    key: 'teacher_import' as AppView,
    label: 'Import Soal',
    icon: faUpload,
    bg: 'bg-white border border-[#E2E8F0]',
    hoverBg: 'hover:bg-[#F8FAFC]',
  },
  {
    key: 'teacher_ai_generator' as AppView,
    label: 'AI Generator',
    icon: faBolt,
    bg: 'bg-white border border-[#E2E8F0]',
    hoverBg: 'hover:bg-[#F8FAFC]',
  },
  {
    key: 'teacher_monitor' as AppView,
    label: 'Monitor Ujian',
    icon: faEye,
    bg: 'bg-white border border-[#E2E8F0]',
    hoverBg: 'hover:bg-[#F8FAFC]',
  },
];

// ============================================================
// Helpers
// ============================================================
function formatDateIndonesian(): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

const STATUS_CONFIG: Record<ExamStatus, { label: string; bg: string; text: string; dot?: string }> = {
  active: { label: 'Aktif', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  published: { label: 'Terbit', bg: 'bg-[#5B6ABF]/10', text: 'text-[#5B6ABF]' },
  draft: { label: 'Draft', bg: 'bg-[#94A3B8]/10', text: 'text-[#636E72]' },
  completed: { label: 'Selesai', bg: 'bg-sky-100', text: 'text-sky-700' },
};

// ============================================================
// Custom Tooltip for Charts
// ============================================================
function BarChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#E2E8F0] px-3 py-2 text-xs">
      <p className="font-semibold text-[#2D3436]">{label}</p>
      <p className="text-[#5B6ABF]">{`Nilai: ${payload[0].value}`}</p>
    </div>
  );
}

function PieChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#E2E8F0] px-3 py-2 text-xs">
      <p className="font-semibold text-[#2D3436]">{payload[0].name}</p>
      <p className="text-[#5B6ABF]">{`${payload[0].value} soal`}</p>
    </div>
  );
}

// ============================================================
// Component
// ============================================================
export function TeacherDashboard() {
  const setView = useExamStore((state) => state.setView);
  const [dbStats, setDbStats] = useState({
    totalQuestions: 0,
    activeExams: 0,
    onlineStudents: 0,
    avgScore: '0.0',
    activities: [] as any[],
    avgScoreData: [] as { subject: string, score: number }[],
    questionTypeData: [] as { name: string, value: number }[]
  });
  
  useEffect(() => {
    getDashboardStats().then(res => {
      if (res.success && res.data) {
        setDbStats(res.data);
      }
    });
  }, []);

  const dynamicStats = [
    {
      label: 'Total Soal',
      value: dbStats.totalQuestions.toString(),
      icon: faBook,
      iconBg: 'bg-[#5B6ABF]/10',
      iconColor: 'text-[#5B6ABF]',
      borderColor: 'border-l-[#5B6ABF]',
      trend: '+0%',
      trendUp: true,
    },
    {
      label: 'Ujian Aktif',
      value: dbStats.activeExams.toString(),
      icon: faPlay,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-l-emerald-500',
      trend: '+0%',
      trendUp: true,
    },
    {
      label: 'Siswa Online',
      value: dbStats.onlineStudents.toString(),
      icon: faUsers,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-l-amber-500',
      trend: '+0%',
      trendUp: true,
    },
    {
      label: 'Rata-rata Nilai',
      value: dbStats.avgScore,
      icon: faChartBar,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      borderColor: 'border-l-sky-500',
      trend: '+0%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ===== Welcome Card ===== */}
      <Card className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] text-white border-0 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Glass-morphism icon circle */}
              <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                <FontAwesomeIcon
                  icon={faChalkboardUser}
                  className="text-white text-xl"
                  style={{ width: 24, height: 24 }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">Selamat Datang, Guru</h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {formatDateIndonesian()}
                </p>
                <p className="text-white/50 text-xs mt-1 italic">
                  &quot;Pendidikan adalah senjata paling ampuh untuk mengubah dunia.&quot; - Nelson Mandela
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/15 hover:text-white h-9 text-sm"
                onClick={() => setView('teacher_question_editor')}
              >
                <FontAwesomeIcon icon={faPlus} style={{ width: 14, height: 14 }} className="mr-2" />
                Buat Soal
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/15 hover:text-white h-9 text-sm"
                onClick={() => setView('teacher_monitor')}
              >
                <FontAwesomeIcon icon={faEye} style={{ width: 14, height: 14 }} className="mr-2" />
                Monitor Ujian
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Stats Grid ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {dynamicStats.map((stat) => (
          <Card
            key={stat.label}
            className={`hover:shadow-md transition-shadow border-l-4 ${stat.borderColor}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}
                >
                  <FontAwesomeIcon
                    icon={stat.icon}
                    className={stat.iconColor}
                    style={{ width: 20, height: 20 }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#636E72] font-medium truncate">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#2D3436] leading-tight">
                      {stat.value}
                    </p>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        stat.trendUp ? 'text-emerald-600' : 'text-[#FF6B6B]'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={stat.trendUp ? faArrowUp : faArrowDown}
                        style={{ width: 10, height: 10 }}
                      />
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== Charts Section ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Average Score per Subject */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#2D3436]">
              Nilai Rata-rata per Mata Pelajaran
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px]">
              {dbStats.avgScoreData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-cool-gray-400">
                  Belum ada data nilai ujian.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dbStats.avgScoreData} barCategoryGap="20%">
                    <XAxis
                      dataKey="subject"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#636E72' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#636E72' }}
                      domain={[0, 100]}
                      width={35}
                    />
                    <Tooltip content={<BarChartTooltip />} />
                    <Bar
                      dataKey="score"
                      fill="#5B6ABF"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Question Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#2D3436]">
              Distribusi Tipe Soal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] flex items-center">
              {dbStats.questionTypeData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-cool-gray-400">
                  Belum ada soal dibuat.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dbStats.questionTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dbStats.questionTypeData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="space-y-1.5 shrink-0 pr-2">
                    {dbStats.questionTypeData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-[#636E72]">{entry.name}</span>
                        <span className="font-semibold text-[#2D3436] ml-auto">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Content Grid: Activity + Quick Actions ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-charcoal">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {dbStats.activities.length === 0 ? (
                <div className="text-center py-6 text-sm text-cool-gray-400">Belum ada aktivitas.</div>
              ) : dbStats.activities.map((activity: any, index: number) => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 ${activity.type === 'question' ? 'text-emerald-600' : 'text-[#5B6ABF]'}`}>
                    <FontAwesomeIcon icon={activity.type === 'question' ? faBook : faPlay} className="text-xs" />
                  </div>
                  
                  {/* Content */}
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow ${activity.type === 'question' ? 'border-l-emerald-500' : 'border-l-[#5B6ABF]'} border-l-4`}>
                    <div className="flex items-center justify-between mb-1">
                      <time className="text-[10px] font-medium text-cool-gray-400">
                        {timeAgo(activity.time)}
                      </time>
                    </div>
                    <p className="text-xs text-charcoal-light leading-snug">{activity.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold text-[#2D3436]">
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  onClick={() => setView(action.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${action.bg} ${action.hoverBg} cursor-pointer group`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      action.key === 'teacher_question_editor'
                        ? 'bg-white/20'
                        : 'bg-[#5B6ABF]/10'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={action.icon}
                      className={
                        action.key === 'teacher_question_editor'
                          ? 'text-white'
                          : 'text-[#5B6ABF]'
                      }
                      style={{ width: 16, height: 16 }}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      action.key === 'teacher_question_editor'
                        ? 'text-white'
                        : 'text-[#2D3436]'
                    }`}
                  >
                    {action.label}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={`ml-auto transition-transform group-hover:translate-x-0.5 ${
                      action.key === 'teacher_question_editor'
                        ? 'text-white/60'
                        : 'text-[#94A3B8]'
                    }`}
                    style={{ width: 12, height: 12 }}
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

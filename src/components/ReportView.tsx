import React, { useState } from 'react';
import { Course, Student, AttendanceStatus } from '../types';
import { ArrowLeft, Search, Download, AlertTriangle, CheckCircle2, TrendingUp, Users, CalendarDays, Copy, Check } from 'lucide-react';

interface ReportViewProps {
  course: Course;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ course, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const totalSessions = course.sessions.length;
  const students = course.students;

  // Compute student level statistics
  const studentMetrics = students.map((student) => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    course.sessions.forEach((session) => {
      const record = session.records[student.id];
      if (record === 'Present') present++;
      else if (record === 'Late') late++;
      else if (record === 'Absent') absent++;
      else if (record === 'Excused') excused++;
    });

    const attendedCount = present + late + excused; // Excused counts as attended or excused from penalty
    const rate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

    return {
      student,
      present,
      late,
      absent,
      excused,
      attendedCount,
      rate,
    };
  });

  // Filters
  const filteredMetrics = studentMetrics.filter(
    (m) =>
      m.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // High level course averages
  const classAverageRate =
    studentMetrics.length > 0
      ? Math.round(studentMetrics.reduce((acc, m) => acc + m.rate, 0) / studentMetrics.length)
      : 0;

  const atRiskCount = studentMetrics.filter((m) => m.rate < 75 && totalSessions > 0).length;

  // Generate CSV data for simple copying/downloading
  const handleExportCSV = () => {
    const headers = 'Roll Number,Full Name,Email,Present,Late,Absent,Excused,Attendance Rate (%)\n';
    const rows = studentMetrics
      .map(
        (m) =>
          `"${m.student.rollNo}","${m.student.name}","${m.student.email}",${m.present},${m.late},${m.absent},${m.excused},${m.rate}`
      )
      .join('\n');
    
    const csvContent = headers + rows;
    
    // Copy to clipboard with instant feedback
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white min-h-screen pb-12">
      {/* Upper Navigation Header bar */}
      <header className="sticky top-0 bg-white border-b-2 border-stone-200 z-20 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 -ml-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-yellow-950 leading-tight">Course Metrics & Performance</h1>
              <p className="text-xs text-yellow-700 font-mono font-bold mt-0.5">{course.code} • {course.name}</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-yellow-900 text-white rounded-xl text-xs font-bold hover:bg-yellow-800 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 animate-scale-up" /> Copied CSV!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Export Attendance CSV
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Core Quick stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <TrendingUp className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">Class Average</span>
              <span className="text-2xl font-black font-mono text-yellow-950 block mt-0.5">{classAverageRate}%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-150">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">Total Enrolled</span>
              <span className="text-2xl font-black font-mono text-yellow-950 block mt-0.5">{students.length} Pupils</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-150">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">At Risk (&lt;75%)</span>
              <span className="text-2xl font-black font-mono text-rose-750 block mt-0.5">{atRiskCount} Warning</span>
            </div>
          </div>
        </div>

        {/* CSV copying information hint if they click export */}
        {copied && (
          <div className="p-4 bg-emerald-50 border border-emerald-250/80 rounded-2xl text-emerald-800 text-xs font-bold animate-fade-in">
            CSV data successfully copied to your clipboard! You can paste this directly into tools like Microsoft Excel, Google Sheets, or Apple Numbers to process.
          </div>
        )}

        {/* Attendance Table card */}
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-white border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-stone-705 uppercase tracking-wider font-mono">
                Student Performance Registry
              </h3>
              <p className="text-[11px] text-stone-400 font-bold mt-1 font-mono">Calculated based on {totalSessions} live marked sessions</p>
            </div>

            {/* In-table search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Find student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-stone-55 border-2 border-stone-200 rounded-xl text-xs text-stone-705 focus:outline-hidden focus:border-yellow-400 font-bold font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/50 border-b-2 border-stone-205 text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">
                  <th className="p-4">Student Info</th>
                  <th className="p-4 text-center">Present</th>
                  <th className="p-4 text-center">Late</th>
                  <th className="p-4 text-center">Absent</th>
                  <th className="p-4 text-center">Excused</th>
                  <th className="p-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-xs">
                {filteredMetrics.map(({ student, present, late, absent, excused, rate }) => {
                  // Style based on score risk
                  let rateColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                  if (totalSessions > 0) {
                    if (rate < 75) rateColor = 'text-rose-705 bg-rose-50 border-rose-100';
                    else if (rate < 85) rateColor = 'text-amber-705 bg-amber-50 border-amber-100';
                  } else {
                    rateColor = 'text-stone-500 bg-white border-stone-100';
                  }

                  return (
                    <tr key={student.id} className="hover:bg-white/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-stone-100 text-yellow-950 flex items-center justify-center font-black text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold text-stone-800">{student.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono font-medium">{student.rollNo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-stone-700">{present}</td>
                      <td className="p-4 text-center font-bold font-mono text-stone-705">{late}</td>
                      <td className="p-4 text-center font-bold font-mono text-rose-605">{absent}</td>
                      <td className="p-4 text-center font-bold font-mono text-yellow-900">{excused}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-1 rounded-lg font-bold font-mono border text-[11px] ${rateColor}`}>
                            {totalSessions > 0 ? `${rate}%` : '—'}
                          </span>
                          
                          {/* Mini visual indicator track */}
                          {totalSessions > 0 && (
                            <div className="w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rate < 75 ? 'bg-rose-500' : rate < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMetrics.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                      No matching students located in this course registry
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sessions Audit Logs */}
        <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm">
          <h3 className="text-xs font-black text-stone-750 uppercase tracking-wider mb-4 block font-mono">
            Historical Sessions Logs
          </h3>
          {course.sessions.length > 0 ? (
            <div className="space-y-3">
              {course.sessions.map((session) => {
                const totalStudentsCount = course.students.length;
                const pCount = Object.values(session.records).filter((s) => s === 'Present').length;
                const aCount = Object.values(session.records).filter((s) => s === 'Absent').length;
                const lCount = Object.values(session.records).filter((s) => s === 'Late').length;
                const eCount = Object.values(session.records).filter((s) => s === 'Excused').length;

                return (
                  <div
                    key={session.id}
                    className="p-4 border-2 border-stone-150 bg-white/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <span className="text-xs font-black font-mono text-stone-800">{session.date}</span>
                      <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Status: Verified & Live Marked</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-black font-mono">
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        {pCount} Present
                      </span>
                      <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                        {aCount} Absent
                      </span>
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        {lCount} Late
                      </span>
                      {eCount > 0 && (
                        <span className="text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100">
                          {eCount} Excused
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400 text-xs font-medium">
              No sessions active or registered for attendance tracing yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

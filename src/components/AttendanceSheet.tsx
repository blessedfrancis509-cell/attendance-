import React, { useState, useEffect } from 'react';
import { Course, Student, AttendanceStatus } from '../types';
import { ArrowLeft, Save, Search, Calendar, CheckSquare, XSquare, AlertCircle, RefreshCw } from 'lucide-react';

interface AttendanceSheetProps {
  course: Course;
  onSave: (courseId: string, date: string, records: Record<string, AttendanceStatus>) => void;
  onCancel: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  course,
  onSave,
  onCancel,
}) => {
  // Default to today's date (local format YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load existing records if any for the chosen date
  useEffect(() => {
    const existingSession = course.sessions.find((s) => s.date === selectedDate);
    if (existingSession) {
      setAttendance(existingSession.records);
    } else {
      // Default everyone to 'Present' or unanswered, let's default to unanswered/Present for easier flow
      const defaultRecords: Record<string, AttendanceStatus> = {};
      course.students.forEach((student) => {
        defaultRecords[student.id] = 'Present';
      });
      setAttendance(defaultRecords);
    }
    setFeedback(null);
  }, [selectedDate, course]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const newRecords: Record<string, AttendanceStatus> = { ...attendance };
    filteredStudents.forEach((student) => {
      newRecords[student.id] = status;
    });
    setAttendance(newRecords);
    setFeedback(`Marked filtered list as: ${status}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = () => {
    onSave(course.id, selectedDate, attendance);
    setFeedback('Success! Daily attendance saved securely.');
    setTimeout(() => {
      setFeedback(null);
      onCancel();
    }, 1500);
  };

  // Filter students based on search string
  const filteredStudents = course.students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keep a running sum of statuses for active overview
  const statsSummary = {
    present: Object.values(attendance).filter((s) => s === 'Present').length,
    absent: Object.values(attendance).filter((s) => s === 'Absent').length,
    late: Object.values(attendance).filter((s) => s === 'Late').length,
    excused: Object.values(attendance).filter((s) => s === 'Excused').length,
  };

  return (
    <div className="bg-white min-h-screen pb-12">
      {/* Upper Navigation Rail */}
      <header className="sticky top-0 bg-white border-b-2 border-stone-200 z-20 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2.5 -ml-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-yellow-950 leading-tight">Daily Lecture Check-in Roster</h1>
              <p className="text-xs text-yellow-700 font-mono font-bold mt-0.5">{course.code} • {course.name}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-900 hover:bg-yellow-800 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 animate-bounce" /> Save Records
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Date Selector and Search Bar Card */}
        <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Lecture Day Calendar</label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden focus:border-yellow-400 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Live Roster Search</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden focus:border-yellow-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3.5 block font-mono">Live Marks Distribution</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-100">
              <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest font-mono">Present</span>
              <span className="text-xl font-black font-mono block mt-0.5">{statsSummary.present}</span>
            </div>
            <div className="bg-rose-50 text-rose-700 p-3 rounded-2xl border border-rose-150">
              <span className="block text-[8px] font-black text-rose-500 uppercase tracking-widest font-mono">Absent</span>
              <span className="text-xl font-black font-mono block mt-0.5">{statsSummary.absent}</span>
            </div>
            <div className="bg-amber-50 text-amber-700 p-3 rounded-2xl border border-amber-100">
              <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest font-mono">Late</span>
              <span className="text-xl font-black font-mono block mt-0.5">{statsSummary.late}</span>
            </div>
            <div className="bg-sky-50 text-sky-700 p-3 rounded-2xl border border-sky-100">
              <span className="block text-[8px] font-black text-sky-600 uppercase tracking-widest font-mono">Excused</span>
              <span className="text-xl font-black font-mono block mt-0.5">{statsSummary.excused}</span>
            </div>
          </div>
        </div>

        {/* Feedback alert toast */}
        {feedback && (
          <div className="p-3.5 bg-yellow-950 text-white text-xs font-bold rounded-2xl shadow-md text-center animate-fade-in flex items-center justify-center gap-2 border border-yellow-900">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            {feedback}
          </div>
        )}

        {/* Quick Bulk Marking Board */}
        <div className="bg-stone-100 p-4 rounded-3xl border border-stone-200/60 flex flex-wrap gap-2.5 justify-between items-center">
          <span className="text-xs font-black text-stone-600 font-mono uppercase tracking-wider">Bulk mark visible:</span>
          <div className="flex gap-2.5">
            <button
              onClick={() => handleBulkMark('Present')}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-stone-250 cursor-pointer transition-all active:scale-95"
            >
              All Present
            </button>
            <button
              onClick={() => handleBulkMark('Absent')}
              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-stone-250 cursor-pointer transition-all active:scale-95"
            >
              All Absent
            </button>
            <button
              onClick={() => handleBulkMark('Late')}
              className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-600 text-xs font-bold rounded-xl border border-stone-250 cursor-pointer transition-all active:scale-95"
            >
              All Late
            </button>
          </div>
        </div>

        {/* Student Roster Card Grid */}
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-white border-b border-stone-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">
              Student List ({filteredStudents.length} of {course.students.length})
            </h3>
            {filteredStudents.length === 0 && (
              <span className="text-xs text-rose-500 font-bold">No students registered or found</span>
            )}
          </div>

          <div className="divide-y divide-stone-100">
            {filteredStudents.map((student, idx) => {
              const currentStatus = attendance[student.id] || 'Present';
              return (
                <div
                  key={student.id}
                  className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-yellow-950 flex items-center justify-center font-black text-sm ring-4 ring-stone-100/60">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-800">{student.name}</h4>
                      <p className="text-[10px] text-stone-400 font-mono font-medium">{student.rollNo} • {student.email}</p>
                    </div>
                  </div>

                  {/* High Quality attendance toggles */}
                  <div className="grid grid-cols-4 bg-stone-100 p-1 rounded-2xl w-full sm:w-auto max-w-sm gap-1 self-end sm:self-center border border-stone-200/50">
                    {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceStatus[]).map((status) => {
                      const isActive = currentStatus === status;

                      let activeColor = 'bg-stone-200 text-stone-700';
                      if (isActive) {
                        if (status === 'Present') activeColor = 'bg-emerald-600 text-white shadow-xs';
                        if (status === 'Absent') activeColor = 'bg-rose-600 text-white shadow-xs';
                        if (status === 'Late') activeColor = 'bg-amber-500 text-white shadow-xs';
                        if (status === 'Excused') activeColor = 'bg-yellow-900 text-white shadow-xs';
                      }

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`button-touch-highlight px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? activeColor
                              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button also at the bottom for easy smartphone thumb reach */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto button-touch-highlight flex items-center justify-center gap-2 px-8 py-3.5 bg-yellow-900 hover:bg-yellow-800 text-white rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all"
          >
            <Save className="w-5 h-5" /> Save Verification Sheet
          </button>
        </div>
      </main>
    </div>
  );
};

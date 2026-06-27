import React, { useState, useEffect } from 'react';
import { Course, Student, AttendanceStatus, LiveSession, LiveClaim } from '../types';
import { 
  Search, 
  Calendar, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  Filter, 
  FileSpreadsheet, 
  GraduationCap, 
  Award,
  AlertCircle,
  Zap,
  Timer,
  Play,
  Square,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface AttendanceTakersProps {
  courses: Course[];
  liveSessions: LiveSession[];
  onGenerateLiveSession: (courseId: string, maxCapacity: number) => LiveSession | null;
  onStopLiveSession: (sessionId: string) => void;
}

export const AttendanceTakers: React.FC<AttendanceTakersProps> = ({ 
  courses,
  liveSessions,
  onGenerateLiveSession,
  onStopLiveSession
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Local session state for form creation
  const [genCourseId, setGenCourseId] = useState<string>('');
  const [genCapacity, setGenCapacity] = useState<number>(50);
  const [customCapacity, setCustomCapacity] = useState<string>('');
  
  // Filters state for course directory database below
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Keep a local tick trigger to update countdown UI state every 1 second
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const handle = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(handle);
  }, []);

  // Formats active time left
  const formatTimeLeft = (expiresAt: number): string => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Session Terminated/Expired';
    const totalSecs = Math.floor(diff / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} remaining`;
  };

  // Collect unique session dates available across all courses to allow filtering
  const allSessionDates: string[] = Array.from(
    new Set<string>(
      courses.flatMap((c) => c.sessions.map((s) => s.date))
    )
  ).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

  // Ensure today is always in the options
  if (!allSessionDates.includes(todayStr)) {
    allSessionDates.unshift(todayStr);
  }

  // Generate list of regular attendance takers matching criteria
  interface AttendanceTakerItem {
    student: Student;
    course: Course;
    status: AttendanceStatus;
    date: string;
    points: number;
  }

  const attendanceTakerData: AttendanceTakerItem[] = [];

  courses.forEach((course) => {
    if (selectedCourseId !== 'all' && course.id !== selectedCourseId) return;

    course.sessions.forEach((session) => {
      if (selectedDate !== 'all' && session.date !== selectedDate) return;

      course.students.forEach((student) => {
        const status = session.records[student.id];
        if (status && status !== 'Absent') {
          if (statusFilter !== 'all' && status !== statusFilter) return;

          // Compute local points for this student strictly inside this exact course
          let studentCoursePoints = 0;
          course.sessions.forEach(s => {
            const st = s.records[student.id];
            if (st === 'Present' || st === 'Late') {
              studentCoursePoints++;
            }
          });

          attendanceTakerData.push({
            student,
            course,
            status,
            date: session.date,
            points: studentCoursePoints
          });
        }
      });
    });
  });

  // Apply search query filter (searches name or matric/rollNo)
  const filteredTakerItems = attendanceTakerData.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.student.name.toLowerCase().includes(q) ||
      item.student.rollNo.toLowerCase().includes(q) ||
      item.course.code.toLowerCase().includes(q)
    );
  });

  // Live total metrics
  const totalPresent = filteredTakerItems.filter(i => i.status === 'Present').length;
  const totalLate = filteredTakerItems.filter(i => i.status === 'Late').length;
  const totalExcused = filteredTakerItems.filter(i => i.status === 'Excused').length;

  // Handle Export to CSV clipboard
  const handleExportCSV = () => {
    if (filteredTakerItems.length === 0) return;

    const headers = ['Matric Number', 'Student Name', 'Course Code', 'Course Name', 'Course Points', 'Check-In Date', 'Attendance Status'];
    const rows = filteredTakerItems.map(item => [
      item.student.rollNo,
      item.student.name,
      item.course.code,
      item.course.name,
      item.points.toString(),
      item.date,
      item.status
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Launch live passcode 3 minute session
  const triggerGenerateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genCourseId) {
      setSyncMessage('Please select a target course for the check-in session!');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }

    const finalCapacity = customCapacity ? Number(customCapacity) : genCapacity;
    if (isNaN(finalCapacity) || finalCapacity <= 0) {
      setSyncMessage('Please enter a valid capacity limit number!');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }

    const sessionObj = onGenerateLiveSession(genCourseId, finalCapacity);
    if (sessionObj) {
      setSyncMessage(`⚡ Success! Live passcode ${sessionObj.code} generated. Ready for students.`);
      setTimeout(() => setSyncMessage(''), 4000);
      setCustomCapacity('');
    }
  };

  // Pre-seed genCourseId with first available course if empty
  useEffect(() => {
    if (courses.length > 0 && !genCourseId) {
      setGenCourseId(courses[0].id);
    }
  }, [courses, genCourseId]);

  return (
    <div className="space-y-6">
      
      {/* SECTION A: Lecturers live 3-minute check-in console */}
      <div className="bg-gradient-to-br from-yellow-950 to-yellow-900 text-white rounded-3xl p-6 shadow-md border-2 border-yellow-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-700/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-yellow-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-yellow-800 rounded-2xl text-amber-400">
              <Zap className="w-5 h-5 animate-bounce" />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-1.5">
                Dynamic 3-Minute Passcode Room
                <span className="px-2 py-0.5 bg-amber-400 text-yellow-950 text-[9px] font-black rounded-md tracking-wider uppercase font-mono">
                  LIVE GEN
                </span>
              </h2>
              <p className="text-[11px] text-yellow-200">
                Setup seats constraints & broadcast a 3-minute access token. Slot arrival sequence numbers (No. 1, No. 2...) are automatically assigned.
              </p>
            </div>
          </div>
          
          <div className="text-[11px] font-mono text-yellow-300 font-bold bg-yellow-950/60 p-2 rounded-xl border border-yellow-800/80">
            Instructor Identity: Verified Host
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 p-3 bg-yellow-950 text-amber-300 border border-amber-400/30 rounded-2xl font-bold text-xs text-center flex items-center justify-center gap-2 animate-scale-up">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            {syncMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Creator form */}
          <form onSubmit={triggerGenerateSession} className="lg:col-span-5 space-y-4 bg-yellow-950/50 p-5 rounded-2xl border border-yellow-800/50 text-xs text-yellow-100">
            <h3 className="font-extrabold text-white flex items-center gap-1.5 border-b border-yellow-900 pb-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              Configure Live Check-In Code
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold block text-yellow-300">1. Target Class Course</label>
              <select
                value={genCourseId}
                onChange={(e) => setGenCourseId(e.target.value)}
                required
                className="w-full bg-yellow-900/80 border border-yellow-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-hidden"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="text-stone-800 font-semibold">
                    {course.code} — {course.name}
                  </option>
                ))}
                {courses.length === 0 && (
                  <option value="">No courses created yet</option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold block text-yellow-300">2. Capacity Limit (Max Takers)</label>
              <div className="flex bg-yellow-900/60 p-1 rounded-xl gap-1">
                {[20, 50, 100].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => {
                      setGenCapacity(num);
                      setCustomCapacity('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold font-mono text-[11px] transition-all cursor-pointer ${
                      genCapacity === num && !customCapacity
                        ? 'bg-amber-400 text-yellow-950 shadow-xs'
                        : 'hover:bg-yellow-800/80 text-yellow-200'
                    }`}
                  >
                    {num} Students
                  </button>
                ))}
              </div>

              {/* Custom capacity overrides */}
              <div className="pt-1 select-none flex items-center gap-2">
                <span className="text-[10px] text-yellow-300 font-bold uppercase">Or Custom Capacity:</span>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={customCapacity}
                  onChange={(e) => setCustomCapacity(e.target.value)}
                  className="w-20 bg-yellow-900/60 border border-yellow-800 text-center py-1 rounded-lg text-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-1 bg-yellow-900/40 p-2.5 rounded-xl border border-yellow-905">
              <span className="font-bold text-yellow-300 flex items-center gap-1 text-[10px] uppercase font-mono">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                Hardcoded Live Lockout:
              </span>
              <p className="text-[10px] text-yellow-200/90 leading-relaxed font-sans mt-0.5">
                Calculated strictly for **3 minutes** (180 seconds) from launch before auto-destructing. This locks out outside latecomers securely.
              </p>
            </div>

            <button
              type="submit"
              disabled={courses.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 text-yellow-950 rounded-xl font-black uppercase text-xs hover:bg-amber-300 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              🎟️ Fire Dynamic Live Code
            </button>
          </form>

          {/* Real-time active tokens & telemetry order tracking */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-1.5 font-mono">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Active Running Sessions ({liveSessions.filter(s => Date.now() < s.expiresAt).length})
            </h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {liveSessions.map((session) => {
                const isExpired = Date.now() > session.expiresAt;
                const timeStr = formatTimeLeft(session.expiresAt);
                const percentFull = Math.min(100, Math.round((session.claims.length / session.maxCapacity) * 100));

                return (
                  <div 
                    key={session.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isExpired 
                        ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-300 opacity-60' 
                        : 'bg-yellow-950/80 border-yellow-700 text-white shadow-sm ring-1 ring-yellow-505'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded-lg border border-yellow-800">
                          {session.courseCode}
                        </span>
                        <h4 className="font-extrabold text-sm mt-1 text-white">{session.courseName}</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-xl font-black font-mono tracking-widest ${isExpired ? 'text-stone-500' : 'text-amber-400'}`}>
                            {session.code}
                          </span>
                          <span className="block text-[8px] text-yellow-300 font-bold uppercase font-mono">Student Access Token</span>
                        </div>
                        
                        <button
                          onClick={() => onStopLiveSession(session.id)}
                          className="p-1 px-2.5 bg-rose-900/80 text-white hover:bg-rose-800 border border-rose-700/60 text-[9px] font-bold rounded-lg uppercase tracking-wider cursor-pointer font-mono"
                        >
                          Stop
                        </button>
                      </div>
                    </div>

                    {/* Timer progress block */}
                    <div className="mt-3.5 bg-yellow-900/60 p-2.5 rounded-xl border border-yellow-950 font-mono text-[11px] grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-yellow-300 uppercase font-black tracking-wider block">Time Watch</span>
                        <span className={`font-black flex items-center gap-1 mt-0.5 ${isExpired ? 'text-rose-400' : 'text-emerald-400 font-mono animate-pulse'}`}>
                          <Timer className="w-3.5 h-3.5" />
                          {timeStr}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-yellow-300 uppercase font-black tracking-wider block">Claim Slots Occupied</span>
                        <span className="font-extrabold text-white">
                          {session.claims.length} / {session.maxCapacity} seats taken
                        </span>
                      </div>
                    </div>

                    {/* Small horizontal progress visual */}
                    <div className="w-full bg-yellow-900 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${percentFull >= 105 ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>

                    {/* Arrival registry order (as requested: "No. 1, No. 3 with matric name and course") */}
                    <div className="mt-3.5 space-y-2">
                      <span className="text-[9px] uppercase font-black text-yellow-300 tracking-wider block font-mono">
                        Sequence Registry Roll ({session.claims.length} entries)
                      </span>

                      {session.claims.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                          {session.claims.map((claim) => (
                            <div 
                              key={claim.seqNo} 
                              className="text-[10px] bg-yellow-950 p-2 rounded-lg border border-yellow-900 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-amber-400 text-yellow-950 rounded-sm font-black font-mono text-[9px]">
                                  No. {claim.seqNo}
                                </span>
                                <div className="leading-tight">
                                  <span className="block font-bold text-white max-w-[100px] truncate">{claim.studentName}</span>
                                  <span className="text-[8px] text-yellow-300 font-mono">{claim.matricNo}</span>
                                </div>
                              </div>
                              <span className="font-mono text-[8px] text-yellow-400">{claim.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-yellow-450 italic py-1 font-mono">No student submissions recorded for this code yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {liveSessions.length === 0 && (
                <div className="text-center py-10 bg-yellow-950/20 border border-yellow-900/40 rounded-2xl text-yellow-400 text-xs font-mono">
                  <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1.5" />
                  No live speed passcode sessions launched today yet.<br />
                  Configure slot capacity on the left to start!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Traditional database lookup and verified board */}
      <hr className="border-stone-200" />

      {/* Header section with description */}
      <div className="bg-white p-6 rounded-3xl border-2 border-stone-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-yellow-950 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-yellow-700" />
              Lecturer Verification Board
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Verify attendance takers instantly from standard directories. Filter by class, session date, or query students directly.
            </p>
          </div>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredTakerItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-900 text-white rounded-xl text-xs font-black hover:bg-yellow-800 disabled:opacity-50 transition-all select-none shadow-sm pb-2.5 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {copied ? 'Copied CSV List!' : 'Export Attendance Report'}
          </button>
        </div>
      </div>

      {/* Stats Bento Grid Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">Total Verify Takers</span>
            <span className="text-md sm:text-lg font-black font-mono text-yellow-955 block mt-0.5">{filteredTakerItems.length} students</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-200 shadow-xs flex items-center gap-4 text-emerald-950">
          <div className="p-3 bg-emerald-100/80 rounded-2xl border border-emerald-200 text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest font-mono">Present Status</span>
            <span className="text-md sm:text-lg font-black font-mono text-emerald-900 block mt-0.5">{totalPresent} verified</span>
          </div>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200 shadow-xs flex items-center gap-4 text-amber-950">
          <div className="p-3 bg-amber-100/80 rounded-2xl border border-amber-200 text-amber-850">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-amber-700 uppercase tracking-widest font-mono">Late Arrival Code</span>
            <span className="text-md sm:text-lg font-black font-mono text-amber-905 block mt-0.5">{totalLate} students</span>
          </div>
        </div>

        <div className="bg-yellow-50/50 p-5 rounded-3xl border border-yellow-150 shadow-xs flex items-center gap-4 text-yellow-950">
          <div className="p-3 bg-yellow-100/80 rounded-2xl border border-yellow-200 text-yellow-800">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-yellow-600 uppercase tracking-widest font-mono">Excused Absences</span>
            <span className="text-md sm:text-lg font-black font-mono text-yellow-900 block mt-0.5">{totalExcused} instances</span>
          </div>
        </div>
      </div>

      {/* Advanced Verification Filter Card */}
      <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Filter 1: Course Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Select Course Space</label>
          <div className="relative">
            <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden focus:border-yellow-400"
            >
              <option value="all">All Class Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter 2: Session Date Code Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Session Date Selector</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden focus:border-yellow-400 font-mono"
            >
              <option value="all">All Available Log Dates</option>
              {allSessionDates.map((date) => (
                <option key={date} value={date}>
                  {date === todayStr ? `${date} (Today)` : date}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter 3: Attendance Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Attendance Status Filter</label>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs font-bold text-stone-705 focus:outline-hidden focus:border-yellow-400"
            >
              <option value="all">Any Status (Present/Late/Excused)</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Excused">Excused Only</option>
            </select>
          </div>
        </div>

        {/* Filter 4: Live Search */}
        <div className="space-y-1.5 font-sans">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block font-mono">Filter Roll Code or Name</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search Name / Matric Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-55 border-2 border-stone-200/80 rounded-xl text-xs text-stone-700 focus:outline-hidden focus:border-yellow-400 font-bold font-mono"
            />
          </div>
        </div>

      </div>

      {/* CSV notification tooltip */}
      {copied && (
        <div className="p-3.5 bg-yellow-950 text-white text-xs font-bold rounded-2xl shadow-md text-center animate-fade-in flex items-center justify-center gap-2 border border-yellow-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          CSV representation of takers list copied to clipboard! Ready to paste into Excel or Sheets.
        </div>
      )}

      {/* Roster database table displaying students who checked in */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
        
        <div className="p-4 bg-white border-b border-stone-200 flex justify-between items-center px-6">
          <h3 className="text-[10px] font-black text-stone-450 uppercase tracking-widest font-mono">
            Verified Attendance Register ({filteredTakerItems.length} Records)
          </h3>
          <span className="text-[11px] font-bold text-stone-400">
            Showing filtered outcomes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-stone-200 text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">
                <th className="py-4 px-6 text-left">Academic Student</th>
                <th className="py-4 px-4 text-left">Matric No.</th>
                <th className="py-4 px-4 text-left">Class Unit</th>
                <th className="py-4 px-4 text-left">Course Points</th>
                <th className="py-4 px-4 text-center">Session Date</th>
                <th className="py-4 px-4 text-center">Verification status</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredTakerItems.map((item, index) => {
                let statusColor = 'text-stone-700 bg-white border-stone-150';
                if (item.status === 'Present') statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                if (item.status === 'Late') statusColor = 'text-amber-700 bg-amber-50 border-amber-100';
                if (item.status === 'Excused') statusColor = 'text-yellow-700 bg-yellow-50 border-yellow-100';

                return (
                  <tr key={`${item.student.id}-${item.course.id}-${item.date}-${index}`} className="hover:bg-white/50 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-105 text-yellow-950 flex items-center justify-center font-black text-xs ring-2 ring-stone-100">
                          {item.student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-stone-800 leading-tight">{item.student.name}</span>
                          <span className="text-[10px] text-stone-400 font-medium font-mono">{item.student.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Matric No / RollNo */}
                    <td className="py-3 px-4 font-bold font-mono text-yellow-900 tracking-wide">
                      {item.student.rollNo}
                    </td>

                    {/* Class Code & Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-800 font-mono text-[11px]">
                        {item.course.code}
                      </div>
                      <div className="text-[10px] text-stone-400 leading-tight">
                        {item.course.name}
                      </div>
                    </td>

                    {/* Course Points */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 w-max shadow-xs">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-black text-[11px] font-mono tracking-wider">{item.points} PTS</span>
                      </div>
                    </td>

                    {/* Session Date */}
                    <td className="py-3 px-4 text-center font-bold text-stone-700 font-mono">
                      {item.date}
                    </td>

                    {/* Verification Roll status */}
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 rounded-xl font-bold font-mono border text-[10px] uppercase tracking-wider ${statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredTakerItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-stone-300" />
                      <p className="text-sm font-semibold">No students discovered in attendance logs matching selected criteria</p>
                      <p className="text-[11px] text-stone-400">Try changing course space selection, checking different dates, or broadening search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

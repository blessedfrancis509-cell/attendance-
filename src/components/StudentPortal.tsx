import React, { useState, useEffect } from 'react';
import { Course, Student, AttendanceStatus, LiveSession } from '../types';
import { 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  CalendarDays, 
  Search, 
  UserPlus, 
  Zap,
  Ticket,
  Clock,
  ChevronRight,
  ShieldCheck,
  Award,
  Calendar,
  Bell,
  User,
  Mail,
  MapPin,
  Megaphone,
  Edit2,
  FileText,
  Layout,
  Info,
  Bookmark,
  Check,
  Save,
  Activity,
  UserCheck2
} from 'lucide-react';

interface StudentPortalProps {
  courses: Course[];
  onCheckIn: (courseId: string, studentId: string, passcode: string) => boolean;
  onRegisterStudent: (newStudent: Omit<Student, 'id'>) => Student;
  allStudents: Student[];
  liveSessions: LiveSession[];
  onClaimLiveSlot: (code: string, matricNo: string, studentName: string) => { 
    success: boolean; 
    msg: string; 
    slotNo?: number; 
    courseName?: string 
  };
  onUpdateStudentProfile?: (updatedStudent: Student) => void;
  loggedInStudent?: Student;
  onLogout?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  courses,
  onCheckIn,
  onRegisterStudent,
  allStudents,
  liveSessions,
  onClaimLiveSlot,
  onUpdateStudentProfile,
  loggedInStudent,
  onLogout,
}) => {
  // Authentication states for standard view
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (loggedInStudent) {
      setActiveStudent(loggedInStudent);
    } else {
      setActiveStudent(null);
    }
  }, [loggedInStudent]);
  const [profileSearch, setProfileSearch] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // New Student registration values
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRoll, setRegRoll] = useState('');

  // Standard static check-in states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<{ status: 'success' | 'err'; msg: string } | null>(null);

  // --- Dynamic Live 3-Minute Passcode Speed Check-In Forms states ---
  const [claimCode, setClaimCode] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimMatric, setClaimMatric] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResponse, setClaimResponse] = useState<{ 
    status: 'success' | 'err'; 
    msg: string; 
    slotNo?: number; 
    courseName?: string 
  } | null>(null);

  // --- Student Portal Custom Tab and Form States ---
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'timetable' | 'announcements' | 'profile'>('attendance');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saveProfileSuccessMsg, setSaveProfileSuccessMsg] = useState('');

  // Initial announcement data setup with starred status
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    instructor?: string;
    title: string;
    content: string;
    date: string;
    type: 'course' | 'university';
    isImportant: boolean;
    isDismissed: boolean;
    isRead: boolean;
  }>>([
    {
      id: 'ann-1',
      courseId: 'course-1',
      courseCode: 'CS-101',
      courseName: 'Introduction to Computer Science',
      instructor: 'Dr. Helen Jenkins',
      title: '💻 Midterm Exam Chapters & Schedule',
      content: 'Hello everyone! Our CS-101 Midterm is next Wednesday. The exam will cover Chapters 1 through 5. Make sure to review Big-O time complexity and Dynamic Space allocations. We will hold a Q&A session this Friday during lecture slot.',
      date: '2026-06-12',
      type: 'course',
      isImportant: true,
      isDismissed: false,
      isRead: false,
    },
    {
      id: 'ann-2',
      courseId: 'course-2',
      courseCode: 'LIT-202',
      courseName: 'Modern English Literature',
      instructor: 'Prof. Jeremiah Obazee',
      title: '📚 Mandatory Syllabus Reading Check',
      content: 'Hello scholars! I have uploaded the updated Modern Poetry syllabus file to the portal index. Please read pages 45 to 80 before Tuesday morning. Be prepared to share your interpretations in our seminar round.',
      date: '2026-06-14',
      type: 'course',
      isImportant: false,
      isDismissed: false,
      isRead: false,
    },
    {
      id: 'ann-3',
      courseId: 'course-3',
      courseCode: 'MATH-150',
      courseName: 'Applied Calculus II',
      instructor: 'Dr. Sarah Kowalski',
      title: '📐 Calculus Homework Prep & Friday Quiz 3',
      content: 'Dear students, Applied Calculus II Quiz 3 is solid for this coming Friday. Topics include integration parameters, area approximation, and application limits. Graphic calculators and a one-sided handwritten formula card are authorized.',
      date: '2026-06-15',
      type: 'course',
      isImportant: true,
      isDismissed: false,
      isRead: false,
    },
    {
      id: 'ann-univ-1',
      title: '📢 Extended Library Operation Hours',
      content: 'Attention students: the Main Campus Central Library will transition to a 24-hour study schedule starting next Monday to support everyone through exam preparations. Free tea and coffee will be available in the foyer from 11:00 PM onwards.',
      date: '2026-06-10',
      type: 'university',
      isImportant: false,
      isDismissed: false,
      isRead: true,
    },
    {
      id: 'ann-univ-2',
      title: '🗓️ Term Registration Deadline Extension',
      content: 'The Office of Academic Registrar has officially extended the Spring term override and course adjustments deadline until June 30th. Please consult your faculty advisors to file any required change documents.',
      date: '2026-06-11',
      type: 'university',
      isImportant: false,
      isDismissed: false,
      isRead: false,
    }
  ]);

  const matchedStudents = allStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(profileSearch.toLowerCase())
  );

  // If student logs in, automatically fill out current name and matric code in the speed form for rapid entry!
  useEffect(() => {
    if (activeStudent) {
      setClaimName(activeStudent.name);
      setClaimMatric(activeStudent.rollNo);
      setEditName(activeStudent.name);
      setEditEmail(activeStudent.email);
      setEditRollNo(activeStudent.rollNo);
      setIsEditingProfile(false);
      setSaveProfileSuccessMsg('');
    }
  }, [activeStudent]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regRoll.trim()) return;

    const registered = onRegisterStudent({
      name: regName,
      email: regEmail,
      rollNo: regRoll,
    });

    setActiveStudent(registered);
    setRegName('');
    setRegEmail('');
    setRegRoll('');
    setShowRegisterForm(false);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !selectedCourseId || !checkInCode) return;

    const success = onCheckIn(selectedCourseId, activeStudent.id, checkInCode);
    if (success) {
      setCheckInFeedback({
        status: 'success',
        msg: 'Successfully registered attendance! Today you are marked PRESENT.',
      });
      setCheckInCode('');
    } else {
      setCheckInFeedback({
        status: 'err',
        msg: 'Invalid verification passcode. Please check with your instructor.',
      });
    }

    setTimeout(() => {
      setCheckInFeedback(null);
    }, 4000);
  };

  // Handle Dynamic 3-Minute Claim (the requested core feature!)
  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim() || !claimName.trim() || !claimMatric.trim()) {
      setClaimResponse({ status: 'err', msg: 'Please fill out all fields.' });
      return;
    }

    setClaimLoading(true);

    // Run claim check in App controller
    const result = onClaimLiveSlot(claimCode, claimMatric, claimName);
    
    setTimeout(() => {
      setClaimLoading(false);
      if (result.success) {
        setClaimResponse({
          status: 'success',
          msg: result.msg,
          slotNo: result.slotNo,
          courseName: result.courseName
        });
        // Clear code after successful registration so they are ready for future sessions
        setClaimCode('');
      } else {
        setClaimResponse({
          status: 'err',
          msg: result.msg
        });
      }
    }, 600);
  };

  // Find active live session on screen
  const matchedActiveSession = liveSessions.find(
    (s) => s.code.trim() === claimCode.trim() && Date.now() < s.expiresAt
  );

  // Compute student-specific course enrollments
  const studentEnrollments = activeStudent
    ? courses.filter((course) => course.students.some((s) => s.id === activeStudent.id))
    : [];

  const calculateStudentCourseStats = (course: Course) => {
    if (!activeStudent) return { rate: 0, present: 0, absent: 0, late: 0, excused: 0, total: 0 };

    let total = course.sessions.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    course.sessions.forEach((session) => {
      const record = session.records[activeStudent.id];
      if (record === 'Present') present++;
      else if (record === 'Absent') absent++;
      else if (record === 'Late') late++;
      else if (record === 'Excused') excused++;
    });

    const attendedCount = present + late + excused;
    const rate = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

    return { rate, present, absent, late, excused, total };
  };

  const getOverallProgress = () => {
    if (studentEnrollments.length === 0) return 0;
    const totals = studentEnrollments.map((course) => calculateStudentCourseStats(course).rate);
    return Math.round(totals.reduce((acc, r) => acc + r, 0) / totals.length);
  };

  const getTotalPoints = () => {
    let pts = 0;
    studentEnrollments.forEach((course) => {
      const stats = calculateStudentCourseStats(course);
      pts += stats.present + stats.late;
    });
    return pts;
  };

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    if (!editName.trim() || !editRollNo.trim()) {
      alert('Please fill out Name and Matric/ID Roll Code.');
      return;
    }

    const updated: Student = {
      ...activeStudent,
      name: editName.trim(),
      email: editEmail.trim(),
      rollNo: editRollNo.toUpperCase().trim(),
    };

    setActiveStudent(updated);

    if (onUpdateStudentProfile) {
      onUpdateStudentProfile(updated);
    }

    setSaveProfileSuccessMsg('Profile information updated and synced with course databases!');
    setIsEditingProfile(false);
    
    setTimeout(() => {
      setSaveProfileSuccessMsg('');
    }, 4000);
  };

  const handleMarkAsRead = (id: string) => {
    setAnnouncements(announcements.map(ann => ann.id === id ? { ...ann, isRead: true } : ann));
  };

  const handleToggleImportant = (id: string) => {
    setAnnouncements(announcements.map(ann => ann.id === id ? { ...ann, isImportant: !ann.isImportant } : ann));
  };

  const handleDismissAnnouncement = (id: string) => {
    setAnnouncements(announcements.map(ann => ann.id === id ? { ...ann, isDismissed: true } : ann));
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-1">
      
      {/* 1. DYNAMIC CORE ADMISSION BOX: 3-Minute Speed Check-In Taker */}
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-stone-900 bg-gradient-to-br from-stone-950 via-stone-900 to-yellow-950 p-6 text-white shadow-2xl transition-all duration-300">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        {/* Card Header & Decorative Grid Accent */}
        <div className="flex items-start gap-4 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/20 text-amber-300 ring-1 ring-white/10 shadow-inner">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-[#F8FAFC] text-sm tracking-tight sm:text-base">
                Speed Verification Check-In
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-yellow-950 tracking-wider">
                ● Live 3min
              </span>
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Have your attendance passcode ready? Enter it below to secure your dynamic roll slot index.
            </p>
          </div>
        </div>

        {/* Claim ticket receipt on success */}
        {claimResponse && claimResponse.status === 'success' && (
          <div className="mt-4 space-y-4 rounded-xl border border-emerald-500/35 bg-emerald-950/65 p-4 text-left text-xs shadow-xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <span className="font-mono text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Attendance Pass Verified</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1 rounded-xl bg-stone-950/80 p-3 border border-white/5">
              <p className="text-stone-400 font-semibold text-[9px] uppercase tracking-wider font-mono">Academic Class Target:</p>
              <p className="text-sm font-black text-white">{claimResponse.courseName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stone-950/60 p-3 text-center border border-white/5">
                <span className="text-[9px] text-emerald-400 block uppercase font-mono tracking-wider">ROSTER STATUS ORDER</span>
                <span className="text-xl font-mono font-black text-amber-300 block mt-1">
                  #{claimResponse.slotNo}
                </span>
              </div>
              
              <div className="rounded-xl bg-stone-950/60 p-3 text-center flex flex-col justify-center border border-white/5">
                <span className={`text-[9px] ${claimResponse.msg.includes('LATE') ? 'text-amber-400' : 'text-emerald-400'} block uppercase font-mono tracking-wider`}>MARK RECORDED</span>
                <span className={`text-xs font-black font-mono ${claimResponse.msg.includes('LATE') ? 'text-amber-300' : 'text-emerald-350'} block mt-1`}>
                  ● {claimResponse.msg.includes('LATE') ? 'LATE' : 'PRESENT'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-white/5 pt-3">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <p className="text-[10px] text-stone-300">
                Receipt recorded under student: <span className="text-white font-mono font-bold">{claimMatric}</span> on the lecturer's grid.
              </p>
            </div>

            <button
              onClick={() => setClaimResponse(null)}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all duration-200 cursor-pointer text-center font-mono"
            >
              Dismiss / Log Another Check-In
            </button>
          </div>
        )}

        {/* Claim Error box */}
        {claimResponse && claimResponse.status === 'err' && (
          <div className="mt-4 rounded-xl border border-rose-900 bg-rose-950/70 p-4 text-xs font-semibold flex items-center justify-between gap-3 animate-scale-up">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{claimResponse.msg}</span>
            </div>
            <button 
              onClick={() => setClaimResponse(null)} 
              className="text-[10px] uppercase underline text-rose-400 hover:text-rose-350 font-extrabold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Code Input & Speed Form */}
        {(!claimResponse || claimResponse.status !== 'success') && (
          <form onSubmit={handleClaimSubmit} className="mt-4 space-y-4 text-xs">
            
            {/* Input Passcode Panel */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-yellow-300 tracking-wider block font-mono">
                1. Enter 4-Digit Active Passcode
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3.5 top-1/2 -transtone-y-1/2 text-yellow-400 pointer-events-none" />
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 6031"
                  value={claimCode}
                  onChange={(e) => {
                    setClaimCode(e.target.value);
                    if (claimResponse) setClaimResponse(null);
                  }}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/80 border border-stone-800 rounded-2xl text-base text-yellow-300 tracking-widest font-mono font-black focus:outline-hidden focus:border-amber-400 placeholder:tracking-normal placeholder:font-sans placeholder:font-bold text-center transition-colors"
                />
              </div>

              {/* Dynamic Course Room detection */}
              {matchedActiveSession ? (
                <div className="p-2.5 bg-emerald-950/40 border-2 border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between font-medium animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-555"></span>
                    </span>
                    <span>Lecturer Match Found: <span className="font-extrabold text-white">{matchedActiveSession.courseCode} — {matchedActiveSession.courseName}</span></span>
                  </div>
                  <span className="text-[9px] bg-emerald-900 border border-emerald-700/50 text-white rounded-lg px-2 py-0.5 font-mono font-bold">
                    {matchedActiveSession.claims.length}/{matchedActiveSession.maxCapacity} Seats
                  </span>
                </div>
              ) : claimCode.length === 4 ? (
                <div className="p-2.5 bg-rose-950/40 border border-rose-900/40 rounded-xl text-[11px] text-rose-350 font-medium animate-fade-in">
                  ❌ No active session exists with passcode "{claimCode}". Note check with lecturer.
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-yellow-300 tracking-wider block font-mono">
                  2. Full Registered Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Watson"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-white font-bold focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Matric roll / No. */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-yellow-300 tracking-wider block font-mono">
                  3. Matric Roll No
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS26-001"
                  value={claimMatric}
                  onChange={(e) => setClaimMatric(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-white font-mono font-bold uppercase focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={claimLoading}
              className="w-full select-none py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold rounded-2xl tracking-wider uppercase font-sans text-xs shadow-md shadow-amber-400/10 active:scale-[0.99] transition-all cursor-pointer flex justify-center items-center gap-1.5"
            >
              {claimLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                  Logging Dynamic Lockout Seat...
                </span>
              ) : (
                <>
                  <Ticket className="h-4 w-4 shrink-0" />
                  <span>Claim Attendance Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 2. Traditional student Auth profile picker */}
      <div className="bg-stone-200/50 h-[1px] w-full" />

      {!activeStudent ? (
        <div className="bg-white rounded-[2rem] border-2 border-stone-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-yellow-900 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-yellow-950 tracking-tight sm:text-l">Student Class Passport</h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Select your academic profile below to review your courses, view historic records or print timetables.
            </p>
          </div>

          {/* Toggle choice tab buttons */}
          <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-205/65">
            <button
              onClick={() => setShowRegisterForm(false)}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                !showRegisterForm ? 'bg-yellow-900 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Search className="h-4.5 w-4.5" /> Find Workspace
            </button>
            <button
              onClick={() => setShowRegisterForm(true)}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                showRegisterForm ? 'bg-yellow-900 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <UserPlus className="h-4.5 w-4.5" /> Register Profile
            </button>
          </div>

          {/* Registration Form */}
          {showRegisterForm ? (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in text-xs font-semibold text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-stone-450 tracking-wider font-mono">1. Full Legal Name</label>
                <div className="relative">
                  <User className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -transtone-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Watson"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-205 rounded-xl text-xs text-stone-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-450 tracking-wider font-mono">2. Institution Email</label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-stone-400 absolute left-3.5 top-1/2 -transtone-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alice@univ.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-205 rounded-xl text-xs text-stone-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-455 tracking-wider font-mono">3. Matric Roll No / ID</label>
                  <div className="relative">
                    <FileText className="h-3.5 w-3.5 text-stone-400 absolute left-3.5 top-1/2 -transtone-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="CS26-001"
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-55 border border-stone-205 rounded-xl text-xs font-mono font-black text-stone-800 uppercase focus:outline-hidden focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-yellow-900 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer mt-2"
              >
                Create Credentials & Access Portal
              </button>
            </form>
          ) : (
            // Search / Select existing student profile
            <div className="space-y-4 text-left">
              <div className="relative">
                <Search className="h-4.5 w-4.5 absolute left-3.5 top-1/2 -transtone-y-1/2 text-stone-455 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search profile by name, email, or Roll ID..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-500 placeholder:text-stone-400 transition-all"
                />
              </div>

              {/* Roster list */}
              <div className="max-h-60 overflow-y-auto border-2 border-stone-100 rounded-2xl divide-y divide-stone-100 bg-white/20">
                {matchedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStudent(s)}
                    className="w-full text-left p-3.5 hover:bg-yellow-50/50 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-stone-800 group-hover:text-yellow-955 transition-colors">{s.name}</span>
                      <span className="block text-[10px] text-stone-450 font-mono font-medium">{s.rollNo} • {s.email}</span>
                    </div>
                    <span className="text-[10px] font-black text-stone-800 bg-white hover:bg-stone-950 hover:text-white border-2 border-stone-200 px-3 py-1.5 rounded-xl transition-all shadow-xs group-hover:border-yellow-200 group-hover:bg-yellow-550 group-hover:text-white font-mono">
                      Access
                    </span>
                  </button>
                ))}
                {matchedStudents.length === 0 && (
                  <div className="text-center py-8 text-stone-455 text-xs font-medium">
                    No active student profile matches "{profileSearch}".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // logged in student Dashboard
        <div className="space-y-6 pb-28">
          {/* Welcome User Banner */}
          <div className="bg-white p-5 rounded-[2rem] border-2 border-stone-200/90 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-yellow-550 text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0 bg-radial from-yellow-500 to-yellow-855 ring-2 ring-yellow-100">
                {activeStudent.name ? activeStudent.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : "ST"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-bold tracking-wider rounded-md font-mono uppercase">
                    ONLINE
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-bold tracking-wider rounded-md font-mono uppercase flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" />
                    {getTotalPoints()} PTS
                  </span>
                  <span className="text-[11px] font-bold text-stone-400 font-mono">
                    {activeStudent.rollNo}
                    {activeStudent.rollNo.toUpperCase().includes('ICT') && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md font-sans text-[8px] font-extrabold uppercase">Computer Science Dept</span>
                    )}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-stone-900 mt-0.5">Welcome, {activeStudent.name}!</h2>
                <span className="text-[10px] text-stone-400 font-mono font-bold block">{activeStudent.email}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveStudent(null);
                setCheckInFeedback(null);
                if (onLogout) {
                  onLogout();
                }
              }}
              className="text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl border border-rose-100 hover:border-rose-250 transition-all cursor-pointer inline-flex items-center gap-1.5 w-fit font-mono"
            >
              Sign Out Account
            </button>
          </div>

          {/* Semester Dashboard Additions */}
          <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm">
            <h3 className="font-extrabold text-sm text-stone-800 mb-3 border-b border-stone-100 pb-2 text-left">Semester Courses</h3>
            {studentEnrollments.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                 {studentEnrollments.map(course => (
                   <div key={course.id} className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-xl hover:bg-white transition-colors">
                      <span className="text-[10px] uppercase font-bold text-yellow-500 font-mono tracking-wider block">{course.code}</span>
                      <h4 className="text-[13px] font-black text-yellow-950 mt-0.5 leading-tight">{course.name}</h4>
                      <p className="text-[10px] text-stone-500 font-bold mt-1 bg-white inline-block px-1.5 py-0.5 rounded-md border border-stone-100">{course.schedule.days.join(', ')} • {course.schedule.time}</p>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-xs text-stone-400 text-left font-medium">You are not enrolled in any courses yet for this term.</p>
            )}
          </div>

          {/* 1. ATTENDANCE CENTER VIEW */}
          {activeSubTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Quick Average Progress Dial */}
              <div className="bg-yellow-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-yellow-200 tracking-wider uppercase">Your Attendance Progress</p>
                    <h3 className="text-lg font-black mt-1 text-stone-100 leading-tight">Average Class Attendance</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-mono text-emerald-400">{getOverallProgress()}%</span>
                    <p className="text-[9px] text-yellow-200 font-medium font-mono">Target limit: 75%</p>
                  </div>
                </div>

                {/* Slider visual scale */}
                <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      getOverallProgress() < 75 ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>
              </div>

              {/* classroom static check in box */}
              <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-yellow-50 rounded-2xl">
                    <KeyRound className="w-5 h-5 text-yellow-700" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-stone-850">Classroom Code Check-In</h3>
                    <p className="text-[11px] text-stone-400">Mark yourself present instantly by inputting your lecture passcode below.</p>
                  </div>
                </div>

                <form onSubmit={handleCheckInSubmit} className="space-y-3.5 block">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Select Class</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-705 font-bold focus:outline-hidden focus:border-stone-500"
                      >
                        <option value="">-- Choose Course --</option>
                        {studentEnrollments.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">4-Digit Passcode</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 4829"
                        value={checkInCode}
                        onChange={(e) => setCheckInCode(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-750 tracking-widest font-bold placeholder:tracking-normal font-mono text-center focus:outline-hidden focus:border-stone-500"
                      />
                    </div>
                  </div>

                  {checkInFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-scale-up ${
                        checkInFeedback.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : 'bg-rose-50 text-rose-800 border border-rose-100'
                      }`}
                    >
                      {checkInFeedback.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{checkInFeedback.msg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full button-touch-highlight py-2.5 bg-yellow-900 hover:bg-yellow-850 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    Log Attendance Check-In
                  </button>
                </form>
              </div>

              {/* Stats breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black text-stone-450 uppercase tracking-widest font-mono">
                    My Course Metrics Breakdown
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-stone-400">Target score: 75%</span>
                </div>

                {studentEnrollments.length > 0 ? (
                  <div className="space-y-4">
                    {studentEnrollments.map((course) => {
                      const stats = calculateStudentCourseStats(course);
                      return (
                        <div
                          key={course.id}
                          className="bg-white p-5 rounded-[2rem] border-2 border-stone-205 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-yellow-200 transition-all font-sans"
                        >
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-bold font-mono text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100 uppercase">
                              {course.code}
                            </span>
                            <h4 className="font-extrabold text-stone-900 text-sm mt-1">{course.name}</h4>
                            <span className="text-xs text-stone-400 font-semibold block">Instructor: {course.instructor}</span>
                          </div>

                          {/* Score metrics */}
                          <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                            <div className="flex gap-2 text-center text-[10px] font-mono">
                              <div className="border-2 border-stone-100 p-2 rounded-xl min-w-[38px] bg-white/50">
                                <span className="text-stone-400 block font-bold text-[8px] uppercase font-mono">Pres</span>
                                <span className="font-black text-stone-800 text-xs">{stats.present}</span>
                              </div>
                              <div className="border-2 border-stone-100 p-2 rounded-xl min-w-[38px] bg-white/50">
                                <span className="text-stone-400 block font-bold text-[8px] uppercase font-mono">Late</span>
                                <span className="font-black text-stone-800 text-xs">{stats.late}</span>
                              </div>
                              <div className="border-2 border-stone-100 p-2 rounded-xl min-w-[38px] bg-white/50">
                                <span className="text-stone-450 block font-bold text-[8px] uppercase font-mono text-xs">Abse</span>
                                <span className="font-black text-rose-600 text-xs">{stats.absent}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`px-3 py-2 rounded-xl text-xs font-black font-mono inline-block border-2 ${
                                  stats.rate >= 85
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                                    : stats.rate >= 75
                                    ? 'bg-amber-50 text-amber-850 border-amber-150'
                                    : 'bg-rose-50 text-rose-800 border-rose-150'
                                }`}
                              >
                                {stats.rate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2rem] border-2 border-stone-200 text-center text-xs text-stone-400 font-medium font-sans">
                    No registered courses detected. Select or sign-up below to proceed.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. PERSONAL WEEKLY TIMETABLE VIEW */}
          {activeSubTab === 'timetable' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="bg-white p-5 rounded-[2rem] border-2 border-stone-205 shadow-xl space-y-1.5">
                <h3 className="text-sm font-black text-yellow-950 flex items-center gap-2">
                  <span className="p-2 bg-yellow-50 rounded-xl text-yellow-750">
                    <Calendar className="w-4 h-4" />
                  </span>
                  My Weekly Lecture Schedule
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Custom timeline of active lectures generated from your active course enlisting.
                </p>
              </div>

              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayClasses = studentEnrollments.filter(course => course.schedule?.days?.includes(day));

                  return (
                    <div key={day} className="bg-white border-2 border-stone-205 rounded-[2rem] overflow-hidden shadow-md">
                      {/* Day Header Banner */}
                      <div className="px-5 py-4 bg-white/50 border-b border-stone-150 flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-black text-stone-900">{day}</span>
                        <span className="text-[9px] font-mono uppercase bg-stone-950/5 border border-stone-200 text-stone-650 px-2.5 py-1 rounded-xl font-bold">
                          {dayClasses.length} {dayClasses.length === 1 ? 'Lecture' : 'Lectures'}
                        </span>
                      </div>

                      {/* Sessions detail list */}
                      <div className="p-5 divide-y divide-stone-150/50">
                        {dayClasses.map((course) => (
                          <div key={course.id} className="py-3.5 first:pt-0 last:pb-0 font-sans space-y-2.5">
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold font-mono text-yellow-750 bg-yellow-50 border border-yellow-100/50 px-2 py-0.5 rounded-md">
                                    {course.code}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-mono font-bold leading-none">
                                    by {course.instructor}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-stone-900 text-sm">{course.name}</h4>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-stone-500 font-medium">
                              <div className="flex items-center gap-1 text-yellow-750 font-mono font-black">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{course.schedule?.time || "Time unposted"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-stone-550 font-black">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                <span>{course.schedule?.room || "Room unposted"}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {dayClasses.length === 0 && (
                          <div className="py-3 text-center text-stone-400 text-xs font-semibold italic">
                            No scheduled lectures on this weekday.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. CAMPUS ANNOUNCEMENTS feed VIEW */}
          {activeSubTab === 'announcements' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="bg-white p-5 rounded-[2rem] border-2 border-stone-205 shadow-xl flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-yellow-950 flex items-center gap-2">
                    <span className="p-2 bg-yellow-50 rounded-xl text-yellow-750">
                      <Megaphone className="w-4 h-4" />
                    </span>
                    Campus Bulletins & Announcements
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-1">
                    Updates from your class instructors and campus administrators.
                  </p>
                </div>
                {announcements.filter(ann => !ann.isRead && !ann.isDismissed && (ann.type === 'university' || studentEnrollments.some(c => c.code === ann.courseCode))).length > 0 && (
                  <span className="text-[9px] font-mono tracking-wider font-extrabold bg-rose-500 text-white px-2.5 py-1 rounded-xl shadow-xs shrink-0">
                    {announcements.filter(ann => !ann.isRead && !ann.isDismissed && (ann.type === 'university' || studentEnrollments.some(c => c.code === ann.courseCode))).length} NEW
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {announcements
                  .filter(ann => {
                    if (ann.isDismissed) return false;
                    if (ann.type === 'course') {
                      return studentEnrollments.some(c => c.code === ann.courseCode);
                    }
                    return true;
                  })
                  .map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => handleMarkAsRead(ann.id)}
                      className={`bg-white p-5 rounded-[2rem] border-2 transition-all relative group cursor-pointer ${
                        ann.isImportant 
                          ? 'border-amber-400 bg-amber-50/20 shadow-md shadow-amber-100/50' 
                          : !ann.isRead 
                          ? 'border-yellow-400/70 shadow-xs' 
                          : 'border-stone-205 hover:border-stone-350 shadow-sm'
                      }`}
                    >
                      {/* Subtitles context */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-wrap items-center gap-1.5 text-left">
                          {ann.type === 'course' ? (
                            <span className="text-[9px] font-black font-mono text-yellow-750 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                              {ann.courseCode} Lecture Update
                            </span>
                          ) : (
                            <span className="text-[9px] font-black font-mono text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              CAMPUS ADVISORY
                            </span>
                          )}

                          {ann.isImportant && (
                            <span className="text-[8px] font-mono font-black tracking-widest bg-amber-400 text-yellow-950 px-1.5 py-0.5 rounded">
                              URGENT
                            </span>
                          )}

                          {!ann.isRead && (
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          )}
                        </div>

                        {/* Actions widgets */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleImportant(ann.id);
                            }}
                            title={ann.isImportant ? "Unstar" : "Star as Important"}
                            className={`p-1.5 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer ${
                              ann.isImportant ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissAnnouncement(ann.id);
                            }}
                            title="Dismiss Bulletin"
                            className="p-1.5 hover:bg-rose-50 text-stone-300 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Title & content */}
                      <h4 className="font-extrabold text-stone-900 text-sm mt-3 flex items-center gap-1.5 text-left">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium leading-relaxed mt-2 whitespace-pre-line text-left">
                        {ann.content}
                      </p>

                      {/* Date & Author */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-[10px] font-mono text-stone-400">
                        <span>Posted on {ann.date}</span>
                        {ann.instructor && (
                          <span className="font-bold text-stone-500">Instructor: {ann.instructor}</span>
                        )}
                      </div>
                    </div>
                  ))}

                {announcements.filter(ann => {
                  if (ann.isDismissed) return false;
                  if (ann.type === 'course') {
                    return studentEnrollments.some(c => c.code === ann.courseCode);
                  }
                  return true;
                }).length === 0 && (
                  <div className="bg-white p-8 rounded-[2rem] border-2 border-stone-205 text-center text-xs text-stone-450 font-medium font-sans">
                    No publications in your mailbox. General advisories and lectures announcements are empty.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. STUDENT PASSPORT & OPERATIONS VIEW */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Student Academic Passport Card */}
              <div className="bg-gradient-to-br from-yellow-950 via-yellow-900 to-stone-900 border-2 border-stone-950 p-6 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-yellow-800 pb-5 text-center sm:text-left">
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-300 text-yellow-950 rounded-2xl flex items-center justify-center text-2xl font-black font-sans shadow-inner shrink-0 leading-none">
                    {activeStudent.name ? activeStudent.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : "ST"}
                  </div>

                  <div className="space-y-1">
                    <span className="px-2.5 py-1 bg-amber-400 text-yellow-950 text-[9px] font-mono font-black tracking-widest rounded-lg uppercase inline-block">
                      Academic Passport
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">{activeStudent.name}</h3>
                    <p className="text-xs text-yellow-200 font-mono font-bold">{activeStudent.rollNo} • {activeStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5 pt-1 text-xs text-left">
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-yellow-300 font-bold block text-[8px] uppercase tracking-wider font-mono">Academic Enrollment</span>
                    <span className="font-extrabold text-white text-[11px] sm:text-xs block font-mono">
                      {studentEnrollments.length} {studentEnrollments.length === 1 ? 'Class Active' : 'Classes Active'}
                    </span>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-yellow-300 font-bold block text-[8px] uppercase tracking-wider font-mono">Status Rank</span>
                    <span className={`font-mono font-black text-[11px] sm:text-xs block ${getOverallProgress() >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {getOverallProgress() >= 75 ? 'Standing Good' : 'Alert Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Panel: Edit Profiles */}
              {saveProfileSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-2xl text-xs font-bold leading-relaxed animate-scale-up">
                  ✓ {saveProfileSuccessMsg}
                </div>
              )}

              {isEditingProfile ? (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-stone-205 shadow-xl space-y-4 animate-scale-up text-left">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-black text-sm text-yellow-950">Update Registration Credentials</h4>
                    <p className="text-[11px] text-stone-450 mt-0.5">Modifications sync with active class attendance databases, lists and tables.</p>
                  </div>

                  <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-stone-450 tracking-wider font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-205 rounded-xl text-xs text-stone-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-505"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-stone-455 tracking-wider font-mono">Email</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-stone-205 rounded-xl text-xs text-stone-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-505"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-stone-455 tracking-wider font-mono">Matric/ID Roll No</label>
                        <input
                          type="text"
                          required
                          value={editRollNo}
                          onChange={(e) => setEditRollNo(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-stone-205 rounded-xl text-xs font-mono uppercase text-stone-850 font-bold focus:outline-hidden focus:ring-1 focus:ring-yellow-505"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3.5 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditName(activeStudent.name);
                          setEditEmail(activeStudent.email);
                          setEditRollNo(activeStudent.rollNo);
                        }}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-650 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-yellow-900 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-stone-205 shadow-xl space-y-4 text-left">
                  <div>
                    <h4 className="font-extrabold text-yellow-950 text-sm">Account Operations & Security</h4>
                    <p className="text-xs text-stone-450 mt-0.5">Edit academic files or manage your student identity badges manually.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-4 h-4 text-yellow-750" /> Modify Profile Registration
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudent(null);
                        setCheckInFeedback(null);
                        if (onLogout) {
                          onLogout();
                        }
                      }}
                      className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      Log Out Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab navigation bar - Persistent Floating Bottom Tab Bar */}
          <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-transtone-x-1/2 md:max-w-2xl md:w-full z-40 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border-2 border-stone-205 shadow-[0_12px_44px_rgba(0,0,0,0.12)] flex justify-around items-center select-none animate-fade-in">
            {/* Attendance tab */}
            <button
              id="student-tab-attendance"
              onClick={() => setActiveSubTab('attendance')}
              className="flex-1 py-1 text-center text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${activeSubTab === 'attendance' ? 'bg-yellow-100/80 text-yellow-950 scale-105 shadow-sm' : 'text-stone-400 hover:text-stone-650'}`}>
                <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className={`mt-0.5 transition-all truncate block w-full text-center ${activeSubTab === 'attendance' ? 'text-yellow-950 font-extrabold' : 'text-stone-500 font-semibold'}`}>Attendance</span>
            </button>

            {/* Timetable tab */}
            <button
              id="student-tab-timetable"
              onClick={() => setActiveSubTab('timetable')}
              className="flex-1 py-1 text-center text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${activeSubTab === 'timetable' ? 'bg-yellow-100/80 text-yellow-950 scale-105 shadow-sm' : 'text-stone-400 hover:text-stone-650'}`}>
                <Calendar className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className={`mt-0.5 transition-all truncate block w-full text-center ${activeSubTab === 'timetable' ? 'text-yellow-950 font-extrabold' : 'text-stone-500 font-semibold'}`}>Timetable</span>
            </button>

            {/* Announcements tab */}
            <button
              id="student-tab-announcements"
              onClick={() => setActiveSubTab('announcements')}
              className="flex-1 py-1 text-center text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center relative cursor-pointer"
            >
              {announcements.filter(ann => !ann.isRead && !ann.isDismissed && (ann.type === 'university' || studentEnrollments.some(c => c.code === ann.courseCode))).length > 0 && (
                <span className="absolute top-1 right-5 sm:right-10 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse z-10" />
              )}
              <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${activeSubTab === 'announcements' ? 'bg-yellow-100/80 text-yellow-950 scale-105 shadow-sm' : 'text-stone-400 hover:text-stone-650'}`}>
                <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className={`mt-0.5 transition-all truncate block w-full text-center ${activeSubTab === 'announcements' ? 'text-yellow-950 font-extrabold' : 'text-stone-500 font-semibold'}`}>Announcements</span>
            </button>

            {/* Profile tab */}
            <button
              id="student-tab-profile"
              onClick={() => setActiveSubTab('profile')}
              className="flex-1 py-1 text-center text-[10px] sm:text-[11px] transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${activeSubTab === 'profile' ? 'bg-yellow-100/80 text-yellow-950 scale-105 shadow-sm' : 'text-stone-400 hover:text-stone-650'}`}>
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className={`mt-0.5 transition-all truncate block w-full text-center ${activeSubTab === 'profile' ? 'text-yellow-950 font-extrabold' : 'text-stone-500 font-semibold'}`}>Profile Info</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

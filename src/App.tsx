import React, { useState, useEffect } from 'react';
import { Course, Student, AttendanceStatus, LiveSession, LiveClaim, AppUser } from './types';
import { loadCourses, saveCourses } from './data';
import { ClassCard } from './components/ClassCard';
import { AttendanceSheet } from './components/AttendanceSheet';
import { ScheduleView } from './components/ScheduleView';
import { ReportView } from './components/ReportView';
import { StudentPortal } from './components/StudentPortal';
import { AttendanceTakers } from './components/AttendanceTakers';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { AIAssistant } from './components/AIAssistant';
import { BookOpen, Users, GraduationCap, Layout, Clock, PlusCircle, CheckCircle2, BookOpenCheck, ClipboardCheck, Search, X, Sparkles } from 'lucide-react';

export default function App() {
  // Central Data State loaded from localStorage
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Dynamic 3-minute Live Session check-in structures
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(() => {
    const data = localStorage.getItem('live_attendance_sessions');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to restore live sessions', e);
      }
    }
    return [];
  });

  // Keep liveSessions saved
  useEffect(() => {
    localStorage.setItem('live_attendance_sessions', JSON.stringify(liveSessions));
  }, [liveSessions]);

  const handleGenerateLiveSession = (courseId: string, maxCapacity: number): LiveSession | null => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return null;

    // Generate random distinct key (e.g. 1000 to 9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const newSession: LiveSession = {
      id: `live-${Date.now()}`,
      courseId,
      courseCode: course.code,
      courseName: course.name,
      code,
      maxCapacity,
      createdAt: Date.now(),
      expiresAt: Date.now() + 180000, // strictly 3 minutes
      claims: []
    };

    const updated = [newSession, ...liveSessions];
    setLiveSessions(updated);
    return newSession;
  };

  const handleStopLiveSession = (sessionId: string) => {
    const updated = liveSessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          expiresAt: Date.now() - 1 // force expire immediately
        };
      }
      return s;
    });
    setLiveSessions(updated);
  };

  const handleClaimLiveSlot = (code: string, matricNoInput: string, nameInput: string) => {
    const codeClean = code.trim();
    const matricClean = matricNoInput.trim().toUpperCase();
    const nameClean = nameInput.trim();

    const sessionIndex = liveSessions.findIndex((s) => s.code === codeClean);
    if (sessionIndex === -1) {
      return { success: false, msg: 'Invalid live speed-code. Please check with your lecturer!' };
    }

    const session = liveSessions[sessionIndex];
    if (Date.now() > session.expiresAt) {
      return { success: false, msg: 'This Speed-Code session has EXPIRED! (The 3-minute limit is over)' };
    }

    if (session.claims.some((c) => c.matricNo === matricClean)) {
      return { success: false, msg: `Attendance already submitted for Roll/Matric ${matricClean}!` };
    }

    const istone = session.claims.length >= session.maxCapacity;
    const nextSeqNo = session.claims.length + 1;

    const newClaim: LiveClaim = {
      seqNo: nextSeqNo,
      matricNo: matricClean,
      studentName: nameClean,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    const updatedClaims = [...session.claims, newClaim];
    const updatedSessions = liveSessions.map((s) => {
      if (s.id === session.id) {
        return { ...s, claims: updatedClaims };
      }
      return s;
    });

    setLiveSessions(updatedSessions);

    // Save student to course roster & log check-in
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCourses = courses.map((c) => {
      if (c.id === session.courseId) {
        let updatedStudents = [...c.students];
        let student = updatedStudents.find((s) => s.rollNo === matricClean);

        if (!student) {
          student = {
            id: `std-dyn-${Date.now()}`,
            name: nameClean,
            email: `${nameClean.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
            rollNo: matricClean
          };
          updatedStudents.push(student);
        }

        const existingSessionIndex = c.sessions.findIndex((s) => s.date === todayStr);
        let updatedCourseSessions = [...c.sessions];

        if (existingSessionIndex > -1) {
          const curSession = updatedCourseSessions[existingSessionIndex];
          updatedCourseSessions[existingSessionIndex] = {
            ...curSession,
            records: {
              ...curSession.records,
              [student.id]: istone ? 'Late' : 'Present'
            },
            marked: true
          };
        } else {
          const initialRecords: Record<string, AttendanceStatus> = {};
          updatedStudents.forEach((std) => {
            initialRecords[std.id] = std.id === student?.id ? (istone ? 'Late' : 'Present') : 'Present';
          });
          initialRecords[student.id] = istone ? 'Late' : 'Present';

          updatedCourseSessions.push({
            id: todayStr,
            date: todayStr,
            records: initialRecords,
            marked: true
          });
        }

        return {
          ...c,
          students: updatedStudents,
          sessions: updatedCourseSessions
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    saveCourses(updatedCourses);

    return { 
      success: true, 
      msg: istone ? 'Marked LATE due to capacity limit reached!' : 'Slot reserved successfully!', 
      slotNo: nextSeqNo,
      courseName: `${session.courseCode} • ${session.courseName}`
    };
  };
  const [activeTab, setActiveTab] = useState<'courses' | 'schedule' | 'students'>('courses');
  
  // Authenticated state configurations
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const data = localStorage.getItem('class_flow_current_user');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>(() => {
    const data = localStorage.getItem('class_flow_registered_users');
    // Seed initial demo + admin users
    const ADMIN_SEED: AppUser = { id: 'admin-root', name: 'System Administrator', email: 'admin1234@gmail.com', password: 'admin1234', role: 'admin' };

    let initialUsers: AppUser[] = [];
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Ensure the admin account uses the latest credentials regardless of cached version
        initialUsers = [ADMIN_SEED, ...parsed.filter((u: AppUser) => u.id !== 'admin-root')];
        localStorage.setItem('class_flow_registered_users', JSON.stringify(initialUsers));
        return initialUsers;
      } catch (e) {
        console.error('Failed to parse registered users', e);
      }
    }
    
    const defaultUsers: AppUser[] = [
      // ── SYSTEM ADMIN (hidden) ──────────────────────────────────
      ADMIN_SEED,
      // ── Instructors ────────────────────────────────────────────
      { id: 'usr-1', name: 'Dr. Helen Jenkins', email: 'helen@campus.edu', password: 'password', role: 'instructor' },
      { id: 'usr-2', name: 'Prof. Jeremiah Obazee', email: 'jeremiah@campus.edu', password: 'password', role: 'instructor' },
      // ── Students ───────────────────────────────────────────────
      { id: 'usr-3', name: 'Alice Watson', email: 'alice.watson@campus.edu', password: 'password', role: 'student', rollNo: 'CS26-001' },
      { id: 'usr-4', name: 'Benjamin Carter', email: 'ben.carter@campus.edu', password: 'password', role: 'student', rollNo: 'CS26-002' },
      { id: 'usr-5', name: 'Chloe Sterling', email: 'chloe.s@campus.edu', password: 'password', role: 'student', rollNo: 'CS26-003' },
    ];
    localStorage.setItem('class_flow_registered_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  });

  // Sync state helpers to preserve login across refreshes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('class_flow_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('class_flow_current_user');
    }
  }, [currentUser]);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Magic hidden developer combo
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        setShowAdminPanel(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [networkSyncActive, setNetworkSyncActive] = useState(false);

  // Network pull polling (keeps all tabs/devices synced dynamically)
  useEffect(() => {
    const syncBackend = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          // Seed the Railway/container backend with our initial seed data if newly rebooted
          if (!data.courses) {
            fetch('/api/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courses: JSON.parse(localStorage.getItem('class_attendance_courses') || '[]'),
                registeredUsers: JSON.parse(localStorage.getItem('class_flow_registered_users') || '[]'),
                liveSessions: JSON.parse(localStorage.getItem('live_attendance_sessions') || '[]'),
              })
            }).catch(()=>{});
            return;
          }

          setCourses(prev => {
             if (JSON.stringify(prev) !== JSON.stringify(data.courses)) {
                localStorage.setItem('class_attendance_courses', JSON.stringify(data.courses));
                return data.courses;
             }
             return prev;
          });
          setRegisteredUsers(prev => {
             const incoming: AppUser[] = data.registeredUsers;
             const ADMIN_SEED: AppUser = { id: 'admin-root', name: 'System Administrator', email: 'admin1234@gmail.com', password: 'admin1234', role: 'admin' };
             // Overwrite or add admin-root to ensure latest credentials
             const incomingWithoutAdmin = incoming.filter(u => u.id !== 'admin-root');
             const merged = [ADMIN_SEED, ...incomingWithoutAdmin];
             if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                localStorage.setItem('class_flow_registered_users', JSON.stringify(merged));
                return merged;
             }
             return prev;
          });
          setLiveSessions(prev => {
             if (JSON.stringify(prev) !== JSON.stringify(data.liveSessions)) {
                localStorage.setItem('live_attendance_sessions', JSON.stringify(data.liveSessions));
                return data.liveSessions;
             }
             return prev;
          });
          
          setNetworkSyncActive(true);
        }
      } catch (err) {
        setNetworkSyncActive(false);
      }
    };

    syncBackend();
    const interval = setInterval(syncBackend, 2500); // 2.5s real time engine sync ticks
    return () => clearInterval(interval);
  }, []);

  // Network push (broadcast offline local edits to the whole network!)
  useEffect(() => {
     if (courses.length > 0 || registeredUsers.length > 0) {
       localStorage.setItem('class_flow_registered_users', JSON.stringify(registeredUsers));
       fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses, registeredUsers, liveSessions })
       }).catch(()=>{});
     }
  }, [courses, registeredUsers, liveSessions]);

  const handleRegisterUser = (newUser: AppUser) => {
    setRegisteredUsers((prev) => {
      if (prev.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        return prev;
      }
      return [...prev, newUser];
    });
    
    // Auto-enroll registered students to existing course rosters
    if (newUser.role === 'student') {
      const studentObj: Student = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        rollNo: newUser.rollNo || '',
      };
      
      const loadedCoursesList = loadCourses();
      const updated = loadedCoursesList.map((course) => {
        if (!course.students.some((s) => s.rollNo === studentObj.rollNo)) {
          return {
            ...course,
            students: [...course.students, studentObj],
          };
        }
        return course;
      });

      setCourses(updated);
      saveCourses(updated);
    }
  };

  const userRole = currentUser?.role || 'instructor';
  const [livePasscodeCourseId, setLivePasscodeCourseId] = useState<string>('');
  const [liveCapacityLimit, setLiveCapacityLimit] = useState<number>(50);
  const [, setTick] = useState(0);

  // Auto-refresh component every second purely for the live session countdown display visual
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Interactive View details state
  const [activeMarkingCourse, setActiveMarkingCourse] = useState<Course | null>(null);
  const [activeStatsCourse, setActiveStatsCourse] = useState<Course | null>(null);

  // Quick Action form toggles
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Form states for new courses
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');
  const [newCourseRoom, setNewCourseRoom] = useState('');
  const [newCourseDays, setNewCourseDays] = useState<string[]>([]);
  const [newCourseTime, setNewCourseTime] = useState('10:00 AM - 11:30 AM');

  // Form states for new students manually added
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [targetCourseIdForStudent, setTargetCourseIdForStudent] = useState('');

  // Status notification state
  const [systemAlert, setSystemAlert] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Initial load
  useEffect(() => {
    const loaded = loadCourses();
    setCourses(loaded);
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'info' = 'success') => {
    setSystemAlert({ text, type });
    setTimeout(() => setSystemAlert(null), 3000);
  };

  // Instructor action: save updated attendance records back to store
  const handleSaveAttendance = (courseId: string, date: string, records: Record<string, AttendanceStatus>) => {
    const updated = courses.map((course) => {
      if (course.id === courseId) {
        // Check if session for this day already existed
        const existingSessionIndex = course.sessions.findIndex((s) => s.date === date);

        let updatedSessions = [...course.sessions];
        if (existingSessionIndex > -1) {
          // Update existing
          updatedSessions[existingSessionIndex] = {
            ...updatedSessions[existingSessionIndex],
            records,
            marked: true,
          };
        } else {
          // Append new session
          updatedSessions.push({
            id: date,
            date,
            records,
            marked: true,
          });
        }

        // Sort sessions by date chronologically
        updatedSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          ...course,
          sessions: updatedSessions,
        };
      }
      return course;
    });

    setCourses(updated);
    saveCourses(updated);
    triggerAlert('Attendance record filed of today!');
  };

  // Instructor action: Create new class
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode || !newCourseInstructor) return;

    // Generate random passcode (e.g. 1000 - 9999)
    const randomPasscode = Math.floor(1000 + Math.random() * 9000).toString();

    const created: Course = {
      id: `course-${Date.now()}`,
      code: newCourseCode.toUpperCase().trim(),
      passcode: randomPasscode,
      name: newCourseName.trim(),
      instructor: newCourseInstructor.trim(),
      schedule: {
        days: newCourseDays.length > 0 ? newCourseDays : ['Monday', 'Wednesday'],
        time: newCourseTime,
        room: newCourseRoom.trim() || 'Online Lecture Desk',
      },
      students: [],
      sessions: [],
    };

    const updated = [...courses, created];
    setCourses(updated);
    saveCourses(updated);

    // Reset forms
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseInstructor('');
    setNewCourseRoom('');
    setNewCourseDays([]);
    setShowAddCourse(false);

    triggerAlert(`Class course ${created.code} successfully launched! Passcode: ${randomPasscode}`);
  };

  // Instructor action: Manually register and assign student
  const handleAddStudentToCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentRoll || !targetCourseIdForStudent) return;

    const studentObj: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || `${newStudentName.replace(/\s+/g, '.').toLowerCase()}@campus.edu`,
      rollNo: newStudentRoll.toUpperCase().trim(),
    };

    // Update in matched course
    const updated = courses.map((course) => {
      if (course.id === targetCourseIdForStudent) {
        // Prevent adding duplicate student in same course
        if (course.students.some((s) => s.rollNo === studentObj.rollNo)) {
          alert('A student with this Roll code exists already in the course draft!');
          return course;
        }
        return {
          ...course,
          students: [...course.students, studentObj],
        };
      }
      return course;
    });

    setCourses(updated);
    saveCourses(updated);

    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentRoll('');
    setShowAddStudent(false);

    triggerAlert('Student successfully enlisted!');
  };

  // Student Actions: Dynamic Self check-in with Code
  const handleStudentSelfCheckIn = (courseId: string, studentId: string, inputCode: string): boolean => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return false;

    // Check code matches course passcode
    if (course.passcode !== inputCode.trim()) {
      return false;
    }

    // Today YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const existingSessionIndex = c.sessions.findIndex((s) => s.date === todayStr);

        let updatedSessions = [...c.sessions];
        if (existingSessionIndex > -1) {
          // Update student status inside existing session
          const currentSession = updatedSessions[existingSessionIndex];
          updatedSessions[existingSessionIndex] = {
            ...currentSession,
            records: {
              ...currentSession.records,
              [studentId]: 'Present',
            },
          };
        } else {
          // Create new session for today, preset other students to Present or keep empty
          const initialRecords: Record<string, AttendanceStatus> = {};
          c.students.forEach((student) => {
            initialRecords[student.id] = student.id === studentId ? 'Present' : 'Present'; // standard default fallback
          });
          initialRecords[studentId] = 'Present';

          updatedSessions.push({
            id: todayStr,
            date: todayStr,
            records: initialRecords,
            marked: true,
          });
        }

        return {
          ...c,
          sessions: updatedSessions,
        };
      }
      return c;
    });

    setCourses(updated);
    saveCourses(updated);
    triggerAlert('Check-in passcode accepted!');
    return true;
  };

  // Student Actions: Register new student account
  const handleStudentSelfSignUp = (newStudent: Omit<Student, 'id'>): Student => {
    const studentObj: Student = {
      id: `std-${Date.now()}`,
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      rollNo: newStudent.rollNo.toUpperCase().trim(),
    };

    // Keep user table synchronized
    const newUser: AppUser = {
      id: studentObj.id,
      name: studentObj.name,
      email: studentObj.email,
      password: 'password',
      role: 'student',
      rollNo: studentObj.rollNo,
    };
    
    handleRegisterUser(newUser);

    // Auto-enroll new student to ALL existing courses for easier review and testing experience!
    const updated = courses.map((course) => {
      if (!course.students.some((s) => s.rollNo === studentObj.rollNo)) {
        return {
          ...course,
          students: [...course.students, studentObj],
        };
      }
      return course;
    });

    setCourses(updated);
    saveCourses(updated);
    triggerAlert('Student account initialized & auto-enrolled!');
    return studentObj;
  };

  // Synchronizes student profile updates database-wide (Name, Email, Matric No)
  const handleStudentProfileSync = (updatedStudent: Student) => {
    const updated = courses.map((course) => {
      const updatedStudents = course.students.map((s) => {
        if (s.id === updatedStudent.id) {
          return updatedStudent;
        }
        return s;
      });
      return {
        ...course,
        students: updatedStudents,
      };
    });

    setCourses(updated);
    saveCourses(updated);
  };

  // Collect unique students across all courses for the student directory/auth picker
  const getUniqueStudentsList = (): Student[] => {
    const map = new Map<string, Student>();
    courses.forEach((c) => {
      c.students.forEach((s) => {
        map.set(s.id, s);
      });
    });
    return Array.from(map.values());
  };

  const handleDayToggle = (day: string) => {
    if (newCourseDays.includes(day)) {
      setNewCourseDays(newCourseDays.filter((d) => d !== day));
    } else {
      setNewCourseDays([...newCourseDays, day]);
    }
  };

  // If not authenticated, show modern unified Auth landing layout
  if (!currentUser) {
    return (
      <>
        {showAdminPanel && (
          <AdminPanel
            onClose={() => setShowAdminPanel(false)}
            registeredUsers={registeredUsers}
            setRegisteredUsers={setRegisteredUsers}
            courses={courses}
            setCourses={(updatedCourses) => { setCourses(updatedCourses); saveCourses(updatedCourses); }}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}
        <AuthScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user.role === 'admin') {
              setShowAdminPanel(true);
            } else {
              setActiveTab('courses');
            }
          }}
          registeredUsers={registeredUsers}
          onRegisterUser={handleRegisterUser}
        />
      </>
    );
  }

  // ── Admin role: show admin panel as full-screen experience ────────
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <AdminPanel
          onClose={() => { setCurrentUser(null); setShowAdminPanel(false); }}
          registeredUsers={registeredUsers}
          setRegisteredUsers={setRegisteredUsers}
          courses={courses}
          setCourses={(updatedCourses) => { setCourses(updatedCourses); saveCourses(updatedCourses); }}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      </div>
    );
  }

  // Deep structural exits
  if (activeMarkingCourse) {
    return (
      <AttendanceSheet
        course={activeMarkingCourse}
        onSave={handleSaveAttendance}
        onCancel={() => setActiveMarkingCourse(null)}
      />
    );
  }

  if (activeStatsCourse) {
    return (
      <ReportView
        course={activeStatsCourse}
        onBack={() => setActiveStatsCourse(null)}
      />
    );
  }

  // --- Bento Grid Statistics Calculations ---
  const currentWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysScheduleOffset = courses.filter((c) => c.schedule.days.includes(currentWeekday));

  let totalStudentsSum = 0;
  let totalSessionsSum = 0;
  let averageAttendanceRate = 0;
  let totalPresentMarks = 0;
  let totalPossibleMarks = 0;
  let totalExcusedMarksCount = 0;

  courses.forEach((c) => {
    totalStudentsSum += c.students.length;
    totalSessionsSum += c.sessions.length;

    c.sessions.forEach((s) => {
      Object.values(s.records).forEach((r) => {
        totalPossibleMarks++;
        if (r === 'Present' || r === 'Late' || r === 'Excused') {
          totalPresentMarks++;
        }
        if (r === 'Excused') {
          totalExcusedMarksCount++;
        }
      });
    });
  });

  if (totalPossibleMarks > 0) {
    averageAttendanceRate = Math.round((totalPresentMarks / totalPossibleMarks) * 100);
  } else {
    averageAttendanceRate = 0;
  }

  // Active course selected for live passcode widget check-in
  const activePasscodeCourse = courses.find((c) => c.id === livePasscodeCourseId) || courses[0];
  const currentLiveSession = activePasscodeCourse ? liveSessions.find((s) => s.courseId === activePasscodeCourse.id && s.expiresAt > Date.now()) : undefined;

  const daysOfWeekOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="min-h-screen bg-white text-stone-800 antialiased selection:bg-yellow-150">
      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          registeredUsers={registeredUsers}
          setRegisteredUsers={setRegisteredUsers}
          courses={courses}
          setCourses={(updatedCourses) => { setCourses(updatedCourses); saveCourses(updatedCourses); }}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}
      {showAIChat && (
        <div className="fixed inset-0 z-[998] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowAIChat(false); }}>
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAIChat(false)} className="absolute top-0 right-0 -mt-4 -mr-2 z-10 bg-white border-2 border-stone-200 rounded-full p-2 text-stone-500 hover:text-stone-900 hover:border-stone-400 transition-all cursor-pointer shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <AIAssistant courses={courses} />
          </div>
        </div>
      )}
      {/* Global Brand Header banner */}
      <nav id="branded-top-bar" className="bg-white border-b-2 border-stone-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1 flex items-center justify-center">
              <img src="/icon.png" alt="Auchi Polytechnic Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            </span>
            <div>
              <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest font-mono">Auchi Polytechnic</span>
              <h1 className="text-lg font-black text-yellow-950 leading-none">Auchi Poly Class Flow</h1>
            </div>
          </div>

          {/* Active Logged In Account Badge & Sign Out Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-stone-200 px-3.5 py-1.5 rounded-2xl w-full sm:w-auto justify-center">
              <span className={`w-2 h-2 rounded-full ${userRole === 'instructor' ? 'bg-yellow-600 animate-pulse' : 'bg-emerald-500'}`} />
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wide font-mono">Session ({userRole})</span>
                <span className="text-xs font-black text-stone-800">{currentUser.name} {currentUser.rollNo ? `• ${currentUser.rollNo}` : ''}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCurrentUser(null);
                setActiveTab('courses');
              }}
              className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer w-full sm:w-auto text-center"
            >
              Sign Out
            </button>

            {/* AI NAV BUTTON — always visible */}
            <button
              onClick={() => setShowAIChat(p => !p)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-yellow-600 to-fuchsia-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono border border-yellow-500/50 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Mayor / Buggy AI
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts */}
        {systemAlert && (
          <div className="p-4 bg-yellow-950 text-white rounded-3xl shadow-md font-bold text-xs text-center flex items-center justify-center gap-2.5 border-2 border-yellow-900 animate-scale-up">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            {systemAlert.text}
          </div>
        )}

        {/* Tab navigation indicators (Instructors get Timetables options) */}
        {userRole === 'instructor' && (
          <div className="flex border-b-2 border-stone-200 gap-6 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3.5 text-xs font-black tracking-wider uppercase transition-colors relative cursor-pointer ${
                activeTab === 'courses' ? 'text-yellow-950' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Class Courses Grid
              {activeTab === 'courses' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-900 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-3.5 text-xs font-black tracking-wider uppercase transition-colors relative cursor-pointer ${
                activeTab === 'schedule' ? 'text-yellow-950' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Timetable Calendar
              {activeTab === 'schedule' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-900 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3.5 text-xs font-black tracking-wider uppercase transition-colors relative cursor-pointer ${
                activeTab === 'students' ? 'text-yellow-950' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Attendance Takers Log
              {activeTab === 'students' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-900 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3.5 text-xs font-black tracking-wider uppercase transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ai' ? 'text-yellow-950' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'ai' ? 'text-yellow-600' : 'text-stone-400'}`} />
              AI Copilot
              {activeTab === 'ai' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-900 rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* main switch board */}
        {userRole === 'instructor' ? (
          /* ========================================================
             INSTRUCTOR PANELS
             ======================================================== */
          <>
            {activeTab === 'ai' && <AIAssistant courses={courses} />}
            
            {activeTab === 'courses' && (
              <div className="space-y-6">
                
                {/* INSTRUCTOR BENTO GRID BLOCK */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-auto">
                  
                  {/* CELL 1: Live Classroom Passcode Board (yellow 900 Background) - span-5 */}
                  <div className="col-span-1 md:col-span-5 bg-yellow-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden min-h-[220px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-800/40 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-yellow-200 tracking-widest uppercase font-mono bg-yellow-800 px-2.5 py-1 rounded-lg">
                          Lecture Passcode
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      {courses.length > 0 ? (
                        <div className="mt-4">
                          <label className="text-[10px] text-yellow-200 font-bold block mb-1">Select Active Course:</label>
                          <select
                            value={livePasscodeCourseId}
                            onChange={(e) => setLivePasscodeCourseId(e.target.value)}
                            className="bg-yellow-800/80 border border-yellow-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-hidden w-full max-w-xs"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id} className="text-stone-800 font-semibold">
                                {c.code} — {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-200 mt-2">No courses started yet</p>
                      )}
                    </div>

                    <div className="mt-4">
                      {activePasscodeCourse ? (
                        currentLiveSession ? (
                          <div className="flex flex-col gap-2 bg-yellow-950 p-4 rounded-2xl border border-yellow-800/60 shadow-inner">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-yellow-300 block font-bold font-mono tracking-widest">LIVE SPEED-CODE</span>
                                <span className="text-3xl font-black text-white font-mono tracking-widest leading-none mt-1 block">
                                  {currentLiveSession.code}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-amber-500 block tracking-widest">EXPIRES IN</span>
                                <span className="text-xl font-black text-amber-400 font-mono leading-none block">
                                  {Math.max(0, Math.round((currentLiveSession.expiresAt - Date.now()) / 1000))}s
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-yellow-300 border-t border-yellow-800/50 pt-2 mt-1">
                              <span>Capacity claims: {currentLiveSession.claims.length} / {currentLiveSession.maxCapacity}</span>
                              <button onClick={() => handleStopLiveSession(currentLiveSession.id)} className="text-rose-400 hover:text-rose-300 font-bold active:scale-95 cursor-pointer uppercase text-[10px] tracking-widest px-2 py-1 bg-rose-500/10 rounded-lg">End Now</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-950/60 p-4 rounded-2xl border border-yellow-800/40 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] text-yellow-200 font-bold tracking-widest">STUDENT CAPACITY:</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="500" 
                                value={liveCapacityLimit} 
                                onChange={(e) => setLiveCapacityLimit(Number(e.target.value))}
                                className="w-16 px-2 py-1.5 bg-yellow-900 border border-yellow-700 rounded-lg text-white text-xs text-center font-mono focus:outline-hidden ring-1 ring-yellow-500/20"
                              />
                            </div>
                            <button 
                              onClick={() => handleGenerateLiveSession(activePasscodeCourse.id, liveCapacityLimit)}
                              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-[11px] uppercase tracking-wider transition-colors active:scale-95 shadow-md flex justify-center items-center gap-2 cursor-pointer mt-1"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse" />
                              Generate Live Session Code
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-yellow-300">Create a course to run sessions</span>
                      )}
                    </div>
                  </div>

                  {/* CELL 2: Daily Live Lecture Timetable (Today's Scheduled List) - span-7 */}
                  <div className="col-span-1 md:col-span-7 bg-white rounded-3xl border-2 border-stone-200 p-6 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-stone-100">
                        <h3 className="text-sm font-black text-stone-850 tracking-tight">Today's Lectures ({todaysScheduleOffset.length})</h3>
                        <span className="text-[10px] font-bold text-yellow-700 font-mono bg-yellow-50 px-2.5 py-0.5 rounded-md">
                          {currentWeekday}
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-2.5 max-h-32 overflow-y-auto pr-1">
                        {todaysScheduleOffset.length > 0 ? (
                          todaysScheduleOffset.map((course) => (
                            <div key={course.id} className="flex items-center justify-between text-xs p-2 hover:bg-white rounded-xl border border-stone-100/60 transition-colors">
                              <div>
                                <span className="font-extrabold text-stone-850 block">{course.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono">{course.schedule.time} • {course.schedule.room}</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg">
                                {course.code}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-xs text-stone-400 font-medium">
                            No classes scheduled for {currentWeekday}. Ready for a light day?
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-500 font-medium">
                      <span>Total Registered Semesters: {courses.length}</span>
                      <span className="text-yellow-600 font-semibold cursor-pointer" onClick={() => setActiveTab('schedule')}>
                        View Entire Timetable &rarr;
                      </span>
                    </div>
                  </div>

                  {/* CELL 3: Average Campus Attendance Rate - span-4 */}
                  <div className="col-span-1 md:col-span-4 bg-white rounded-3xl border-2 border-stone-200 p-6 flex flex-col justify-between min-h-[175px]">
                    <div>
                      <span className="text-[9px] font-black text-stone-400 tracking-wider block uppercase">Average Student Rate</span>
                      <h4 className="text-sm font-bold text-stone-800 mt-1">Campus Aggregate</h4>
                    </div>
                    
                    <div className="my-3 flex items-center justify-between">
                      <span className="text-3xl font-black text-yellow-950 font-mono tracking-tight">
                        {averageAttendanceRate}%
                      </span>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-100 text-center uppercase tracking-wide">
                        In Sync
                      </span>
                    </div>

                    <div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-600 h-full rounded-full transition-all duration-500" style={{ width: `${averageAttendanceRate}%` }} />
                      </div>
                      <p className="text-[10px] text-stone-400 font-medium mt-1.5">Across all marked lecture rosters</p>
                    </div>
                  </div>

                  {/* CELL 4: Exemptions / Excused Absences Tracker - span-4 */}
                  <div className="col-span-1 md:col-span-4 bg-amber-50/60 rounded-3xl border border-amber-100 p-6 flex flex-col justify-between text-amber-950 min-h-[175px]">
                    <div>
                      <span className="text-[9px] font-bold text-amber-800 tracking-wider block uppercase font-mono">Exemptions Docket</span>
                      <h4 className="text-sm font-bold text-stone-850 mt-1">Excused Absence Logs</h4>
                    </div>

                    <div className="my-2.5 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-900 font-mono">{totalExcusedMarksCount}</span>
                      <span className="text-xs font-semibold text-amber-700">active logs</span>
                    </div>

                    <div className="pt-2 border-t border-amber-200/50 text-[10px] text-amber-800 font-medium leading-relaxed">
                      Excused profiles are automatically bypassed from the daily class absence rate penalty checkmark.
                    </div>
                  </div>

                  {/* CELL 5: Launch Quick Actions Center (Double Action triggers) - span-4 */}
                  <div className="col-span-1 md:col-span-4 bg-yellow-50/50 border-2 border-yellow-100 rounded-3xl p-6 flex flex-col justify-between min-h-[175px] text-yellow-950">
                    <div>
                      <span className="text-[9px] font-black text-yellow-700 tracking-wider block uppercase">Launcher Space</span>
                      <h4 className="text-sm font-bold text-yellow-900 mt-1">Management Actions</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => {
                          setShowAddCourse(!showAddCourse);
                          setShowAddStudent(false);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className="p-3 bg-yellow-900 text-white rounded-2xl text-[10px] font-bold text-center hover:bg-yellow-800 active:scale-95 transition-all shadow-sm cursor-pointer"
                      >
                        + Course
                      </button>
                      <button
                        onClick={() => {
                          setShowAddStudent(!showAddStudent);
                          setShowAddCourse(false);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className="p-3 bg-white border border-yellow-200 text-yellow-900 rounded-2xl text-[10px] font-bold text-center hover:bg-stone-55 active:scale-95 transition-all cursor-pointer"
                      >
                        + Student
                      </button>
                    </div>

                    <span className="text-[10px] text-yellow-750 font-medium block text-center mt-2.5">
                      Launch academic slots instantly.
                    </span>
                  </div>

                </div>

                {/* Create Course Form Modal Panel */}
                {showAddCourse && (
                  <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-md space-y-4 animate-scale-up">
                    <div className="border-b border-stone-100 pb-2">
                      <h3 className="font-extrabold text-sm text-stone-800">Initiate New Course Record</h3>
                      <p className="text-xs text-stone-400">Specify details below. A student passcode will generate automatically.</p>
                    </div>


                    <form onSubmit={handleCreateCourse} className="space-y-4 text-xs font-medium">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Course Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Applied Physics"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-450 text-stone-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide font-medium">Course Code</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. PHYS-202"
                            value={newCourseCode}
                            onChange={(e) => setNewCourseCode(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-450 uppercase text-stone-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide font-medium">Instructor</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Jeremiah Obazee"
                            value={newCourseInstructor}
                            onChange={(e) => setNewCourseInstructor(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-450 text-stone-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Lecture Room / Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Science Complex, Room B"
                            value={newCourseRoom}
                            onChange={(e) => setNewCourseRoom(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-450 text-stone-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block">Active Weekdays</label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeekOptions.map((day) => {
                            const isSelected = newCourseDays.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-stone-900 text-white border-transparent'
                                    : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block">Schedule Slot</label>
                        <input
                          type="text"
                          value={newCourseTime}
                          onChange={(e) => setNewCourseTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-450 font-mono text-stone-850"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCourse(false)}
                          className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 cursor-pointer active:scale-95 transition-all"
                        >
                          Generate Passcode & Launch
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Create Student Form Modal Panel */}
                {showAddStudent && (
                  <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-md space-y-4 animate-scale-up">
                    <div className="border-b border-stone-100 pb-2">
                      <h3 className="font-extrabold text-sm text-stone-850">Register & Assign Student Profile</h3>
                      <p className="text-xs text-stone-400">Input credentials to link details manually to a particular course room.</p>
                    </div>

                    <form onSubmit={handleAddStudentToCourse} className="space-y-4 text-xs font-medium">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block">Choose target class course</label>
                        <select
                          value={targetCourseIdForStudent}
                          onChange={(e) => setTargetCourseIdForStudent(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-bold focus:outline-hidden focus:border-yellow-400"
                        >
                          <option value="">-- Choose Course --</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} — {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Student Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Benjamin Carter"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-yellow-400 text-stone-800"
                        />
                      </div>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Email (Optional)</label>
                          <input
                            type="email"
                            placeholder="e.g. ben.carter@univ.edu"
                            value={newStudentEmail}
                            onChange={(e) => setNewStudentEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-yellow-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">ID/Roll Code</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CS26-009"
                            value={newStudentRoll}
                            onChange={(e) => setNewStudentRoll(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-yellow-400 font-mono uppercase text-stone-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddStudent(false)}
                          className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-white cursor-pointer text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-yellow-900 text-white font-bold rounded-xl hover:bg-yellow-800 cursor-pointer active:scale-95 transition-all text-xs"
                        >
                          Enlist to Class
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Courses Card Grid List */}
                {(() => {
                  const filteredInstructorCourses = courses.filter((course) => {
                    const query = courseSearchQuery.trim().toLowerCase();
                    if (!query) return true;
                    return (
                      course.name.toLowerCase().includes(query) ||
                      course.code.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-stone-200 shadow-xs">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-stone-850">Courses Directory ({filteredInstructorCourses.length})</h3>
                          <p className="text-xs text-stone-400 mt-0.5">Filter registered classes or check passcode details</p>
                        </div>

                        {courses.length > 0 && (
                          <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -transtone-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search by name or code..."
                              value={courseSearchQuery}
                              onChange={(e) => setCourseSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-9 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-yellow-500 placeholder:text-stone-400"
                            />
                            {courseSearchQuery && (
                              <button
                                onClick={() => setCourseSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -transtone-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInstructorCourses.map((course) => (
                          <ClassCard
                            key={course.id}
                            course={course}
                            isInstructor={true}
                            onSelectMark={(c) => setActiveMarkingCourse(c)}
                            onSelectStats={(c) => setActiveStatsCourse(c)}
                          />
                        ))}

                        {courses.length > 0 && filteredInstructorCourses.length === 0 && (
                          <div className="col-span-full bg-white p-12 text-center rounded-3xl border-2 border-stone-200 text-stone-400 space-y-4 shadow-sm">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
                              <Search className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-stone-800">No matching courses found</p>
                              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">We couldn't find any courses matching your search query: "{courseSearchQuery}". Try matching by full code or name words.</p>
                            </div>
                            <button
                              onClick={() => setCourseSearchQuery('')}
                              className="px-4 py-2 bg-yellow-900 text-white text-xs font-bold rounded-xl hover:bg-yellow-800 cursor-pointer active:scale-95 transition-all w-fit mx-auto"
                            >
                              Clear Search Filter
                            </button>
                          </div>
                        )}

                        {courses.length === 0 && (
                          <div className="col-span-full bg-white p-12 text-center rounded-3xl border-2 border-stone-200 text-stone-400 space-y-3.5">
                            <p className="text-sm font-semibold">No active courses registered in class databases</p>
                            <button
                              onClick={() => setShowAddCourse(true)}
                              className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800"
                            >
                              Launch Your First Course
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'schedule' && <ScheduleView courses={courses} />}
            {activeTab === 'students' && (
              <AttendanceTakers 
                courses={courses}
                liveSessions={liveSessions}
                onGenerateLiveSession={handleGenerateLiveSession}
                onStopLiveSession={handleStopLiveSession}
              />
            )}
          </>
        ) : (
          /* ========================================================
             STUDENT DASHBOARD
             ======================================================== */
          <StudentPortal
            courses={courses}
            allStudents={getUniqueStudentsList()}
            onCheckIn={handleStudentSelfCheckIn}
            onRegisterStudent={handleStudentSelfSignUp}
            liveSessions={liveSessions}
            onClaimLiveSlot={handleClaimLiveSlot}
            onUpdateStudentProfile={handleStudentProfileSync}
            loggedInStudent={
              currentUser?.role === 'student'
                ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    rollNo: currentUser.rollNo || '',
                  }
                : undefined
            }
            onLogout={() => {
              setCurrentUser(null);
            }}
          />
        )}
      </div>

      {/* Exquisite humbler footer containing system telemetry notes */}
      <footer className="border-t border-stone-150 py-8 bg-white/50 text-center">
        <p className="text-[11px] text-stone-400 font-medium">
          Auchi Poly Class Flow • Desktop-perfect and fully mobile adaptive attendance tracker.
        </p>
      </footer>
    </div>
  );
}

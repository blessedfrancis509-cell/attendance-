import React, { useState } from 'react';
import { Course, AppUser, Student, AttendanceStatus } from '../types';
import { ShieldAlert, Trash2, X, Users, Database, Plus, CheckCircle, RefreshCcw } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  registeredUsers: AppUser[];
  setRegisteredUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  courses: Course[];
  setCourses: (c: Course[]) => void;
  currentUser: AppUser | null;
  setCurrentUser: (u: AppUser | null) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  registeredUsers,
  setRegisteredUsers,
  courses,
  setCourses,
  currentUser,
  setCurrentUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'records'>('records');

  // Add fake record states
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [fakeName, setFakeName] = useState('');
  const [fakeMatric, setFakeMatric] = useState('');
  const [fakeStatus, setFakeStatus] = useState<AttendanceStatus>('Present');

  // Handle forcing a checkin
  const handleForceCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseId || !targetDate || !fakeName.trim() || !fakeMatric.trim()) return;

    const updatedCourses = courses.map((c) => {
      if (c.id === targetCourseId) {
        let updatedStudents = [...c.students];
        let student = updatedStudents.find(s => s.rollNo === fakeMatric);

        if (!student) {
          student = {
            id: `std-admin-${Date.now()}`,
            name: fakeName,
            email: `${fakeName.replace(/\s+/g, '').toLowerCase()}@university.edu`,
            rollNo: fakeMatric
          };
          updatedStudents.push(student);
        }

        const sessionIndex = c.sessions.findIndex(s => s.date === targetDate);
        let updatedSessions = [...c.sessions];

        if (sessionIndex > -1) {
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            records: {
              ...updatedSessions[sessionIndex].records,
              [student.id]: fakeStatus
            }
          };
        } else {
          // create new session date secretly
          const initialRecords: Record<string, AttendanceStatus> = {};
          updatedStudents.forEach(st => {
            initialRecords[st.id] = st.id === student?.id ? fakeStatus : 'Absent';
          });
          initialRecords[student.id] = fakeStatus;

          updatedSessions.push({
            id: `date-${Date.now()}`,
            date: targetDate,
            records: initialRecords,
            marked: true
          });
        }

        return { ...c, students: updatedStudents, sessions: updatedSessions };
      }
      return c;
    });

    setCourses(updatedCourses);
    setFakeName('');
    setFakeMatric('');
    alert(`Covert Injection Successful! Student [${fakeMatric}] logged as [${fakeStatus}] in ${targetCourseId} on ${targetDate}`);
  };

  const handleKickUser = (userId: string) => {
    if (confirm("Permanently ban and log out this user account?")) {
      setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser?.id === userId) {
        setCurrentUser(null);
        onClose();
      }
    }
  };

  const allDatesList = Array.from(new Set(courses.flatMap(c => c.sessions.map(s => s.date)))).sort();

  return (
    <div className="fixed inset-0 z-[999] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border-2 border-red-900/50 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-950/40 p-4 border-b border-red-900 flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-sm font-black text-white tracking-widest font-mono uppercase">System Administrator Override</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-900/40 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex bg-stone-950 border-b border-stone-800">
          <button 
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold font-mono tracking-wider cursor-pointer ${activeTab === 'records' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Database className="w-4 h-4" /> Secret Records Injection
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold font-mono tracking-wider cursor-pointer ${activeTab === 'users' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Users className="w-4 h-4" /> Global Accounts Matrix
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: Ghost Injection Data Manipulation */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-xl">
                <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs font-mono mb-2 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Inject Falsified Attendance Marks
                </h3>
                <p className="text-[11px] text-stone-400 mb-5">
                  WARNING: Changes made here alter database records invisibly to the instructor. Use to ghost-add records, manipulate course points, or fix broken attendance.
                </p>

                <form onSubmit={handleForceCheckIn} className="space-y-4 font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 uppercase tracking-widest">Select Target Course</label>
                      <select required value={targetCourseId} onChange={e => setTargetCourseId(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none text-stone-200">
                        <option value="">-- Choose Hijack Target --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 uppercase tracking-widest">Select Date Record</label>
                      <input required type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none text-stone-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 uppercase tracking-widest">Student Name</label>
                      <input required type="text" placeholder="John Ghost" value={fakeName} onChange={e => setFakeName(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none text-stone-200" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 uppercase tracking-widest">Matric No / Roll</label>
                      <input required type="text" placeholder="CS-GHOST-1" value={fakeMatric} onChange={e => setFakeMatric(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs uppercase focus:border-red-500 outline-none text-stone-200" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 uppercase tracking-widest">Force Status Mark</label>
                      <select required value={fakeStatus} onChange={e => setFakeStatus(e.target.value as AttendanceStatus)} className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none text-emerald-400 font-bold">
                        <option value="Present">Present (+1 PT)</option>
                        <option value="Late">Late (+1 PT)</option>
                        <option value="Excused">Excused (0 PT)</option>
                        <option value="Absent">Absent (0 PT)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-2 rounded-lg mt-2 text-xs tracking-widest flex justify-center items-center gap-2 cursor-pointer transition-colors shadow-md border border-red-500/50">
                    <Plus className="w-4 h-4" /> INJECT RECORD
                  </button>
                </form>
              </div>

              {/* Visualize Records Snippet */}
              <div className="border border-stone-800 rounded-xl p-4 overflow-hidden">
                <h3 className="text-[11px] uppercase tracking-widest text-stone-400 mb-3 font-mono font-bold border-b border-stone-800 pb-2 flex gap-2"><CheckCircle className="w-3.5 h-3.5"/> Lecturer Logs Snippet (Database Visual)</h3>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 font-mono text-[10px]">
                  {courses.flatMap(c => 
                    c.sessions.flatMap(s => 
                      Object.entries(s.records).map(([studentId, status]) => {
                        const std = c.students.find(x => x.id === studentId);
                        if (!std || status === 'Absent') return null;
                        return (
                          <div key={`${c.id}-${s.date}-${std.id}`} className="bg-stone-950 p-2 rounded border border-stone-800 flex justify-between">
                            <span className="text-stone-300">[{c.code}] • <b>{s.date}</b> • {std.name} ({std.rollNo})</span>
                            <span className={status === 'Present' ? 'text-emerald-400' : 'text-amber-400'}>{status}</span>
                          </div>
                        );
                      })
                    )
                  ).filter(Boolean)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Invalid users / Registered Users */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-mono text-stone-400 uppercase tracking-widest mb-2 border-b border-stone-800 pb-2">Global Registered Users ({registeredUsers.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registeredUsers.map(user => (
                  <div key={user.id} className="bg-stone-950 border border-stone-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${user.role === 'instructor' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                          {user.role}
                        </span>
                        <span className="font-bold text-sm text-stone-200">{user.name}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-1">{user.email} {user.rollNo && `• ${user.rollNo}`}</div>
                      <div className="text-[9px] text-stone-600 mt-0.5">Password Hash: [***********]</div>
                    </div>

                    <button onClick={() => handleKickUser(user.id)} className="p-2 hover:bg-red-900/30 text-stone-500 hover:text-red-400 border border-transparent hover:border-red-900 rounded-lg cursor-pointer transition-all shrink-0" title="Revoke Access">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

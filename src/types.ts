export interface Student {
  id: string;
  name: string;
  email: string;
  rollNo: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  timestamp?: string; // For audit
}

export interface Session {
  id: string; // usually Date string, e.g., "2026-06-10"
  date: string;
  marked: boolean;
  records: Record<string, AttendanceStatus>; // studentId -> status
}

export interface Course {
  id: string;
  code: string; // The enrollment/attendance code (e.g., "CS-301")
  passcode: string; // Short 6-digit code for verification/check-in, e.g. "392812"
  name: string;
  instructor: string;
  schedule: {
    days: string[]; // e.g. ["Monday", "Wednesday"]
    time: string; // e.g. "10:00 AM - 11:30 AM"
    room: string;
  };
  students: Student[];
  sessions: Session[];
}

export interface AttendanceStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  rate: number; // percentage
}

export interface LiveClaim {
  seqNo: number; // 1, 2, 3...
  matricNo: string;
  studentName: string;
  timestamp: string;
}

export interface LiveSession {
  id: string; // unique ID
  courseId: string;
  courseCode: string;
  courseName: string;
  code: string; // generated code (e.g., "5928")
  maxCapacity: number; // e.g. 20, 50, 100
  createdAt: number; // Date.now()
  expiresAt: number; // Date.now() + 3 minutes
  claims: LiveClaim[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'instructor' | 'student' | 'admin';
  rollNo?: string; // only for students
}



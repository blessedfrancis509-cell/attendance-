import { Course } from './types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    code: 'CS-101',
    passcode: '4829', // Class code for student checking-in
    name: 'Introduction to Computer Science',
    instructor: 'Dr. Helen Jenkins',
    schedule: {
      days: ['Monday', 'Wednesday'],
      time: '09:00 AM - 10:30 AM',
      room: 'Tech Hall, Room 402',
    },
    students: [
      { id: 'std-1', name: 'Alice Watson', email: 'alice.watson@campus.edu', rollNo: 'CS26-001' },
      { id: 'std-2', name: 'Benjamin Carter', email: 'ben.carter@campus.edu', rollNo: 'CS26-002' },
      { id: 'std-3', name: 'Chloe Sterling', email: 'chloe.s@campus.edu', rollNo: 'CS26-003' },
      { id: 'std-4', name: 'Daniel Miller', email: 'd.miller@campus.edu', rollNo: 'CS26-004' },
      { id: 'std-5', name: 'Ethan Hunt', email: 'ethan.h@campus.edu', rollNo: 'CS26-005' },
      { id: 'std-6', name: 'Fiona Gallagher', email: 'fiona.g@campus.edu', rollNo: 'CS26-006' },
      { id: 'std-7', name: 'George Cooper', email: 'gcooper@campus.edu', rollNo: 'CS26-007' },
      { id: 'std-8', name: 'Hannah Abbott', email: 'hannah.a@campus.edu', rollNo: 'CS26-008' },
    ],
    sessions: [
      {
        id: '2026-06-08',
        date: '2026-06-08',
        marked: true,
        records: {
          'std-1': 'Present',
          'std-2': 'Present',
          'std-3': 'Late',
          'std-4': 'Absent',
          'std-5': 'Present',
          'std-6': 'Excused',
          'std-7': 'Present',
          'std-8': 'Present',
        },
      },
      {
        id: '2026-06-09',
        date: '2026-06-09',
        marked: true,
        records: {
          'std-1': 'Present',
          'std-2': 'Present',
          'std-3': 'Present',
          'std-4': 'Present',
          'std-5': 'Absent',
          'std-6': 'Present',
          'std-7': 'Present',
          'std-8': 'Late',
        },
      },
    ],
  },
  {
    id: 'course-2',
    code: 'LIT-202',
    passcode: '8103',
    name: 'Modern English Literature',
    instructor: 'Prof. Jeremiah Obazee',
    schedule: {
      days: ['Tuesday', 'Thursday'],
      time: '11:00 AM - 12:30 PM',
      room: 'Humanities Hall, Room 105',
    },
    students: [
      { id: 'std-1', name: 'Alice Watson', email: 'alice.watson@campus.edu', rollNo: 'CS26-001' },
      { id: 'std-3', name: 'Chloe Sterling', email: 'chloe.s@campus.edu', rollNo: 'CS26-003' },
      { id: 'std-5', name: 'Ethan Hunt', email: 'ethan.h@campus.edu', rollNo: 'CS26-005' },
      { id: 'std-8', name: 'Hannah Abbott', email: 'hannah.a@campus.edu', rollNo: 'CS26-008' },
      { id: 'std-9', name: 'Ian Wright', email: 'ian.wright@campus.edu', rollNo: 'LIT26-012' },
      { id: 'std-10', name: 'Jessica Taylor', email: 'jess.taylor@campus.edu', rollNo: 'LIT26-015' },
    ],
    sessions: [
      {
        id: '2026-06-09',
        date: '2026-06-09',
        marked: true,
        records: {
          'std-1': 'Present',
          'std-3': 'Present',
          'std-5': 'Late',
          'std-8': 'Present',
          'std-9': 'Absent',
          'std-10': 'Present',
        },
      },
    ],
  },
  {
    id: 'course-3',
    code: 'MATH-150',
    passcode: '2946',
    name: 'Applied Calculus II',
    instructor: 'Dr. Sarah Kowalski',
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '01:30 PM - 03:00 PM',
      room: 'Science Complex, Auditorium B',
    },
    students: [
      { id: 'std-2', name: 'Benjamin Carter', email: 'ben.carter@campus.edu', rollNo: 'CS26-002' },
      { id: 'std-4', name: 'Daniel Miller', email: 'd.miller@campus.edu', rollNo: 'CS26-004' },
      { id: 'std-6', name: 'Fiona Gallagher', email: 'fiona.g@campus.edu', rollNo: 'CS26-006' },
      { id: 'std-7', name: 'George Cooper', email: 'gcooper@campus.edu', rollNo: 'CS26-007' },
      { id: 'std-9', name: 'Ian Wright', email: 'ian.wright@campus.edu', rollNo: 'LIT26-012' },
      { id: 'std-10', name: 'Jessica Taylor', email: 'jess.taylor@campus.edu', rollNo: 'LIT26-015' },
    ],
    sessions: [],
  },
];

export function loadCourses(): Course[] {
  const data = localStorage.getItem('class_attendance_courses');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse courses from localStorage', e);
    }
  }
  localStorage.setItem('class_attendance_courses', JSON.stringify(INITIAL_COURSES));
  return INITIAL_COURSES;
}

export function saveCourses(courses: Course[]) {
  localStorage.setItem('class_attendance_courses', JSON.stringify(courses));
}

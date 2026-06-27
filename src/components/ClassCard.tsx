import React from 'react';
import { Course } from '../types';
import { BookOpen, Users, Calendar, MapPin, Key, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

interface ClassCardProps {
  course: Course;
  onSelectMark: (course: Course) => void;
  onSelectStats: (course: Course) => void;
  isInstructor: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  course,
  onSelectMark,
  onSelectStats,
  isInstructor,
}) => {
  const studentCount = course.students.length;
  const sessionCount = course.sessions.length;

  // Calculate average attendance for this course
  let totalPresencePercentage = 100;
  if (sessionCount > 0 && studentCount > 0) {
    let totalPresentMarks = 0;
    course.sessions.forEach((s) => {
      Object.values(s.records).forEach((r) => {
        if (r === 'Present' || r === 'Late' || r === 'Excused') {
          totalPresentMarks++;
        }
      });
    });
    totalPresencePercentage = Math.round(
      (totalPresentMarks / (sessionCount * studentCount)) * 100
    );
  }

  // Determine attendance status color
  const isHighPerformance = totalPresencePercentage >= 85;
  const isAtRisk = totalPresencePercentage < 75;
  const rateBadgeColor = isHighPerformance
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : isAtRisk
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 flex flex-col justify-between h-full shadow-xs hover:shadow-md hover:border-yellow-400 transition-all duration-300">
      <div>
        {/* Course Code Accent */}
        <div className="flex justify-between items-start mb-2.5">
          <span className="text-xs font-black text-yellow-600 tracking-wider uppercase font-mono px-2.5 py-1 bg-yellow-50 rounded-lg">
            {course.code}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${rateBadgeColor} font-mono`}>
            {totalPresencePercentage}% Target
          </span>
        </div>

        {/* Title information */}
        <h3 className="font-extrabold text-base text-stone-900 tracking-tight leading-snug hover:text-yellow-900 transition-colors">
          {course.name}
        </h3>
        <p className="text-xs text-stone-500 font-medium mt-1">Instructor: {course.instructor}</p>

        {/* Bento Sub-details */}
        <div className="mt-4 space-y-2.5 pt-3 border-t border-stone-100 text-stone-650">
          {/* Days / Schedule */}
          <div className="flex items-start gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-yellow-600 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800">{course.schedule.days.join(', ')}</span>
              <span className="text-stone-500 font-mono block text-[11px]">{course.schedule.time}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-stone-650">
            <MapPin className="w-3.5 h-3.5 text-yellow-600" />
            <span className="font-medium">{course.schedule.room}</span>
          </div>

          {/* Code */}
          <div className="flex items-center justify-between mt-1 bg-white p-2 rounded-xl border border-stone-100 font-mono text-xs">
            <span className="text-stone-450 inline-flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              Passcode:
            </span>
            <span className="font-bold text-stone-800 font-mono tracking-widest bg-white shadow-xs px-2 py-0.5 rounded-md border border-stone-200">
              {course.passcode}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom parameters & buttons */}
      <div className="mt-5">
        <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-2xl border border-stone-100 text-center mb-4">
          <div>
            <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">Enrolled</span>
            <span className="text-sm font-extrabold text-stone-800 flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-yellow-500" />
              {studentCount}
            </span>
          </div>
          <div className="border-l border-stone-200">
            <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">Sessions</span>
            <span className="text-sm font-extrabold text-stone-800 flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-yellow-500" />
              {sessionCount}
            </span>
          </div>
        </div>

        {/* Dynamic trigger links */}
        <div className="flex gap-2">
          {isInstructor ? (
            <>
              <button
                onClick={() => onSelectMark(course)}
                className="button-touch-highlight flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-900 text-white rounded-xl text-xs font-bold hover:bg-yellow-800 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Roll
              </button>
              <button
                onClick={() => onSelectStats(course)}
                className="button-touch-highlight flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-stone-700 border border-stone-300 hover:bg-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5 text-yellow-650" /> Analytics
              </button>
            </>
          ) : (
            <button
              onClick={() => onSelectStats(course)}
              className="button-touch-highlight w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-yellow-900 text-white rounded-xl text-xs font-bold hover:bg-yellow-800 cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              Verify My Record <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

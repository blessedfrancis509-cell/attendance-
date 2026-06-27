import React from 'react';
import { Course } from '../types';
import { Clock, MapPin, Award, CheckCircle, Tag } from 'lucide-react';

interface ScheduleViewProps {
  courses: Course[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ courses }) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Get current day of the week, e.g., "Wednesday"
  const currentDayIndex = new Date().getDay();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[currentDayIndex];

  // Group classes by weekday
  const getCoursesForDay = (day: string) => {
    return courses.filter((course) => course.schedule.days.includes(day));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border-2 border-stone-200">
        <h2 className="text-lg font-black text-yellow-900 tracking-tight">Campus Master Schedule</h2>
        <p className="text-xs text-stone-500 mt-1">
          Weekly class timings, physical lecture halls, and student access codes. Selected highlight indicates today.
        </p>

        {/* Dynamic Today banner card in yellow */}
        <div className="mt-5 p-5 bg-yellow-900 rounded-2xl text-white flex justify-between items-center shadow-md">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-200">Active Campus Date</span>
            <span className="block text-base font-black font-mono mt-0.5">Today is {todayName}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl text-xs font-mono text-yellow-100 font-bold border border-white/10">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Weekday cards structure */}
      <div className="space-y-4">
        {weekdays.map((day) => {
          const dayCourses = getCoursesForDay(day);
          const isToday = day === todayName;

          return (
            <div
              key={day}
              className={`rounded-3xl border-2 transition-all ${
                isToday
                  ? 'bg-yellow-50/20 border-yellow-300 shadow-sm'
                  : 'bg-white border-stone-200'
              }`}
            >
              {/* Day header */}
              <div className={`p-4 flex items-center justify-between border-b-2 ${
                isToday ? 'border-yellow-100 bg-yellow-50/50' : 'border-stone-100 bg-white/30'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${isToday ? 'text-yellow-900' : 'text-stone-800'}`}>{day}</span>
                  {isToday && (
                    <span className="px-2.5 py-0.5 bg-yellow-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider font-mono">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {dayCourses.length} {dayCourses.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {/* Day schedules */}
              {dayCourses.length > 0 ? (
                <div className="divide-y divide-stone-100/80">
                  {dayCourses.map((course) => (
                    <div
                      key={`${day}-${course.id}`}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-stone-700 hover:bg-white/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-extrabold bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-md">
                            {course.code}
                          </span>
                          <h4 className="text-sm font-bold text-stone-800 leading-snug">
                            {course.name}
                          </h4>
                        </div>
                        <p className="text-xs text-stone-500 font-medium">Instructor: {course.instructor}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="font-mono text-[11px] text-stone-650">{course.schedule.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-stone-650">{course.schedule.room}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl text-[11px] font-mono text-stone-600 border border-stone-150">
                          <Tag className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Student Code: <span className="font-bold text-stone-800">{course.passcode}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-stone-400 text-xs font-medium">
                  No lectures scheduled for {day}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

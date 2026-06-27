import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../types';
import { Sparkles, Bot, Send, BrainCircuit, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface AIAssistantProps {
  courses: Course[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ courses }) => {
  const [messages, setMessages] = useState<{ id: string; role: 'ai' | 'user'; text: string; }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiModel, setAiModel] = useState<'mayor' | 'buggy'>('mayor');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate automated dynamic insights
  const generateInsights = () => {
    let insights: { icon: React.ReactNode; title: string; desc: string; color: string }[] = [];
    
    // Total courses
    if (courses.length === 0) {
      return [{ icon: <BrainCircuit className="w-5 h-5"/>, title: 'No Data Detected', desc: 'Add courses and students to generate AI metrics.', color: 'text-yellow-400 bg-yellow-50 border-yellow-200' }];
    }

    let lowestCourse: {name: string, rate: number} | null = null;
    let highestLate: {name: string, lateCount: number} | null = null;
    let totalClassesRunning = courses.length;

    courses.forEach(course => {
      let present = 0;
      let total = 0;
      let lateCount = 0;

      course.sessions.forEach(session => {
        Object.values(session.records).forEach(status => {
          total++;
          if (status === 'Present') present++;
          if (status === 'Late') lateCount++;
        });
      });

      const rate = total === 0 ? 100 : (present / total) * 100;
      if (!lowestCourse || rate < lowestCourse.rate) {
        lowestCourse = { name: course.name, rate };
      }
      
      if (!highestLate || lateCount > highestLate.lateCount) {
        highestLate = { name: course.name, lateCount };
      }
    });

    insights.push({
      icon: <Activity className="w-5 h-5"/>,
      title: 'Platform Utilization',
      desc: `Currently monitoring ${totalClassesRunning} active course streams representing ${courses.reduce((acc, c) => acc + c.students.length, 0)} student enrollments.`,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    });

    if (lowestCourse && lowestCourse.rate < 70) {
      insights.push({
        icon: <AlertTriangle className="w-5 h-5"/>,
        title: 'Retention Warning',
        desc: `"${lowestCourse.name}" is tracking a severe drop in punctuality (Attendance ~${Math.round(lowestCourse.rate)}%). Consider sending a reminder.`,
        color: 'text-rose-600 bg-rose-50 border-rose-200'
      });
    }

    if (highestLate && highestLate.lateCount > 0) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5"/>,
        title: 'Tardiness Spike',
        desc: `High volume of LATE marks reported in "${highestLate.name}" (${highestLate.lateCount} instances). Review capacity or timing.`,
        color: 'text-amber-600 bg-amber-50 border-amber-200'
      });
    }

    if (insights.length < 3) {
      insights.push({
        icon: <BrainCircuit className="w-5 h-5"/>,
        title: 'AI System Normal',
        desc: 'All other engagement metrics are within expected historical deviations.',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      });
    }

    return insights;
  };

  const initialInsights = generateInsights();

  useEffect(() => {
    // Initial AI greeting changes when switching model
    if (aiModel === 'mayor') {
      setMessages([
        { id: `init-${aiModel}`, role: 'ai', text: 'Greetings. I am Mayor, your formal analytic assistant. I have synthesized your course rosters and active metrics. What data insights do you require today? (You may ask about absences, enrolled courses, or late constraints).' }
      ]);
    } else {
      setMessages([
        { id: `init-${aiModel}`, role: 'ai', text: 'BZZZT... *click* Whoa, hey there! I\'m Buggy! 🐛 Ready to crunch some chaotic numbers for you! Try asking me who has the most absences or what courses we are running! I promise I won\'t eat your data... much.' }
      ]);
    }
  }, [aiModel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsTyping(true);

    // AI Simulation logic
    setTimeout(() => {
      let reply = aiModel === 'mayor' 
        ? "I am currently re-indexing that query. Could you specify your parameters regarding absences or course rosters clearly?"
        : "Beep boop? ERROR 404: Brain not found! Just kidding. Can you rephrase that? I got distracted by a shiny bit.";
      
      const msg = userText.toLowerCase();

      if (msg.includes('absence') || msg.includes('absent')) {
        let absentees = 0;
        courses.forEach(c => c.sessions.forEach(s => Object.values(s.records).forEach(r => { if(r==='Absent') absentees++; })));
        reply = aiModel === 'mayor'
          ? `Cross-referencing global databases, exactly ${absentees} unexcused absence instances exist across all registries.`
          : `Yikes! I found ${absentees} absences hiding in the database! Time to send some angry emails?! ⚡`;
      } else if (msg.includes('course') || msg.includes('class') || msg.includes('summarize')) {
        const topCourse = [...courses].sort((a,b)=>b.students.length - a.students.length)[0];
        reply = aiModel === 'mayor'
          ? `You have ${courses.length} active courses. Highest enrollment is "${topCourse?.name || 'Unknown'}" with ${topCourse?.students.length || 0} students.`
          : `We got ${courses.length} classes rolling! The biggest party is "${topCourse?.name}" with ${topCourse?.students.length} peeps! Woohoo!`;
      } else if (msg.includes('late')) {
        reply = aiModel === 'mayor'
          ? `Late claims securely invoke standard 1-point accumulations while logging the 'Late' indicator for future audits.`
          : `Latecomers still get points, but I slap a big 'LATE' sticker on their records! Bzzzz!`;
      } else if (msg.includes('hello') || msg.includes('hi')) {
        reply = aiModel === 'mayor'
          ? "Hello. All system functions are nominal. How may I govern your analytics?"
          : "HI THERE! I am highly caffeinated and ready to compute! What's up?!";
      }

      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Dynamic Insights Panel */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-yellow-950 to-yellow-900 rounded-[2rem] p-6 text-white border-2 border-yellow-950 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl font-bold"></div>
          <div className="flex items-center gap-3 border-b border-yellow-800/80 pb-4 mb-4">
            <div className="p-2.5 bg-yellow-800 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-[15px]">DeepMind AI Insight</h3>
              <p className="text-[10px] text-yellow-300 font-mono tracking-widest uppercase">System Analytics</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {initialInsights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${insight.color} shadow-sm backdrop-blur-md`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {insight.icon}
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">{insight.title}</h4>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive LLM Chat Engine */}
      <div className="w-full md:w-2/3 bg-white rounded-[2rem] border-2 border-stone-200 shadow-xl flex flex-col h-[600px] overflow-hidden">
        <div className="p-4 bg-white border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bot className={`w-6 h-6 ${aiModel === 'mayor' ? 'text-yellow-600' : 'text-fuchsia-500 animate-pulse'}`} />
            <div>
              <h3 className="font-black text-stone-800 text-sm">
                {aiModel === 'mayor' ? 'Mayor Base AI' : 'Buggy Variant'}
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> ONLINE
              </p>
            </div>
          </div>
          
          {/* Personality Switcher */}
          <div className="flex bg-stone-200/60 p-1 rounded-xl">
            <button 
              onClick={() => setAiModel('mayor')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${aiModel === 'mayor' ? 'bg-white shadow-sm text-yellow-700' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Mayor
            </button>
            <button 
              onClick={() => setAiModel('buggy')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${aiModel === 'buggy' ? 'bg-fuchsia-100 shadow-sm text-fuchsia-700' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Buggy
            </button>
          </div>
        </div>

        <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-4 ${aiModel === 'mayor' ? 'bg-stone-100/50' : 'bg-fuchsia-50/30'}`}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-4 text-xs font-medium leading-relaxed font-sans shadow-xs ${
                msg.role === 'user' 
                  ? (aiModel === 'mayor' ? 'bg-yellow-600 text-white rounded-br-none border border-yellow-700' : 'bg-fuchsia-600 text-white rounded-br-none border border-fuchsia-700')
                  : 'bg-white text-stone-700 rounded-bl-none border border-stone-200'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center shadow-xs">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-stone-200">
          <form onSubmit={handleSendPrompt} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask the AI about your students or metrics..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-stone-100 border border-stone-200 text-stone-800 rounded-full pl-5 pr-12 py-3.5 text-xs font-semibold focus:outline-hidden focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all font-mono"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 disabled:opacity-50 transition-colors active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

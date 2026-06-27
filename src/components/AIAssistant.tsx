import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../types';
import { Sparkles, Bot, Send, BrainCircuit, Activity, TrendingUp, AlertTriangle, Shield, Zap, User } from 'lucide-react';

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
        desc: `"${lowestCourse.name}" is tracking a severe drop in punctuality (Attendance ~${Math.round(lowestCourse.rate)}%).`,
        color: 'text-rose-600 bg-rose-50 border-rose-200'
      });
    }

    if (highestLate && highestLate.lateCount > 0) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5"/>,
        title: 'Tardiness Spike',
        desc: `High volume of LATE marks reported in "${highestLate.name}" (${highestLate.lateCount} instances).`,
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
    if (aiModel === 'mayor') {
      setMessages([
        { id: `init-${aiModel}`, role: 'ai', text: 'Greetings. I am Mayor, your formal analytic assistant. I have full knowledge of your class attendance data, and I can answer general knowledge questions across all fields of study! How may I assist you today?' }
      ]);
    } else {
      setMessages([
        { id: `init-${aiModel}`, role: 'ai', text: 'BZZZT... *click* Hey there! I\'m Buggy! 🐛 I can answer questions about the universe, your classes, and everything in between! What\'s up?!' }
      ]);
    }
  }, [aiModel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Build a minimal representation of course data to fit context limits comfortably
      const systemContextStr = courses.map(c => {
        let absents = 0;
        let lates = 0;
        let total = 0;
        c.sessions.forEach(s => Object.values(s.records).forEach(r => {
          total++;
          if (r === 'Absent') absents++;
          if (r === 'Late') lates++;
        }));
        return `- Course: ${c.name} (${c.code}). Instructor: ${c.instructor}. Students: ${c.students.length}. Total records: ${total}, Absences: ${absents}, Lates: ${lates}.`;
      }).join('\n');

      const systemPrompt = `You are an AI assistant for the 'Auchi Poly Class Flow' application.
Your personality: ${aiModel === 'mayor' ? 'Formal, concise, highly professional.' : 'Chaotic, slightly hyperactive, enthusiastic, but extremely smart.'}
You have general knowledge spanning all fields of study, science, arts, and history. Answer ANY question the user throws at you accurately.
You also have access to the following local app data regarding class attendance:
${systemContextStr}

Answer the user's latest query accurately. If they ask about the app data, use the provided context. If they ask a general question, answer it based on your broad LLM knowledge.`;

      // Structure request for pollinations.ai
      const reqBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...newMessages.slice(-5).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
        ],
        model: aiModel === 'mayor' ? 'openai' : 'mistral'
      };

      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) throw new Error('API failed');
      const textResponse = await res.text();

      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'ai', text: textResponse }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'ai', text: aiModel === 'mayor' ? 'My connection to the mainframe has dropped. Please check your network and try again.' : 'BZZZT! Sparks flying! The network went poof! Try again?! 💥' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 p-4 pb-32 md:pb-6 animate-fade-in">
      
      {/* Dynamic Insights Panel */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-yellow-gradient rounded-[2rem] p-6 text-yellow-950 border-2 border-yellow-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl font-bold pointer-events-none animate-pulse-glow"></div>
          <div className="flex items-center gap-3 border-b border-yellow-900/10 pb-4 mb-4 relative z-10">
            <div className="p-2.5 bg-yellow-950/20 backdrop-blur-md rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-950 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-[15px]">DeepMind AI Insight</h3>
              <p className="text-[10px] font-mono tracking-widest uppercase opacity-80">System Analytics</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {initialInsights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-xs animate-slide-up`} style={{ animationDelay: \`\${idx * 150}ms\` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 bg-white rounded-lg shadow-sm">{insight.icon}</span>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">{insight.title}</h4>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive LLM Chat Engine */}
      <div className="w-full md:w-2/3 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-stone-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-[500px] md:h-[600px] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-10" />
        
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-20 bg-white/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${aiModel === 'mayor' ? 'bg-yellow-100 text-yellow-600' : 'bg-fuchsia-100 text-fuchsia-500'} shadow-sm`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-stone-800 text-sm">
                {aiModel === 'mayor' ? 'Mayor Base AI' : 'Buggy Variant'}
              </h3>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> ONLINE & FUNCTIONAL
              </p>
            </div>
          </div>
          
          <div className="flex bg-stone-100/80 p-1.5 rounded-xl shadow-inner">
            <button 
              onClick={() => setAiModel('mayor')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${aiModel === 'mayor' ? 'bg-white shadow-sm text-yellow-700' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Mayor
            </button>
            <button 
              onClick={() => setAiModel('buggy')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${aiModel === 'buggy' ? 'bg-white shadow-sm text-fuchsia-700' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Buggy
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-stone-50/30 scroll-smooth pb-20">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 animate-fade-in`}>
              {msg.role === 'ai' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                  aiModel === 'mayor' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 'bg-fuchsia-100 text-fuchsia-500 border-fuchsia-200'
                }`}>
                  {aiModel === 'mayor' ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
              )}
              <div className={`max-w-[85%] rounded-3xl p-4 text-[13px] font-medium leading-relaxed font-sans shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-stone-800 text-white rounded-br-sm'
                  : (aiModel === 'mayor' ? 'bg-white border border-stone-200/60 rounded-tl-sm' : 'bg-fuchsia-50 border border-fuchsia-100 rounded-tl-sm')
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-stone-100 border-stone-200 text-stone-500">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start gap-2 animate-fade-in">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border animate-pulse ${
                aiModel === 'mayor' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 'bg-fuchsia-100 text-fuchsia-500 border-fuchsia-200'
              }`}>
                {aiModel === 'mayor' ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </div>
              <div className="bg-white border border-stone-200/60 rounded-3xl rounded-tl-sm p-4 flex gap-1.5 items-center shadow-sm h-12">
                <span className={`w-2 h-2 rounded-full animate-bounce ${aiModel === 'mayor' ? 'bg-yellow-500' : 'bg-fuchsia-400'}`}></span>
                <span className={`w-2 h-2 rounded-full animate-bounce ${aiModel === 'mayor' ? 'bg-yellow-500' : 'bg-fuchsia-400'}`} style={{animationDelay: '150ms'}}></span>
                <span className={`w-2 h-2 rounded-full animate-bounce ${aiModel === 'mayor' ? 'bg-yellow-500' : 'bg-fuchsia-400'}`} style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-stone-100 relative z-20">
          <form onSubmit={handleSendPrompt} className="relative flex items-center max-w-3xl mx-auto">
            <input 
              type="text" 
              placeholder="Ask anything (e.g. History, Math, or Class Stats)..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-stone-100/50 border-2 border-transparent text-stone-800 rounded-full pl-6 pr-14 py-4 text-sm font-semibold focus:outline-hidden focus:border-stone-200 focus:bg-white transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-2.5 bg-stone-800 text-white rounded-full hover:bg-stone-900 disabled:opacity-50 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

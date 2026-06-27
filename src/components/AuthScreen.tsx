import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Hash, GraduationCap, Users, BookOpenCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { AppUser } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  registeredUsers: AppUser[];
  onRegisterUser: (newUser: AppUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  registeredUsers,
  onRegisterUser,
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-hide Splash
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRollNo('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRoleChange = (newRole: 'student' | 'instructor') => {
    setRole(newRole);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;
    const trimmedName = name.trim();
    const trimmedRoll = rollNo.trim().toUpperCase();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMsg('Email and password are required.');
      return;
    }

    if (isSignUp) {
      if (!trimmedName) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (role === 'student' && !trimmedRoll) {
        setErrorMsg('Please specify your Matric / Roll No.');
        return;
      }

      const emailExists = registeredUsers.some((u) => u.email.toLowerCase() === trimmedEmail);
      if (emailExists) {
        setErrorMsg('An account with this email already exists.');
        return;
      }

      if (role === 'student') {
        const rollExists = registeredUsers.some(
          (u) => u.role === 'student' && u.rollNo?.toUpperCase() === trimmedRoll
        );
        if (rollExists) {
          setErrorMsg('An account with this Matric / Roll No already exists.');
          return;
        }
      }

      const newUser: AppUser = {
        id: `usr-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        role: role,
        rollNo: role === 'student' ? trimmedRoll : undefined,
      };

      onRegisterUser(newUser);
      setSuccessMsg('Account successfully created! Logging in...');
      setTimeout(() => onLoginSuccess(newUser), 1000);
    } else {
      // Check admin first — bypasses role selector entirely
      const adminUser = registeredUsers.find(
        (u) => u.role === 'admin' && u.email.toLowerCase() === trimmedEmail
      );
      if (adminUser) {
        if (adminUser.password !== trimmedPassword) {
          setErrorMsg('Invalid admin credentials.');
          return;
        }
        setSuccessMsg('Admin access authorized. Opening control panel...');
        setTimeout(() => onLoginSuccess(adminUser), 800);
        return;
      }

      const user = registeredUsers.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.role === role
      );

      if (!user) {
        setErrorMsg(`No matching ${role === 'instructor' ? 'Instructor' : 'Student'} account found for this email.`);
        return;
      }

      if (user.password !== trimmedPassword) {
        setErrorMsg('Incorrect password. Please try again.');
        return;
      }

      setSuccessMsg('Sign-in authorized! Synchronizing workspace...');
      setTimeout(() => onLoginSuccess(user), 1000);
    }
  };

  const handleDemoSignIn = (demoType: 'instructor' | 'student') => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (demoType === 'instructor') {
      const instructorUser = registeredUsers.find((u) => u.role === 'instructor') || {
        id: 'usr-demo-inst',
        name: 'Prof. Jeremiah Obazee',
        email: 'jeremiah@campus.edu',
        password: 'password',
        role: 'instructor' as const,
      };
      
      if (!registeredUsers.some((u) => u.email === instructorUser.email)) {
        onRegisterUser(instructorUser);
      }
      
      setSuccessMsg('Quick Sign-in: Accessing Instructor Room...');
      setTimeout(() => onLoginSuccess(instructorUser), 800);
    } else {
      const studentUser = registeredUsers.find((u) => u.role === 'student' && u.email === 'alice.watson@campus.edu') || {
        id: 'usr-demo-stud',
        name: 'Alice Watson',
        email: 'alice.watson@campus.edu',
        password: 'password',
        role: 'student' as const,
        rollNo: 'CS26-001',
      };
      
      if (!registeredUsers.some((u) => u.email === studentUser.email)) {
        onRegisterUser(studentUser);
      }

      setSuccessMsg('Quick Sign-in: Greeting Student Profile...');
      setTimeout(() => onLoginSuccess(studentUser), 800);
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 touch-none" style={{ background: 'linear-gradient(-45deg, #422006, #713f12, #422006)', backgroundSize: '200% 200%', animation: 'gradient-shift 4s ease infinite' }}>
        <div className="flex flex-col items-center gap-6 animate-pulse-glow">
          <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
            <img src="/icon.png" alt="Auchi Poly Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-float" />
          </div>
          <h1 className="text-2xl font-black text-yellow-400 tracking-widest uppercase font-mono drop-shadow-md animate-fade-in text-center max-w-[250px] leading-relaxed">
            Auchi Poly<br/>Class Flow
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-yellow-950 flex flex-col overflow-hidden touch-none selection:bg-yellow-500/30">
      
      {/* Brand Header */}
      <div className="flex-none pt-12 pb-6 px-6 flex flex-col items-center text-center animate-fade-in relative z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-20 left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none animate-float" />
        <div className="mb-4 animate-float" style={{ animationDelay: '1s' }}>
          <img src="/icon.png" alt="Auchi Poly Logo" className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 font-mono uppercase tracking-wider">Auchi Poly Class Flow</h1>
        <p className="text-yellow-200 text-sm max-w-[280px] font-medium opacity-90 drop-shadow">
          Your smart lecture & live attendance workspace.
        </p>
      </div>

      {/* Bottom Sheet Card */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] w-full px-6 py-8 pb-32 overflow-y-auto shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col animate-slide-up relative z-20">
        
        {/* Switcher Tab between LOGIN and SIGN UP */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60 mb-6 shrink-0">
          <button
            onClick={() => {
              setIsSignUp(false);
              resetForm();
            }}
            className={`flex-1 py-3.5 rounded-xl text-[13px] font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              !isSignUp
                ? 'bg-yellow-900 text-white shadow-md transform scale-[1.02]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-4 h-4" /> SIGN IN
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              resetForm();
            }}
            className={`flex-1 py-3.5 rounded-xl text-[13px] font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isSignUp
                ? 'bg-yellow-900 text-white shadow-md transform scale-[1.02]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4" /> SIGN UP
          </button>
        </div>

        {/* Role Segment Picker */}
        <div className="space-y-2 mb-6 shrink-0">
          <label className="text-[11px] font-extrabold text-stone-400 uppercase tracking-widest pl-1">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRoleChange('student')}
              className={`py-3.5 sm:px-4 rounded-2xl border-2 text-[13px] font-extrabold flex flex-col lg:flex-row items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                role === 'student'
                  ? 'bg-yellow-50 border-yellow-600 text-yellow-950 shadow-sm'
                  : 'bg-white border-stone-200/80 text-stone-500 hover:border-stone-300'
              }`}
            >
              <Users className="w-5 h-5" /> <span>Student</span>
            </button>
            <button
              onClick={() => handleRoleChange('instructor')}
              className={`py-3.5 sm:px-4 rounded-2xl border-2 text-[13px] font-extrabold flex flex-col lg:flex-row items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                role === 'instructor'
                  ? 'bg-yellow-50 border-yellow-600 text-yellow-950 shadow-sm'
                  : 'bg-white border-stone-200/80 text-stone-500 hover:border-stone-300'
              }`}
            >
              <GraduationCap className="w-5 h-5" /> <span>Lecturer</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div className="p-4 mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-2xl text-[13px] font-bold flex items-start gap-3 w-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 animate-pulse shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 mb-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-2xl text-[13px] font-bold flex items-start gap-3 w-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-ping shrink-0" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5 shrink-0">
          
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-stone-400 absolute left-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Benjamin Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl text-[15px] text-stone-800 font-bold focus:bg-white focus:outline-hidden focus:border-yellow-500 transition-colors placeholder:font-medium placeholder:text-stone-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-5 h-5 text-stone-400 absolute left-4" />
              <input
                type="email"
                required
                placeholder={role === 'instructor' ? 'instructor@univ.edu' : 'student@univ.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl text-[15px] text-stone-800 font-bold focus:bg-white focus:outline-hidden focus:border-yellow-500 transition-colors placeholder:font-medium placeholder:text-stone-400"
              />
            </div>
          </div>

          {isSignUp && role === 'student' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest pl-1">Matric / Roll Number</label>
              <div className="relative flex items-center">
                <Hash className="w-5 h-5 text-stone-400 absolute left-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CS26-002"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl text-[15px] text-stone-800 font-bold uppercase focus:bg-white focus:outline-hidden focus:border-yellow-500 transition-colors placeholder:font-medium placeholder:text-stone-400 placeholder:normal-case font-mono"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest pl-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-stone-400 absolute left-4" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl text-[15px] text-stone-800 font-bold tracking-widest focus:bg-white focus:outline-hidden focus:border-yellow-500 transition-colors placeholder:font-medium placeholder:text-stone-400 placeholder:tracking-normal"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-yellow-gradient hover:opacity-90 font-black text-yellow-950 rounded-2xl py-4 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_35px_rgba(250,204,21,0.6)] transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 text-[14px] uppercase tracking-widest cursor-pointer"
            >
              {isSignUp ? 'Create Profile' : 'Secure Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Fast Sandbox Login */}
        <div className="mt-8 shrink-0">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-x-0 h-px bg-stone-200"></div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Or try quick demo</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoSignIn('instructor')}
              className="py-3 px-4 bg-yellow-50/50 hover:bg-yellow-100 border-2 border-yellow-100 rounded-2xl text-[12px] font-extrabold text-yellow-950 flex flex-col items-center gap-1 transition-all cursor-pointer text-center active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-yellow-600 mb-1" />
              <span>Lecturer Key</span>
            </button>
            
            <button
              onClick={() => handleDemoSignIn('student')}
              className="py-3 px-4 bg-emerald-50/50 hover:bg-emerald-100 border-2 border-emerald-100 rounded-2xl text-[12px] font-extrabold text-emerald-950 flex flex-col items-center gap-1 transition-all cursor-pointer text-center active:scale-95"
            >
              <User className="w-4 h-4 text-emerald-600 mb-1" />
              <span>Student Key</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Ensure user profile exists in Firestore
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          hasCompletedOnboarding: false
        });
      } else {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString()
        });
      }

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 px-4">
      <div className="mb-8 text-center">
        <h1 className="font-bold text-3xl tracking-tight text-slate-900 dark:text-white">GenericMed</h1>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium mt-1">Smart Price Checker</p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-slate-500 dark:text-[#94A3B8] text-sm mt-2">Sign in to access your medicine history</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-500 dark:text-[#94A3B8]" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="block w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-[#1E293B] border border-transparent rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500 dark:text-[#94A3B8]" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-[#1E293B] border border-transparent rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-[#00A3FF] hover:bg-[#008BDB] disabled:bg-[#00A3FF]/50 disabled:cursor-not-allowed text-[#0B1120] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Sign In <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-slate-200 dark:bg-[#1E293B] flex-1"></div>
          <span className="text-sm text-slate-500 dark:text-[#94A3B8]">or continue with</span>
          <div className="h-px bg-slate-200 dark:bg-[#1E293B] flex-1"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mt-6 w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]/50 text-slate-700 dark:text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-[#00A3FF] text-sm font-medium">
            Don't have an account? <Link to="/signup" className="hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

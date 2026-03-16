import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-[#0B1120] text-slate-100 px-4">
      <div className="mb-8 text-center">
        <h1 className="font-bold text-3xl tracking-tight text-white">GenericMed</h1>
        <p className="text-sm text-[#94A3B8] font-medium mt-1">Smart Price Checker</p>
      </div>

      <div className="w-full max-w-md bg-[#111C33] border border-[#1E293B] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-[#94A3B8] text-sm mt-2">Sign up to save your medicine history</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-[#94A3B8]" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="block w-full pl-11 pr-4 py-3.5 bg-[#1E293B] border border-transparent rounded-xl text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[#94A3B8]" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full pl-11 pr-4 py-3.5 bg-[#1E293B] border border-transparent rounded-xl text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-[#00A3FF] hover:bg-[#008BDB] disabled:bg-[#00A3FF]/50 disabled:cursor-not-allowed text-[#0B1120] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Sign Up <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#00A3FF] text-sm font-medium">
            Already have an account? <Link to="/login" className="hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

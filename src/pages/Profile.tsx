import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User as UserIcon, Mail, Calendar, Activity, Camera, Check, X, Loader2 } from 'lucide-react';
import { signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useAppStore();
  const [imgError, setImgError] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim() || newName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    const path = `users/${user.uid}`;
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
      setIsEditingName(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploading(true);
    const path = `users/${user.uid}`;
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
      setImgError(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  const creationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  const initial = user.displayName 
    ? user.displayName[0].toUpperCase() 
    : user.email 
      ? user.email[0].toUpperCase() 
      : '';

  return (
    <div className="px-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
      </div>

      <div className="bg-white dark:bg-[#111C33] rounded-3xl p-8 border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col items-center text-center">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-[#00A3FF]/10 text-[#00A3FF] flex items-center justify-center mb-4 overflow-hidden border-4 border-white dark:border-[#0B1120] shadow-lg font-bold text-4xl">
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : user.photoURL && !imgError ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : initial ? (
              <span>{initial}</span>
            ) : (
              <UserIcon className="w-12 h-12" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-4 right-0 p-2 bg-[#00A3FF] text-white rounded-full shadow-lg hover:bg-[#008BDB] transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="w-full max-w-[200px]">
          {isEditingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#1E293B] border-none rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#00A3FF] outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
              />
              <button 
                onClick={handleUpdateName}
                disabled={isUpdating}
                className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(user.displayName || '');
                }}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.displayName || 'Set Name'}
              </h3>
              <UserIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 dark:text-[#94A3B8] flex items-center justify-center gap-2 mt-2">
          <Mail className="w-4 h-4" />
          {user.email}
        </p>
      </div>

      <div className="bg-white dark:bg-[#111C33] rounded-3xl p-6 border border-slate-200 dark:border-[#1E293B] shadow-sm space-y-6">
        <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1E293B] pb-4">Account Details</h4>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-slate-500 dark:text-[#94A3B8]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Member Since</p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{creationDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-slate-500 dark:text-[#94A3B8]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Total Scans</p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{history.length} prescriptions analyzed</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}

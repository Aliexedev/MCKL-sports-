import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Wallet } from './pages/Wallet';
import { Admin } from './pages/Admin';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Login />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  return <>{children}</>;
};

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'system');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMaintenance(docSnap.data().maintenance || false);
      } else {
        setMaintenance(false);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setMaintenance(false);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0F1113] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md bg-[#1A1D21] border border-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <img src="https://i.imgur.com/U9s8qfx_d.webp?maxwidth=760&fidelity=grand" alt="MCKL SPORTS" className="h-16 mx-auto object-contain mb-4" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-black uppercase tracking-widest text-white">Temporarily Closed</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">MCKL SPORTS Carnival 2026</p>
          </div>
          <div className="h-[1px] w-full bg-gray-800"></div>
          <p className="text-xs text-gray-400 leading-relaxed">
            The tournament platform is temporarily suspended for maintenance or updates. All balances, open predictions, and histories are securely saved.
          </p>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
            Please check back shortly!
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {maintenance && isAdmin && (
        <div className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Maintenance Mode Active: The site is offline for public users. Only Admins can access.</span>
        </div>
      )}
      {children}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MaintenanceGuard>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            </Route>
          </Routes>
        </MaintenanceGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}


import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Trophy, Home, Wallet, Shield, LogOut } from 'lucide-react';
import { cn, getTeamName, getTeamLogo } from '../lib/utils';
import { WelcomeAnimation } from './WelcomeAnimation';

const colorText = (color: string) => {
  switch (color) {
    case 'red': return 'text-red-500';
    case 'blue': return 'text-blue-500';
    case 'green': return 'text-green-500';
    case 'yellow': return 'text-yellow-500';
    default: return 'text-gray-400';
  }
};

export const Layout: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    sessionStorage.removeItem('welcomeAnimationShown_v5');
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F1113] text-gray-100 font-sans">
      <WelcomeAnimation />
      {/* Header / Navigation */}
      <nav className="flex items-center justify-between px-6 py-3 bg-[#1A1D21] border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col items-start gap-1">
            <img src="https://i.imgur.com/U9s8qfx_d.webp?maxwidth=760&fidelity=grand" alt="MCKL SPORTS" className="h-8 object-contain" referrerPolicy="no-referrer" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Carnival 2026</span>
          </Link>
          
          {user && (
            <div className="hidden md:flex gap-4 ml-8">
              <Link to="/" className="px-4 py-1 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Sports</Link>
              <Link to="/leaderboard" className="px-4 py-1 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Leaderboard</Link>
              {isAdmin && (
                <Link to="/admin" className="px-4 py-1 text-sm font-semibold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && profile && (
            <>
              <div className="flex flex-col items-end px-4 border-r border-gray-700 hidden sm:flex">
                <span className="text-xs text-gray-400">Main Balance</span>
                <span className="text-sm font-bold text-green-400">RM {profile.balance.toLocaleString()}</span>
              </div>
              
              <Link to="/wallet" className="flex items-center gap-2 px-3 py-2 bg-[#252A30] rounded border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center text-[10px] font-bold text-white">TNG</div>
                <span className="text-xs font-semibold text-white">Deposit</span>
              </Link>
              
              <div className="flex items-center gap-2 hidden sm:flex">
                {profile.houseColor && (
                  <img src={getTeamLogo(profile.houseColor)} alt={getTeamName(profile.houseColor)} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                )}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium">{profile.displayName}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    colorText(profile.houseColor)
                  )}>
                    {profile.houseColor ? getTeamName(profile.houseColor) : 'No House'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#0F1113] p-6 flex flex-col gap-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-[#0a0c0e] border-t border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Server: Cloud-Main-01</span>
          <span>Secure SSL/TLS (Firebase)</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 hidden sm:flex">
          <span>TNG Payment Services: ONLINE</span>
          <span className="text-gray-600">© 2026 MCKL Sports Commission</span>
        </div>
      </footer>
    </div>
  );
};

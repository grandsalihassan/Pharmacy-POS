import React from 'react';
import { Database, Wifi, ShieldCheck, Keyboard, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface DesktopStatusBarProps {
  currentUser: UserProfile;
  totalSalesToday: number;
}

export const DesktopStatusBar: React.FC<DesktopStatusBarProps> = ({
  currentUser,
  totalSalesToday,
}) => {
  return (
    <div 
      id="desktop-status-bar" 
      className="bg-slate-900 border-t border-slate-800 text-slate-400 px-3 py-1 flex items-center justify-between text-[11px] select-none font-sans"
    >
      {/* Left: Terminal & Engine Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-300">
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="font-mono text-slate-400">DB:</span>
          <span className="text-emerald-400 font-medium">SQLite-Ready (Synced)</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="hidden sm:flex items-center gap-1">
          <Wifi className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-300">Remote Hub:</span>
          <span className="text-cyan-400 font-medium">Online (Laptop + Mobile)</span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="text-slate-300 hidden md:block">
          Active: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
        </div>
      </div>

      {/* Center/Right: POS Shortcuts Quick Guide */}
      <div className="hidden xl:flex items-center gap-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F1</kbd>
          <span>POS</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F2</kbd>
          <span>Stock</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F3</kbd>
          <span>Purchase</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F4</kbd>
          <span>Returns</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F6</kbd>
          <span>P&amp;L</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F8</kbd>
          <span>User</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono text-slate-300">F10</kbd>
          <span>Calc</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-emerald-800 text-emerald-200 px-1 py-0.2 rounded border border-emerald-700 font-mono font-bold">F12</kbd>
          <span className="text-emerald-300">Pay</span>
        </span>
      </div>

      {/* Right: Status Pill */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Shift: Morning (Counter #01)
        </span>
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYSTEM READY</span>
        </div>
      </div>
    </div>
  );
};

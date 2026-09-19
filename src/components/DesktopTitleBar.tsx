import React, { useState, useEffect } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Calculator, 
  Smartphone, 
  UserCheck, 
  Maximize2,
  Clock,
  Shield,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';

interface DesktopTitleBarProps {
  currentUser: UserProfile;
  onOpenUserSwitch: () => void;
  onOpenCalculator: () => void;
  onOpenRemoteModal: () => void;
  onOpenShortcutsModal: () => void;
  onResetToSampleData?: () => void;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({
  currentUser,
  onOpenUserSwitch,
  onOpenCalculator,
  onOpenRemoteModal,
  onOpenShortcutsModal,
  onResetToSampleData,
}) => {
  const [time, setTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const state = sound.toggleSound();
    setSoundEnabled(state);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div 
      id="desktop-titlebar"
      className="bg-slate-900 text-slate-200 select-none border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs font-sans shadow-sm"
    >
      {/* Left: Window identity & system title */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-emerald-600/90 text-white px-2 py-0.5 rounded font-mono font-semibold tracking-wider text-[11px] shadow-xs">
          <span>Rx</span>
          <span className="font-bold">PharmaPOS</span>
          <span className="bg-emerald-950/60 text-emerald-200 text-[9px] px-1 py-0.2 rounded font-sans">
            v4.2 PRO
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-slate-400">
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium">Pharmacy &amp; Retail ERP System</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Terminal #01 (Main Counter)</span>
        </div>
      </div>

      {/* Center: System Status & Cloud Remote Sync Indicator */}
      <div className="flex items-center gap-3">
        <button
          id="remote-access-indicator-btn"
          onClick={onOpenRemoteModal}
          title="Click to view Mobile & Laptop Remote Access settings"
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-0.5 rounded border border-slate-700 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium hidden sm:inline">Mobile/Laptop Sync</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span className="font-mono text-[11px] text-slate-200">{time || '09:00:00 AM'}</span>
        </div>
      </div>

      {/* Right: Quick Tools, Active User & Desktop Window Controls */}
      <div className="flex items-center gap-2">
        {/* Sound toggle */}
        <button
          id="toggle-sound-btn"
          onClick={toggleSound}
          title={soundEnabled ? 'Barcode Sound: ON' : 'Barcode Sound: OFF'}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {/* Quick Calculator */}
        <button
          id="open-calculator-btn"
          onClick={onOpenCalculator}
          title="POS Quick Calculator [F10]"
          className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] hidden sm:inline">Calc</span>
          <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1 rounded">F10</kbd>
        </button>

        {/* Reset / Reload Demo Data */}
        {onResetToSampleData && (
          <button
            id="reload-sample-data-btn"
            onClick={onResetToSampleData}
            title="Reset / Reload all sample pharmacy medicines, sales and accounts"
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white rounded border border-emerald-700/60 transition cursor-pointer text-[11px]"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline font-medium">Reset Data</span>
          </button>
        )}

        {/* Keyboard shortcuts */}
        <button
          id="shortcuts-help-btn"
          onClick={onOpenShortcutsModal}
          title="View Keyboard Hotkeys [?]"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition hidden sm:block"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Current User Pill & Switch */}
        <button
          id="user-switch-pill-btn"
          onClick={onOpenUserSwitch}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer"
          title="Click to Switch User / Role [F8]"
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
            currentUser.role === 'owner' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {currentUser.avatar}
          </div>
          <span className="text-[11px] font-medium max-w-[110px] truncate">
            {currentUser.name}
          </span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
            currentUser.role === 'owner' 
              ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-700' 
              : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
          }`}>
            {currentUser.role}
          </span>
          <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1 rounded hidden lg:inline">F8</kbd>
        </button>

        {/* Software Window Control Simulation */}
        <div className="flex items-center pl-1 border-l border-slate-800 space-x-1">
          <button 
            id="window-minimize-btn"
            title="Minimize" 
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            id="window-maximize-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Restore Down' : 'Maximize'} 
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded"
          >
            {isFullscreen ? <Maximize2 className="w-2.5 h-2.5" /> : <Square className="w-2.5 h-2.5" />}
          </button>
          <button 
            id="window-close-btn"
            title="Close / Exit Terminal" 
            onClick={() => {
              if (window.confirm('Do you want to lock the POS terminal?')) {
                onOpenUserSwitch();
              }
            }}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Monitor, 
  Tablet, 
  QrCode, 
  Wifi, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { ConnectedDevice } from '../types';

interface RemoteAccessModalProps {
  devices: ConnectedDevice[];
  isOpen: boolean;
  onClose: () => void;
  onToggleMobilePreview: () => void;
  isMobilePreviewActive: boolean;
}

export const RemoteAccessModal: React.FC<RemoteAccessModalProps> = ({
  devices,
  isOpen,
  onClose,
  onToggleMobilePreview,
  isMobilePreviewActive,
}) => {
  const [copied, setCopied] = useState(false);
  const cloudUrl = window?.location?.origin 
    ? `${window.location.origin}?remote=mobile_token_9921` 
    : 'https://pharmapos-cloud.app/remote-terminal';

  if (!isOpen) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(cloudUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-900/60 text-cyan-400 border border-cyan-700">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Mobile + Laptop Remote Cloud Access</h3>
              <p className="text-[11px] text-slate-400">
                Secure real-time synchronization between Counter PC, Owner Laptop, and Mobile Phone
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-300 rounded p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span className="font-bold text-emerald-900">Cloud Sync Gateway: Active &amp; Encrypted</span>
                <div className="text-[11px] text-emerald-700">
                  256-bit SSL Remote Tunnel • Automatic instant stock &amp; billing sync
                </div>
              </div>
            </div>

            {/* Mobile View Simulator Toggle */}
            <button
              onClick={() => {
                onToggleMobilePreview();
                onClose();
              }}
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isMobilePreviewActive ? 'Exit Mobile View' : 'Simulate Mobile View'}</span>
            </button>
          </div>

          {/* Quick Connect Link & QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 border border-slate-200 rounded p-4">
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded border border-slate-300 shadow-2xs">
              <div className="w-28 h-28 bg-slate-100 rounded border border-slate-300 flex items-center justify-center p-2 relative">
                {/* Visual SVG QR representation */}
                <svg className="w-full h-full text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h2v2h-2v-2zm4 0h4v2h-4v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-6-2h2v2h-2v-2zm0-4h2v2h-2v-2z" />
                </svg>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-2 text-center">
                Scan with Phone Camera to Open POS on Mobile
              </span>
            </div>

            <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Remote Access Web URL (for Laptop &amp; Phone):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={cloudUrl}
                    className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-700"
                  />
                  <button
                    onClick={copyLink}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>Owner Laptop:</strong> Live P&amp;L reports, supplier purchase orders, and sales audits.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>Mobile Phone:</strong> Stock barcode check, low stock alerts, and sales summary on the go.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Active Devices List */}
          <div>
            <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>Authorized Remote Devices ({devices.length})</span>
              <span className="text-[10px] text-slate-500">Auto-Refreshed: Every 5s</span>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                    dev.isCurrent ? 'bg-cyan-50/70 border-cyan-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-slate-100 text-slate-700">
                      {dev.deviceType === 'desktop' && <Monitor className="w-4 h-4" />}
                      {dev.deviceType === 'laptop' && <Laptop className="w-4 h-4" />}
                      {dev.deviceType === 'mobile' && <Smartphone className="w-4 h-4" />}
                      {dev.deviceType === 'tablet' && <Tablet className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{dev.deviceName}</span>
                        {dev.isCurrent && (
                          <span className="bg-cyan-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Current Terminal
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {dev.location} • User: <strong>{dev.user}</strong> • {dev.ipAddress}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {dev.lastActive}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-100 px-5 py-2.5 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

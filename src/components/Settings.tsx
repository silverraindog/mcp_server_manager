import { Sliders, Cpu, HardDrive, Bell, RotateCcw, Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuditLog } from '../context/AuditLogContext';

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { addToast } = useToast();
  const { addLog } = useAuditLog();

  const handleCpuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ cpuThreshold: Number(e.target.value) });
  };

  const handleMemoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ memoryThreshold: Number(e.target.value) });
  };

  const handleSave = () => {
    addToast({
      type: 'success',
      title: 'Thresholds Saved',
      message: `CPU threshold set to ${settings.cpuThreshold}% & Memory set to ${settings.memoryThreshold}%.`,
    });
    addLog({
      category: 'System Settings',
      action: 'UPDATE_THRESHOLDS',
      description: `Set CPU threshold limit to ${settings.cpuThreshold}% and Memory threshold to ${settings.memoryThreshold}%`,
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  const handleReset = () => {
    resetSettings();
    addToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'Reverted resource threshold limits to default values (75%).',
    });
    addLog({
      category: 'System Settings',
      action: 'RESET_SETTINGS',
      description: 'Reset system resource threshold limits to system default values (75%)',
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System & Resource Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define custom CPU and Memory alert thresholds and automated system monitoring parameters.
        </p>
      </div>

      {/* Threshold Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Container Resource Usage Thresholds
            </h2>
            <p className="text-xs text-slate-500">
              Exceeding these limits triggers real-time visual warning banners and alert badges across the dashboard.
            </p>
          </div>
        </div>

        {/* CPU Threshold Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Cpu className="w-4 h-4 text-purple-600" />
              CPU Utilization Limit Threshold
            </label>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
              {settings.cpuThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.cpuThreshold}
            onChange={handleCpuChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>10% (Strict)</span>
            <span>50%</span>
            <span>75% (Recommended)</span>
            <span>100% (Off)</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-3">
          {/* Memory Threshold Control */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Memory Allocation Limit Threshold
            </label>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              {settings.memoryThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.memoryThreshold}
            onChange={handleMemoryChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>10% (Strict)</span>
            <span>50%</span>
            <span>75% (Recommended)</span>
            <span>100% (Off)</span>
          </div>
        </div>

        {/* Notifications & Toggles */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-600" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">
                  Broadcast Visual Banners on Exceed
                </span>
                <span className="text-xs text-slate-500">
                  Highlight dashboard metrics in red when peak container metrics cross limits.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertOnExceed}
              onChange={(e) => updateSettings({ alertOnExceed: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

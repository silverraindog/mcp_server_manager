import { Sliders, Cpu, HardDrive, Bell, RotateCcw, Save, Zap, Activity } from 'lucide-react';
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

  const handleAutoScaleToggle = (enabled: boolean) => {
    updateSettings({ autoScaleEnabled: enabled });
    addToast({
      type: enabled ? 'success' : 'info',
      title: enabled ? 'Auto-Scaling Enabled' : 'Auto-Scaling Disabled',
      message: enabled
        ? `Containers will now automatically adjust memory and CPU headroom when exceeding ${settings.memoryThreshold}% memory or ${settings.cpuThreshold}% CPU.`
        : 'Automated container resource scaling has been suspended.',
    });
    addLog({
      category: 'Auto-Scaling',
      action: 'AUTO_SCALE_TOGGLED',
      description: enabled
        ? `Enabled automated container auto-scaling (triggers at CPU > ${settings.cpuThreshold}%, Memory > ${settings.memoryThreshold}%)`
        : 'Disabled automated container auto-scaling policy',
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  const handleSimulateAutoScale = () => {
    addToast({
      type: 'success',
      title: 'Auto-Scale Event Simulated',
      message: `Allocated +${settings.autoScaleMaxMemoryBoost}% memory headroom to running MCP containers.`,
    });
    addLog({
      category: 'Auto-Scaling',
      action: 'AUTO_SCALE_TRIGGERED',
      description: `Auto-scaled container memory and CPU quota (+${settings.autoScaleMaxMemoryBoost}% headroom) after simulated spike exceeded threshold`,
      actor: 'Auto-Scale Policy Engine',
      status: 'Success',
    });
  };

  const handleSave = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: `CPU threshold set to ${settings.cpuThreshold}%, Memory to ${settings.memoryThreshold}%, Auto-Scale ${settings.autoScaleEnabled ? 'Enabled' : 'Disabled'}.`,
    });
    addLog({
      category: 'System Settings',
      action: 'UPDATE_THRESHOLDS',
      description: `Saved monitoring policy: CPU threshold ${settings.cpuThreshold}%, Memory threshold ${settings.memoryThreshold}%, Auto-scale ${settings.autoScaleEnabled ? 'active' : 'inactive'}`,
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  const handleReset = () => {
    resetSettings();
    addToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'Reverted resource threshold limits and auto-scale policies to default values.',
    });
    addLog({
      category: 'System Settings',
      action: 'RESET_SETTINGS',
      description: 'Reset system resource threshold limits and auto-scale policies to default template',
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">System & Resource Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Define custom CPU/Memory alert thresholds, automated auto-scaling policies, and monitoring parameters.
        </p>
      </div>

      {/* Threshold Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6 transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Container Resource Usage Thresholds
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exceeding these limits triggers real-time visual warning banners, status alerts, and autonomous scaling.
            </p>
          </div>
        </div>

        {/* CPU Threshold Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              CPU Utilization Limit Threshold
            </label>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg">
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
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
            <span>10% (Strict)</span>
            <span>50%</span>
            <span>75% (Recommended)</span>
            <span>100% (Off)</span>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          {/* Memory Threshold Control */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Memory Allocation Limit Threshold
            </label>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg">
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
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
            <span>10% (Strict)</span>
            <span>50%</span>
            <span>75% (Recommended)</span>
            <span>100% (Off)</span>
          </div>
        </div>
      </div>

      {/* Autonomous Auto-Scaling Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/70 rounded-lg text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Autonomous Container Auto-Scaling
                {settings.autoScaleEnabled && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md">
                    Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatically scale container memory limits and throttle buffers when metrics cross defined thresholds.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoScaleEnabled}
              onChange={(e) => handleAutoScaleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Auto-Scale Configuration Details */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Dynamic Headroom Boost
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                +{settings.autoScaleMaxMemoryBoost}% Headroom
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When an MCP container exceeds {settings.memoryThreshold}% memory or {settings.cpuThreshold}% CPU, the auto-scaler automatically allocates an additional +{settings.autoScaleMaxMemoryBoost}% resource quota and records the event in the Audit Log.
            </p>

            <div className="flex gap-2 pt-1">
              {[25, 50, 100].map((boost) => (
                <button
                  key={boost}
                  type="button"
                  onClick={() => updateSettings({ autoScaleMaxMemoryBoost: boost })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    settings.autoScaleMaxMemoryBoost === boost
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  +{boost}% Headroom
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Want to verify automated policy dispatching without waiting for organic load?
            </span>
            <button
              type="button"
              onClick={handleSimulateAutoScale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Simulate Auto-Scale Trigger
            </button>
          </div>
        </div>

        {/* Notifications & Toggles */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Broadcast Visual Banners on Exceed
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight dashboard metrics in red when peak container metrics cross limits.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertOnExceed}
              onChange={(e) => updateSettings({ alertOnExceed: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-emerald-500 focus:ring-slate-900 dark:bg-slate-800"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

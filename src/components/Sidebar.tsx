import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Settings, FileText, Sliders, ClipboardList } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Server Catalog', path: '/catalog', icon: Server },
    { name: 'Configuration Editor', path: '/config', icon: Settings },
    { name: 'Logs', path: '/logs', icon: FileText },
    { name: 'Audit Log', path: '/audit-log', icon: ClipboardList },
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="mb-10 text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-3 h-3 bg-slate-900 rounded-full inline-block"></span>
          MCP Manager
        </div>
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-200 text-xs text-slate-400 font-mono">
        v1.2.0 · Docker Engine
      </div>
    </aside>
  );
}

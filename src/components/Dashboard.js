'use client';

import { FolderOpen, Plus, TrendingUp, DollarSign, Trash2, Clock } from 'lucide-react';

export default function Dashboard({ projects, onNewProject, onLoadProject, onDeleteProject }) {
  const totalValue = projects.reduce((sum, p) => {
    const projectTotal = (p.cart || []).reduce((s, i) => s + i.price * i.qty, 0);
    return sum + projectTotal;
  }, 0);

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FolderOpen size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${(totalValue / 1000).toFixed(0)}k</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${projects.length > 0 ? (totalValue / projects.length / 1000).toFixed(1) : 0}k
              </p>
              <p className="text-sm text-gray-500">Avg Project</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Button */}
      <button
        onClick={onNewProject}
        className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.99]"
      >
        <Plus size={24} /> Start New Project
      </button>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentProjects.map(project => (
              <button
                key={project.id}
                onClick={() => onLoadProject(project)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors duration-150 group"
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock size={14} />
                      {new Date(project.updatedAt).toLocaleDateString('en-NZ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <p className="font-semibold text-emerald-600">
                      ${((project.cart || []).reduce((s, i) => s + i.price * i.qty, 0)).toLocaleString('en-NZ', { maximumFractionDigits: 0 })}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      title="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first quote to get started. Use the AI assistant to help estimate materials and labour.
          </p>
        </div>
      )}
    </div>
  );
}

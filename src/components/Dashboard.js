'use client';

import { FolderOpen, Plus, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard({ projects, onNewProject, onLoadProject }) {
  const totalValue = projects.reduce((sum, p) => {
    const projectTotal = (p.cart || []).reduce((s, i) => s + i.price * i.qty, 0);
    return sum + projectTotal;
  }, 0);

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FolderOpen size={24} />
            <span className="text-3xl font-bold">{projects.length}</span>
          </div>
          <p className="text-emerald-100">Total Projects</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <span className="text-3xl font-bold">${(totalValue / 1000).toFixed(0)}k</span>
          </div>
          <p className="text-blue-100">Total Value</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} />
            <span className="text-3xl font-bold">
              {projects.length > 0 ? (totalValue / projects.length / 1000).toFixed(1) : 0}k
            </span>
          </div>
          <p className="text-purple-100">Avg Project</p>
        </div>
      </div>

      {/* Quick Actions - Single Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <button
          onClick={() => {
            onNewProject();
            // This should switch to the quote page
          }}
          className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={24} /> Start New Project
        </button>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {recentProjects.map(project => (
              <button
                key={project.id}
                onClick={() => onLoadProject(project)}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600">
                    ${((project.cart || []).reduce((s, i) => s + i.price * i.qty, 0)).toFixed(0)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Start your first project to begin quoting</p>
        </div>
      )}
    </div>
  );
}

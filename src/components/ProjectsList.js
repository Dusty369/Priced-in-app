'use client';

import { Plus, FolderOpen, Clock, Trash2 } from 'lucide-react';
import { DEFAULT_LABOUR_RATES, formatNZD } from '../lib/constants';

export default function ProjectsList({
  projects,
  currentProjectId,
  onNewProject,
  onLoadProject,
  onDeleteProject,
  labourRates,
  onNavigateToMaterials
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Saved Projects</h2>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No saved projects yet</h3>
          <p className="text-gray-500 mb-4">
            Create a quote and save it as a project to see it here.
          </p>
          <button
            onClick={onNavigateToMaterials}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Start a New Quote
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(project => {
            const projectMaterialsTotal = project.cart?.reduce((sum, i) => sum + (i.price * i.qty), 0) || 0;
            const projectLabourTotal = (project.labourItems || []).reduce((sum, item) => {
              const rate = labourRates[item.role] || DEFAULT_LABOUR_RATES[item.role] || 0;
              return sum + (rate * item.hours);
            }, 0);
            const projectSubtotal = projectMaterialsTotal + projectLabourTotal;
            const projectWithMarkups = projectSubtotal * (1 + (project.wastage || 10) / 100) * (1 + (project.margin || 20) / 100);
            const projectFinal = project.gst !== false ? projectWithMarkups * 1.15 : projectWithMarkups;
            
            return (
              <div 
                key={project.id} 
                className={`bg-white rounded-xl shadow p-4 hover:shadow-lg transition cursor-pointer ${
                  currentProjectId === project.id ? 'ring-2 ring-emerald-500' : ''
                }`}
                onClick={() => onLoadProject(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">
                      {formatNZD(projectFinal)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {project.cart?.length || 0} materials, {(project.labourItems || []).length} labour
                    </p>
                  </div>
                </div>
                
                {project.notes && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.notes}
                  </p>
                )}
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onLoadProject(project); }}
                    className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-medium"
                  >
                    Open
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

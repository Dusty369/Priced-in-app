'use client';

import { useState, useMemo } from 'react';
import {
  FolderOpen, Plus, TrendingUp, DollarSign, Trash2, Clock, Search,
  CheckCircle, FileText, Hammer, Eye, Copy, MoreVertical, Filter,
  Home, Fence, Award, AlertCircle, ChevronDown, Calendar, Package, Users
} from 'lucide-react';
import { formatNZD } from '../lib/constants';

// Project status definitions
export const PROJECT_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  quoted: { label: 'Quoted', color: 'bg-blue-100 text-blue-700', icon: FileText },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Hammer },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700', icon: Award },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

// Project type icons
const PROJECT_ICONS = {
  deck: { icon: '🏗️', label: 'Deck' },
  renovation: { icon: '🏠', label: 'Renovation' },
  fence: { icon: '🚧', label: 'Fence' },
  bathroom: { icon: '🚿', label: 'Bathroom' },
  kitchen: { icon: '🍳', label: 'Kitchen' },
  roofing: { icon: '🏚️', label: 'Roofing' },
  landscaping: { icon: '🌳', label: 'Landscaping' },
  other: { icon: '📋', label: 'Other' }
};

// Calculate full project quote total
function calculateProjectTotal(project, labourRates = {}) {
  const defaultRates = { builder: 105, labourer: 50, apprentice: 35, electrician: 115, plumber: 115, tiler: 130, painter: 70, plasterer: 45 };
  const rates = { ...defaultRates, ...labourRates };

  const cart = project.cart || [];
  const labourItems = project.labourItems || [];
  const wastage = project.wastage ?? 10;
  const margin = project.margin ?? 20;
  const gst = project.gst ?? true;

  const materialsSubtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const materialsWithWastage = materialsSubtotal * (1 + wastage / 100);
  const materialsWithMargin = materialsWithWastage * (1 + margin / 100);

  const labourSubtotal = labourItems.reduce((sum, item) => {
    const rate = rates[item.role] || 0;
    return sum + (rate * item.hours);
  }, 0);
  const labourWithMargin = labourSubtotal * (1 + margin / 100);

  const subtotal = materialsWithMargin + labourWithMargin;
  return gst ? subtotal * 1.15 : subtotal;
}

// Get project type from name/notes
function inferProjectType(project) {
  const text = `${project.name} ${project.notes || ''}`.toLowerCase();
  if (text.includes('deck')) return 'deck';
  if (text.includes('fence')) return 'fence';
  if (text.includes('bathroom') || text.includes('ensuite')) return 'bathroom';
  if (text.includes('kitchen')) return 'kitchen';
  if (text.includes('roof')) return 'roofing';
  if (text.includes('renovation') || text.includes('reno')) return 'renovation';
  if (text.includes('landscap') || text.includes('garden')) return 'landscaping';
  return 'other';
}

// Format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export default function Dashboard({
  projects,
  onNewProject,
  onLoadProject,
  onDeleteProject,
  onDuplicateProject,
  onUpdateProjectStatus,
  labourRates
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);

    const activeProjects = projects.filter(p =>
      ['draft', 'quoted', 'accepted', 'in_progress'].includes(p.status || 'draft')
    );

    const quotedProjects = projects.filter(p => p.status === 'quoted');
    const wonThisMonth = projects.filter(p =>
      (p.status === 'accepted' || p.status === 'in_progress' || p.status === 'complete') &&
      p.updatedAt?.slice(0, 7) === thisMonth
    );

    const pipelineValue = activeProjects.reduce((sum, p) =>
      sum + calculateProjectTotal(p, labourRates), 0
    );

    const totalQuoted = projects.filter(p => p.status === 'quoted' || p.status === 'accepted' || p.status === 'complete').length;
    const totalWon = projects.filter(p => p.status === 'accepted' || p.status === 'in_progress' || p.status === 'complete').length;
    const winRate = totalQuoted > 0 ? Math.round((totalWon / totalQuoted) * 100) : 0;

    return {
      activeCount: activeProjects.length,
      pipelineValue,
      pendingQuotes: quotedProjects.length,
      wonThisMonth: wonThisMonth.length,
      winRate,
      avgProjectSize: projects.length > 0
        ? projects.reduce((sum, p) => sum + calculateProjectTotal(p, labourRates), 0) / projects.length
        : 0
    };
  }, [projects, labourRates]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.clientName?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => (p.status || 'draft') === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'value-high':
        result.sort((a, b) => calculateProjectTotal(b, labourRates) - calculateProjectTotal(a, labourRates));
        break;
      case 'value-low':
        result.sort((a, b) => calculateProjectTotal(a, labourRates) - calculateProjectTotal(b, labourRates));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    return result;
  }, [projects, searchQuery, statusFilter, sortBy, labourRates]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return projects
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(p => ({
        project: p,
        time: formatRelativeTime(p.updatedAt),
        action: p.status === 'draft' ? 'created' : 'updated'
      }));
  }, [projects]);

  const handleDuplicate = (project, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (onDuplicateProject) {
      onDuplicateProject(project);
    }
  };

  const handleDelete = (projectId, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (confirm('Delete this project? This cannot be undone.')) {
      onDeleteProject(projectId);
    }
  };

  const handleStatusChange = (projectId, newStatus, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (onUpdateProjectStatus) {
      onUpdateProjectStatus(projectId, newStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your quotes and track project progress</p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-all w-full sm:w-auto"
        >
          <Plus size={20} /> New Project
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FolderOpen size={20} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Active Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {formatNZD(stats.pipelineValue)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Pipeline Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendingQuotes}</p>
              <p className="text-xs sm:text-sm text-gray-500">Pending Quotes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Award size={20} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.wonThisMonth}</p>
              <p className="text-xs sm:text-sm text-gray-500">Won This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Win Rate & Avg Size */}
      {projects.length > 2 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <span className="text-gray-600">Win rate:</span>
              <span className="font-semibold text-emerald-700">{stats.winRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-blue-600" />
              <span className="text-gray-600">Avg project:</span>
              <span className="font-semibold text-blue-700">
                {formatNZD(stats.avgProjectSize)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Status Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { value: 'all', label: 'All', count: projects.length },
            { value: 'draft', label: 'Draft', count: projects.filter(p => (p.status || 'draft') === 'draft').length },
            { value: 'quoted', label: 'Quoted', count: projects.filter(p => p.status === 'quoted').length },
            { value: 'accepted', label: 'Accepted', count: projects.filter(p => p.status === 'accepted').length },
            { value: 'in_progress', label: 'In Progress', count: projects.filter(p => p.status === 'in_progress').length },
            { value: 'complete', label: 'Complete', count: projects.filter(p => p.status === 'complete').length },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                  statusFilter === tab.value ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="value-high">Highest Value</option>
            <option value="value-low">Lowest Value</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Project Cards */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects.map(project => {
            const total = calculateProjectTotal(project, labourRates);
            const status = PROJECT_STATUSES[project.status || 'draft'];
            const StatusIcon = status.icon;
            const projectType = PROJECT_ICONS[inferProjectType(project)];
            const materialCount = project.cart?.length || 0;
            const labourHours = project.labourItems?.reduce((sum, i) => sum + (i.hours || 0), 0) || 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-150 overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    {/* Left: Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-xl sm:text-2xl">{projectType.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{project.name}</h3>
                          {project.clientName && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{project.clientName}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          {formatNZD(total)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(project.updatedAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {(materialCount > 0 || labourHours > 0) && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {materialCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Package size={12} />
                              {materialCount} materials
                            </span>
                          )}
                          {labourHours > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {labourHours}hrs labour
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadProject(project)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium text-sm transition-colors"
                      >
                        <Eye size={16} className="inline mr-1.5" />
                        View
                      </button>

                      {/* More Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === project.id ? null : project.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenu === project.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                            <button
                              onClick={(e) => handleDuplicate(project, e)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Copy size={16} /> Duplicate
                            </button>

                            <div className="border-t border-gray-100 my-1" />
                            <p className="px-4 py-1 text-xs text-gray-400 font-medium">Change Status</p>

                            {Object.entries(PROJECT_STATUSES).map(([key, s]) => (
                              <button
                                key={key}
                                onClick={(e) => handleStatusChange(project.id, key, e)}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                                  (project.status || 'draft') === key ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                                }`}
                              >
                                <s.icon size={14} /> {s.label}
                              </button>
                            ))}

                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={(e) => handleDelete(project.id, e)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={32} className="text-gray-400" />
          </div>
          {projects.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first quote to get started. Browse materials and use the AI assistant to build estimates.
              </p>
              <button
                onClick={onNewProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                <Plus size={20} /> Create First Project
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching projects</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && projects.length > 3 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{PROJECT_ICONS[inferProjectType(activity.project)].icon}</span>
                  <div>
                    <span className="font-medium text-gray-900">{activity.project.name}</span>
                    <span className="text-gray-500 ml-2">
                      {activity.action === 'created' ? 'created' : 'updated'}
                    </span>
                  </div>
                </div>
                <span className="text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}

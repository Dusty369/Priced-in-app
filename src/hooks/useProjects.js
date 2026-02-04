import { useState, useEffect, useCallback } from 'react';
import { PROJECTS_KEY, CURRENT_PROJECT_KEY } from '../lib/constants';

/**
 * Custom hook for project management
 * @param {Object} options
 * @param {Function} options.getProjectData - Returns current project data (cart, labour, settings)
 * @param {Function} options.onLoadProject - Callback when loading a project
 * @param {Function} options.onNewProject - Callback when creating a new project
 * @param {Function} options.onNavigate - Callback to navigate to a page
 */
export function useProjects({
  getProjectData,
  onLoadProject,
  onNewProject,
  onNavigate
}) {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveProjectName, setSaveProjectName] = useState('');

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed);

      // Auto-load last active project
      const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (currentId) {
        const current = parsed.find(p => p.id === currentId);
        if (current) {
          setCurrentProjectId(current.id);
          setCurrentProjectName(current.name);
          setProjectNotes(current.notes || '');
          onLoadProject(current);
        }
      }
    }
  }, []);

  // Save project
  const saveProject = useCallback((name, overwrite = false) => {
    const projectData = getProjectData();

    setProjects(prev => {
      const newProject = {
        id: overwrite && currentProjectId ? currentProjectId : Date.now().toString(),
        name: name || currentProjectName || 'Untitled Project',
        ...projectData,
        notes: projectNotes,
        createdAt: overwrite && currentProjectId
          ? prev.find(p => p.id === currentProjectId)?.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProjects = overwrite && currentProjectId
        ? prev.map(p => p.id === currentProjectId ? newProject : p)
        : [...prev, newProject];

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      setCurrentProjectId(newProject.id);
      setCurrentProjectName(newProject.name);
      localStorage.setItem(CURRENT_PROJECT_KEY, newProject.id);
      setShowSaveDialog(false);

      return updatedProjects;
    });
  }, [currentProjectId, currentProjectName, projectNotes, getProjectData]);

  // Load project
  const loadProject = useCallback((project) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setProjectNotes(project.notes || '');
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    onLoadProject(project);
    onNavigate('quote');
  }, [onLoadProject, onNavigate]);

  // Delete project
  const deleteProject = useCallback((projectId) => {
    if (!confirm('Delete this project?')) return;

    setProjects(prev => {
      const updatedProjects = prev.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));

      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setCurrentProjectName('');
        setProjectNotes('');
        localStorage.removeItem(CURRENT_PROJECT_KEY);
      }

      return updatedProjects;
    });
  }, [currentProjectId]);

  // New project
  const newProject = useCallback(() => {
    setCurrentProjectId(null);
    setCurrentProjectName('');
    setProjectNotes('');
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    onNewProject();
    onNavigate('materials');
  }, [onNewProject, onNavigate]);

  // Open save dialog
  const openSaveDialog = useCallback(() => {
    setSaveProjectName('');
    setShowSaveDialog(true);
  }, []);

  // Close save dialog
  const closeSaveDialog = useCallback(() => {
    setShowSaveDialog(false);
  }, []);

  return {
    // State
    projects,
    currentProjectId,
    currentProjectName,
    projectNotes,
    setProjectNotes,
    showSaveDialog,
    saveProjectName,
    setSaveProjectName,

    // Actions
    saveProject,
    loadProject,
    deleteProject,
    newProject,
    openSaveDialog,
    closeSaveDialog
  };
}

export default useProjects;

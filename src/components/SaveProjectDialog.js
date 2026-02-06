'use client';

import { Save, User, MapPin } from 'lucide-react';

export default function SaveProjectDialog({
  isOpen,
  onClose,
  saveProjectName,
  setSaveProjectName,
  clientName,
  setClientName,
  clientAddress,
  setClientAddress,
  projectNotes,
  setProjectNotes,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Save size={24} className="text-emerald-600" />
          Save Project
        </h2>

        <input
          type="text"
          value={saveProjectName}
          onChange={(e) => setSaveProjectName(e.target.value)}
          placeholder="Project name..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          autoFocus
        />

        <div className="relative mb-3">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={clientName || ''}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name (optional)..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="relative mb-3">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={clientAddress || ''}
            onChange={(e) => setClientAddress(e.target.value)}
            placeholder="Property address (optional)..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <textarea
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
          placeholder="Notes (optional)..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-24 resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!saveProjectName.trim()}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

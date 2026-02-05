'use client';

import { useState, useRef } from 'react';
import { Building2, Upload, X, Palette } from 'lucide-react';
import { DEFAULT_COMPANY_INFO } from '../lib/constants';

export default function CompanySettingsDialog({
  isOpen,
  onClose,
  companyInfo,
  setCompanyInfo
}) {
  const fileInputRef = useRef(null);
  const [logoError, setLogoError] = useState('');

  if (!isOpen) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Please upload an image file (PNG, JPG)');
      return;
    }

    // Validate file size (100KB limit for localStorage)
    if (file.size > 100 * 1024) {
      setLogoError('Logo must be under 100KB. Try a smaller image.');
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCompanyInfo({ ...companyInfo, logo: evt.target?.result });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyInfo({ ...companyInfo, logo: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 size={24} className="text-emerald-600" />
            Company Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">These details appear on your PDF quotes</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Business Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                placeholder="Your Company Name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  placeholder="027 123 4567"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                  placeholder="you@company.co.nz"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                placeholder="123 Builder St, Auckland"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Branding Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Palette size={18} />
              Branding
            </h3>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              {companyInfo.logo ? (
                <div className="flex items-center gap-4">
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <img
                      src={companyInfo.logo}
                      alt="Logo preview"
                      className="max-h-16 max-w-[200px] object-contain"
                    />
                  </div>
                  <button
                    onClick={removeLogo}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <X size={16} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                  >
                    <Upload size={18} />
                    Upload Logo
                  </button>
                  <p className="text-xs text-gray-500 mt-1">PNG or JPG, max 100KB</p>
                </div>
              )}
              {logoError && <p className="text-sm text-red-600 mt-1">{logoError}</p>}
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={companyInfo.primaryColor || '#10b981'}
                  onChange={(e) => setCompanyInfo({...companyInfo, primaryColor: e.target.value})}
                  className="w-12 h-10 rounded cursor-pointer border-0"
                />
                <span className="text-sm text-gray-600">{companyInfo.primaryColor || '#10b981'}</span>
                <button
                  onClick={() => setCompanyInfo({...companyInfo, primaryColor: '#10b981'})}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Reset to default
                </button>
              </div>
            </div>
          </div>

          {/* Quote Terms Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Quote Terms</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid For (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={companyInfo.quoteValidity || 30}
                onChange={(e) => setCompanyInfo({...companyInfo, quoteValidity: parseInt(e.target.value) || 30})}
                className="w-24 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <textarea
                value={companyInfo.paymentTerms || ''}
                onChange={(e) => setCompanyInfo({...companyInfo, paymentTerms: e.target.value})}
                placeholder="e.g., 50% deposit, balance on completion"
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={companyInfo.termsAndConditions || ''}
                onChange={(e) => setCompanyInfo({...companyInfo, termsAndConditions: e.target.value})}
                placeholder="e.g., All prices exclude council fees and engineering if required..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex gap-3">
          <button
            onClick={() => setCompanyInfo(DEFAULT_COMPANY_INFO)}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

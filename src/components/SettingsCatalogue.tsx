import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Plus, Save } from 'lucide-react';
import { ServiceItem } from '../types';

export const SettingsCatalogue: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load services:', err);
        setLoading(false);
      });
  }, []);

  const handleUpdateService = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const handleAddService = () => {
    setServices([
      ...services,
      {
        id: `srv-${Date.now()}`,
        category: 'Ecommerce Strategy & Consulting',
        name: 'New Custom Service',
        description: 'Description of service capabilities.'
      }
    ]);
  };

  const handleSave = async () => {
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save services:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#07162c] text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-bold">Smollan Service Catalogue Management</span>
          <h2 className="text-2xl font-black">Settings & Editable Service Catalogue</h2>
          <p className="text-xs text-slate-300 mt-1">Informed by ecompletecommerce.co.za and Smollan Digital Commerce capabilities.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#00e5ff] text-[#07162c] hover:bg-cyan-300 px-6 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? '✓ Saved Successfully' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Configured Service Offerings ({services.length})</h3>
            <p className="text-xs text-slate-500">Audit findings automatically map to these services during opportunity analysis.</p>
          </div>
          <button
            onClick={handleAddService}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading services catalogue...</div>
        ) : (
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={service.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Category</label>
                    <input
                      type="text"
                      value={service.category}
                      onChange={(e) => handleUpdateService(idx, 'category', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => handleUpdateService(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={service.description}
                    onChange={(e) => handleUpdateService(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

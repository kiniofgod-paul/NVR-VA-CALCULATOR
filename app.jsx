import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Settings, Check, Activity, ShieldCheck, Video, BarChart3, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// --- 1. NVR Data ---
const NVR_MODELS = [
  { 
    model: "DR-8564 / 8564D", 
    versions: [
      { label: "v9.1.0 or higher", units: 32, throughput: 3200 },
      { label: "Under v9.0.0", units: 64, throughput: 6400 }
    ]
  },
  { 
    model: "DR-8532 / 8532D", 
    versions: [
      { label: "v9.1.0 or higher", units: 16, throughput: 1600 },
      { label: "Under v9.0.0", units: 32, throughput: 3200 }
    ]
  },
  { 
    model: "DR-8516", 
    versions: [
      { label: "v9.1.0 or higher", units: 16, throughput: 1600 },
      { label: "Under v9.0.0", units: 16, throughput: 1600 }
    ]
  },
  { 
    model: "DR-6532P / 6532P-A", 
    versions: [
      { label: "v9.1.0 or higher", units: 16, throughput: 1600 },
      { label: "Under v9.0.0", units: 32, throughput: 3200 }
    ]
  },
  { 
    model: "DR-6516P", 
    versions: [
      { label: "v9.1.0 or higher", units: 16, throughput: 1600 },
      { label: "Under v9.0.0", units: 16, throughput: 1600 }
    ]
  },
  { 
    model: "DR-6508P", 
    versions: [
      { label: "v9.1.0 or higher", units: 16, throughput: 1600 },
      { label: "Under v9.0.0", units: 8, throughput: 800 }
    ]
  },
  { 
    model: "2516P", 
    versions: [
      { label: "v9.1.0 or higher", units: 8, throughput: 800 },
      { label: "Under v9.0.0", units: 16, throughput: 1600 }
    ]
  },
  { 
    model: "DR-2508P", 
    versions: [
      { label: "v9.1.0 or higher", units: 8, throughput: 800 },
      { label: "Under v9.0.0", units: 8, throughput: 800 }
    ]
  },
  { 
    model: "DR-2504P", 
    versions: [
      { label: "v9.1.0 or higher", units: 8, throughput: 800 },
      { label: "Under v9.0.0", units: 4, throughput: 400 }
    ]
  }
];

// --- 2. VA Features Definition ---
const VA_FEATURES = [
  { id: 'obj', label: 'Object', group: 'ENGINE_1', icon: '🎯' },
  { id: 'intrusion', label: 'Intrusion', group: 'ENGINE_1', icon: '🚧' },
  { id: 'loitering', label: 'Loitering', group: 'ENGINE_1', icon: '⏳' },
  { id: 'line', label: 'Line', group: 'ENGINE_1', icon: '➖' },
  { id: 'face', label: 'Face', group: 'ENGINE_2', icon: '👤' }, 
  { id: 'abandoned', label: 'Abandoned', group: 'ENGINE_3', icon: '📦' },
  { id: 'removed', label: 'Removed', group: 'ENGINE_3', icon: '💨' },
  { id: 'fall', label: 'Fall', group: 'ENGINE_4', icon: '⚠️' },
  { id: 'crowd', label: 'Crowd', group: 'ENGINE_5', icon: '👨‍👩‍👦' },
  { id: 'acut_obj', label: 'Attr(Obj)', group: 'ENGINE_6', icon: '🔍', dependsOn: 'obj' },
  { id: 'acut_face', label: 'Attr(Face)', group: 'ENGINE_7', icon: '🆔', dependsOn: 'face' },  
  { id: 'Counting', label: 'Count', group: 'ENGINE_0', icon: '🔢' },  
  { id: 'Queue', label: 'Queue', group: 'ENGINE_0', icon: '👥' },  
  { id: 'Heatmap', label: 'Heatmap', group: 'ENGINE_0', icon: '🔥' },  
  { id: 'Social', label: 'Social Dist', group: 'ENGINE_0', icon: '↔️' },  
  { id: 'Mask', label: 'Mask Rule', group: 'ENGINE_0', icon: '😷' },  
];

// --- 3. Camera Type Definition ---
const CAMERA_TYPES = {
  'idla_pro': { 
    label: 'IDLA Pro IP-C', 
    allowedGroups: ['ENGINE_1', 'ENGINE_2', 'ENGINE_3', 'ENGINE_4', 'ENGINE_5', 'ENGINE_6', 'ENGINE_7'],
    maxConcurrentEngines: 7,
  },
  'idla_standard': { 
    label: 'IDLA IP-C', 
    allowedGroups: ['ENGINE_1', 'ENGINE_2'], 
    maxConcurrentEngines: 2,
  },
  'dv1304': { 
    label: 'DV-1304 1CH', 
    allowedGroups: ['ENGINE_0'], 
    maxConcurrentEngines: 0, 
  },
  'dv1304a': { 
    label: 'DV-1304-A 1CH', 
    allowedGroups: ['ENGINE_1', 'ENGINE_2'], 
    maxConcurrentEngines: 2,
  }
};

const App = () => {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [cameraGroups, setCameraGroups] = useState([
    { id: 1, name: "Site A", typeId: 'idla_pro', selectedFeatureIds: [], quantity: 1, isExpanded: true }
  ]);

  const currentNVRSpec = NVR_MODELS[selectedModelIndex].versions[selectedVersionIndex];

  const calculateUsage = (group) => {
    if (group.selectedFeatureIds.length === 0) return { units: 0, tp: 0, activeEnginesCount: 0 };
    
    const activeEngineGroups = new Set();
    group.selectedFeatureIds.forEach(id => {
      const feat = VA_FEATURES.find(f => f.id === id);
      if (feat && feat.group !== 'ENGINE_0') {
        activeEngineGroups.add(feat.group);
      }
    });

    const enginesCount = activeEngineGroups.size;
    const totalUnits = enginesCount * group.quantity;
    return { 
      units: totalUnits, 
      tp: totalUnits * 100, 
      activeEnginesCount: enginesCount 
    };
  };

  const totalUsedUnits = useMemo(() => cameraGroups.reduce((sum, g) => sum + calculateUsage(g).units, 0), [cameraGroups]);
  const totalUsedThroughput = totalUsedUnits * 100;
  
  const isOverloaded = totalUsedUnits > currentNVRSpec.units || totalUsedThroughput > currentNVRSpec.throughput;

  const addGroup = () => {
    const newId = cameraGroups.length > 0 ? Math.max(...cameraGroups.map(g => g.id)) + 1 : 1;
    setCameraGroups([...cameraGroups, { 
      id: newId, name: `Group ${newId}`, typeId: 'idla_pro', selectedFeatureIds: [], quantity: 1, isExpanded: true 
    }]);
  };

  const removeGroup = (id) => setCameraGroups(cameraGroups.filter(g => g.id !== id));
  const toggleExpand = (id) => setCameraGroups(cameraGroups.map(g => g.id === id ? { ...g, isExpanded: !g.isExpanded } : g));

  const updateGroup = (id, field, value) => {
    setCameraGroups(cameraGroups.map(g => {
      if (g.id !== id) return g;
      if (field === 'typeId') {
        const newType = CAMERA_TYPES[value];
        const validFeatures = g.selectedFeatureIds.filter(fId => {
          const feat = VA_FEATURES.find(f => f.id === fId);
          return feat && newType.allowedGroups.includes(feat.group);
        });
        return { ...g, typeId: value, selectedFeatureIds: validFeatures };
      }
      return { ...g, [field]: value };
    }));
  };

  const toggleFeature = (groupId, featureId) => {
    setCameraGroups(cameraGroups.map(g => {
      if (g.id !== groupId) return g;
      const config = CAMERA_TYPES[g.typeId];
      const isSelected = g.selectedFeatureIds.includes(featureId);
      
      let nextFeatures = [...g.selectedFeatureIds];

      if (isSelected) {
        nextFeatures = nextFeatures.filter(id => id !== featureId);
        if (featureId === 'obj') nextFeatures = nextFeatures.filter(id => id !== 'acut_obj');
        if (featureId === 'face') nextFeatures = nextFeatures.filter(id => id !== 'acut_face');
      } else {
        const featToAdding = VA_FEATURES.find(f => f.id === featureId);
        if (!featToAdding) return g;

        if (featToAdding.dependsOn && !nextFeatures.includes(featToAdding.dependsOn)) {
          nextFeatures.push(featToAdding.dependsOn);
        }
        nextFeatures.push(featureId);

        const tempGroups = new Set();
        nextFeatures.forEach(id => {
          const f = VA_FEATURES.find(feat => feat.id === id);
          if (f && f.group !== 'ENGINE_0') tempGroups.add(f.group);
        });

        if (tempGroups.size > config.maxConcurrentEngines) return g;
      }

      return { ...g, selectedFeatureIds: nextFeatures };
    }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 ${isOverloaded ? 'bg-red-50' : 'bg-slate-50'}`}>
      <style>{`
        @keyframes alert-pulse {
          0%, 100% { background-color: #ffffff; }
          50% { background-color: #fef2f2; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
        .animate-blink { animation: blink 0.8s ease-in-out infinite; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Dashboard */}
        <div className={`
          relative px-6 py-5 rounded-2xl shadow-xl border-2 transition-all duration-500 flex flex-wrap items-center justify-between gap-4
          ${isOverloaded 
            ? 'bg-white border-red-500 shadow-red-200 animate-[alert-pulse_2s_infinite]' 
            : 'bg-white border-slate-200 shadow-slate-100'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-500 ${isOverloaded ? 'bg-red-600 animate-shake' : 'bg-slate-900'}`}>
              {isOverloaded ? <AlertTriangle className="text-white w-6 h-6" /> : <ShieldCheck className="text-indigo-400 w-6 h-6" />}
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight leading-tight uppercase transition-colors ${isOverloaded ? 'text-red-600' : 'text-slate-800'}`}>
                VA Simulation {isOverloaded && <span className="text-sm font-black animate-blink ml-2">[OVERLOADED]</span>}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Performance Guide</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-6 px-5 py-2.5 rounded-xl border transition-all ${isOverloaded ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="text-right border-r border-slate-200 pr-6">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                <Activity className="w-2.5 h-2.5" /> TP Usage
              </div>
              <div className={`text-2xl font-black tabular-nums transition-all ${totalUsedThroughput > currentNVRSpec.throughput ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'text-slate-700'}`}>
                {totalUsedThroughput} <span className="text-xs opacity-40">/ {currentNVRSpec.throughput}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                <BarChart3 className="w-2.5 h-2.5" /> Total VA
              </div>
              <div className={`text-2xl font-black tabular-nums transition-all ${totalUsedUnits > currentNVRSpec.units ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'text-slate-700'}`}>
                {totalUsedUnits} <span className="text-xs opacity-40">/ {currentNVRSpec.units}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            {/* NVR Settings */}
            <div className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${isOverloaded ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-200'}`}>
              <h2 className="font-black text-[10px] text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest">
                <Settings className="w-3.5 h-3.5 text-indigo-500" /> NVR Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Selected Model</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => { setSelectedModelIndex(Number(e.target.value)); setSelectedVersionIndex(0); }}
                    value={selectedModelIndex}
                  >
                    {NVR_MODELS.map((item, idx) => <option key={idx} value={idx}>{item.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Firmware Version</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
                    value={selectedVersionIndex}
                  >
                    {NVR_MODELS[selectedModelIndex].versions.map((ver, idx) => <option key={idx} value={idx}>{ver.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[11px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <Video className="w-4 h-4 text-indigo-600" /> Camera Groups ({cameraGroups.length})
              </h2>
              <button 
                onClick={addGroup}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-200 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Group
              </button>
            </div>

            {cameraGroups.map((group) => {
              const usage = calculateUsage(group);
              const config = CAMERA_TYPES[group.typeId];

              return (
                <div key={group.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm transition-all overflow-hidden group-card hover:shadow-md">
                  <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-slate-50">
                    <button onClick={() => toggleExpand(group.id)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                      {group.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <input 
                      type="text" 
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                      className="font-black text-xs bg-transparent border-b border-transparent focus:border-indigo-300 outline-none w-32"
                    />
                    <select 
                      value={group.typeId}
                      onChange={(e) => updateGroup(group.id, 'typeId', e.target.value)}
                      className="bg-slate-50 rounded-lg px-2 py-1 text-[11px] font-black text-indigo-600 outline-none cursor-pointer hover:bg-indigo-50"
                    >
                      {Object.entries(CAMERA_TYPES).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
                    </select>
                    
                    <div className="hidden md:flex items-center gap-2 ml-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Qty</label>
                      <input 
                        type="number" 
                        min="1"
                        value={group.quantity}
                        onChange={(e) => updateGroup(group.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-12 bg-slate-50 border border-slate-100 rounded-lg py-1 text-center font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-indigo-600">{usage.units} VA Units</div>
                      </div>
                      <button onClick={() => removeGroup(group.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {group.isExpanded && (
                    <div className="p-4 bg-slate-50/30">
                      <div className="flex justify-between items-center mb-3">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Analytics Features</h3>
                         {config.maxConcurrentEngines > 0 && (
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${usage.activeEnginesCount >= config.maxConcurrentEngines ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                            Engines: {usage.activeEnginesCount} / {config.maxConcurrentEngines}
                          </span>
                         )}
                      </div>
                      
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                        {VA_FEATURES.map(feat => {
                          const isAllowed = config.allowedGroups.includes(feat.group);
                          const isSelected = group.selectedFeatureIds.includes(feat.id);
                          if (!isAllowed) return null;

                          return (
                            <button
                              key={feat.id}
                              onClick={() => toggleFeature(group.id, feat.id)}
                              className={`
                                relative p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-90
                                ${isSelected 
                                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-50' 
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                }
                              `}
                            >
                              <span className={`text-xl transition-all ${isSelected ? 'scale-110 opacity-100' : 'opacity-40 grayscale'}`}>{feat.icon}</span>
                              <span className={`text-[9px] font-black text-center truncate w-full ${isSelected ? 'text-indigo-900' : 'text-slate-400'}`}>
                                {feat.label}
                              </span>
                              {isSelected && (
                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border border-white shadow-sm">
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

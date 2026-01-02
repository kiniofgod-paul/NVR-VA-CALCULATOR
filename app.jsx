import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Settings, 
  Video, 
  Activity,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

const NVR_MODELS = [
    { model: "DR-8564 / 8564D", versions: [{ label: "v9.1.0 or Higher", units: 32 }, { label: "Below v9.0.0", units: 64 }] },
    { model: "DR-8532 / 8532D", versions: [{ label: "v9.1.0 or Higher", units: 16 }, { label: "Below v9.0.0", units: 32 }] },
    { model: "DR-8516", versions: [{ label: "v9.1.0 or Higher", units: 16 }, { label: "Below v9.0.0", units: 16 }] },
    { model: "DR-6532P / -A", versions: [{ label: "v9.1.0 or Higher", units: 16 }, { label: "Below v9.0.0", units: 32 }] },
    { model: "DR-6516P / -A", versions: [{ label: "v9.1.0 or Higher", units: 16 }, { label: "Below v9.0.0", units: 16 }] },
    { model: "DR-6508P", versions: [{ label: "v9.1.0 or Higher", units: 16 }, { label: "Below v9.0.0", units: 8 }] },
    { model: "DR-2516P / -A", versions: [{ label: "v9.1.0 or Higher", units: 8 }, { label: "Below v9.0.0", units: 16 }] },
    { model: "DR-2508P / -A", versions: [{ label: "v9.1.0 or Higher", units: 8 }, { label: "Below v9.0.0", units: 8 }] },
    { model: "DR-2504P / -A", versions: [{ label: "v9.1.0 or Higher", units: 8 }, { label: "Below v9.0.0", units: 4 }] }
];

const VA_FEATURES = [
    { id: 'obj', label: 'Object Detection', group: 'ENGINE_1', icon: '🎯' },
    { id: 'intrusion', label: 'Intrusion Detection', group: 'ENGINE_1', icon: '🚧' },
    { id: 'loitering', label: 'Loitering Detection', group: 'ENGINE_1', icon: '⏳' },
    { id: 'line', label: 'Line Crossing', group: 'ENGINE_1', icon: '➖' },
    { id: 'face', label: 'Face Detection', group: 'ENGINE_2', icon: '👤' },
    { id: 'abandoned', label: 'Abandoned Object', group: 'ENGINE_3', icon: '📦' },
    { id: 'removed', label: 'Removed Object', group: 'ENGINE_3', icon: '💨' },
    { id: 'fall', label: 'Fall Detection', group: 'ENGINE_4', icon: '⚠️' },
    { id: 'crowd', label: 'Crowd Detection', group: 'ENGINE_5', icon: '👨‍👩‍👦' },
    { id: 'acut_obj', label: 'Attribute (Object)', group: 'ENGINE_6', icon: '🔍', dependsOn: 'ENGINE_1' },
    { id: 'acut_face', label: 'Attribute (Face)', group: 'ENGINE_7', icon: '🆔', dependsOn: 'ENGINE_2' },
    { id: 'Counting', label: 'People Counting', group: 'ENGINE_0', icon: '🔢' },
    { id: 'Queue', label: 'Queue Management', group: 'ENGINE_0', icon: '👥' },
    { id: 'Heatmap', label: 'Heatmap ', group: 'ENGINE_0', icon: '🔥' },
    { id: 'SocialDist', label: 'Social Distancing Violation', group: 'ENGINE_0', icon: '📏' },
    { id: 'MaskRule', label: 'Mask Rule Violation', group: 'ENGINE_0', icon: '😷' }
];

const CAMERA_TYPES = {
    'idla_standard': { label: 'IDLA IP-C', allowedGroups: ['ENGINE_1', 'ENGINE_2'], maxConcurrentEngines: 2 },
    'idla_pro': { label: 'IDLA Pro IP-C', allowedGroups: ['ENGINE_1', 'ENGINE_2', 'ENGINE_3', 'ENGINE_4', 'ENGINE_5', 'ENGINE_6', 'ENGINE_7'], maxConcurrentEngines: 7, minFw: "v9.1.0+" },
    'dv1304': { label: 'DV-1304', allowedGroups: ['ENGINE_0'], maxConcurrentEngines: 0 },
    'dv1304a': { label: 'DV-1304-A', allowedGroups: ['ENGINE_1', 'ENGINE_2'], maxConcurrentEngines: 2 }
};

export default function App() {
    const [selectedModelIdx, setSelectedModelIdx] = useState(0);
    const [selectedVerIdx, setSelectedVerIdx] = useState(0); 
    const [cameraGroups, setCameraGroups] = useState([
        { id: 1, name: "CH Group 1", typeId: 'idla_standard', selectedFeatureIds: [], quantity: 1 }
    ]);
    const [hoveredFeature, setHoveredFeature] = useState(null);

    const currentNVR = NVR_MODELS[selectedModelIdx].versions[selectedVerIdx];
    const isOldFirmware = currentNVR.label === "Below v9.0.0";

    useEffect(() => {
        if (isOldFirmware) {
            setCameraGroups(prev => prev.map(g => 
                g.typeId === 'idla_pro' ? { ...g, typeId: 'idla_standard', selectedFeatureIds: [] } : g
            ));
        }
    }, [isOldFirmware]);

    const calculateUsage = (group) => {
        const activeEngineGroups = new Set();
        group.selectedFeatureIds.forEach(id => {
            const feat = VA_FEATURES.find(f => f.id === id);
            if (feat && feat.group !== 'ENGINE_0') activeEngineGroups.add(feat.group);
        });
        return { units: activeEngineGroups.size * group.quantity, enginesCount: activeEngineGroups.size };
    };

    const totals = useMemo(() => {
        return cameraGroups.reduce((acc, g) => {
            const usage = calculateUsage(g);
            acc.units += usage.units;
            return acc;
        }, { units: 0 });
    }, [cameraGroups]);

    const usagePercent = Math.round((totals.units / currentNVR.units) * 100);
    const isOverloaded = totals.units > currentNVR.units;

    const addGroup = () => {
        setCameraGroups([...cameraGroups, { 
            id: Date.now(), 
            name: `CH Group ${cameraGroups.length + 1}`, 
            typeId: 'idla_standard', 
            selectedFeatureIds: [], 
            quantity: 1 
        }]);
    };

    const updateGroup = (id, field, value) => {
        setCameraGroups(cameraGroups.map(g => (g.id === id ? { ...g, [field]: value, selectedFeatureIds: field === 'typeId' ? [] : g.selectedFeatureIds } : g)));
    };

    const toggleFeature = (groupId, featureId) => {
        setCameraGroups(cameraGroups.map(g => {
            if (g.id !== groupId) return g;
            const config = CAMERA_TYPES[g.typeId];
            const isSelected = g.selectedFeatureIds.includes(featureId);
            let next = [...g.selectedFeatureIds];

            if (isSelected) {
                next = next.filter(id => id !== featureId);
                const remainingFeats = VA_FEATURES.filter(f => next.includes(f.id));
                const hasE1 = remainingFeats.some(f => f.group === 'ENGINE_1');
                const hasE2 = remainingFeats.some(f => f.group === 'ENGINE_2');
                
                if (!hasE1) next = next.filter(id => VA_FEATURES.find(f => f.id === id).group !== 'ENGINE_6');
                if (!hasE2) next = next.filter(id => VA_FEATURES.find(f => f.id === id).group !== 'ENGINE_7');
            } else {
                const featToEnable = VA_FEATURES.find(f => f.id === featureId);
                if (featToEnable.dependsOn) {
                    const hasDependency = g.selectedFeatureIds.some(id => VA_FEATURES.find(f => f.id === id).group === featToEnable.dependsOn);
                    if (!hasDependency) return g; 
                }

                next.push(featureId);
                const tempEngines = new Set();
                next.forEach(id => {
                    const f = VA_FEATURES.find(x => x.id === id);
                    if (f && f.group !== 'ENGINE_0') tempEngines.add(f.group);
                });
                if (tempEngines.size > config.maxConcurrentEngines && config.maxConcurrentEngines > 0) return g; 
            }
            return { ...g, selectedFeatureIds: next };
        }));
    };

    const renderFeatureBtn = (feat, group, config) => {
        const isSelected = group.selectedFeatureIds.includes(feat.id);
        let isLocked = false;
        if (feat.dependsOn) {
            isLocked = !group.selectedFeatureIds.some(id => VA_FEATURES.find(f => f.id === id).group === feat.dependsOn);
        }

        const isHovered = hoveredFeature?.id === feat.id && hoveredFeature?.groupId === group.id;

        return (
            <div className="relative group/btn flex-1 min-w-[64px]" key={feat.id}>
                <button 
                    onMouseEnter={() => setHoveredFeature({ id: feat.id, groupId: group.id })}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onClick={() => !isLocked && toggleFeature(group.id, feat.id)}
                    disabled={isLocked}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all w-full h-full
                        ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm scale-[1.02]' : 
                          isLocked ? 'border-slate-50 bg-slate-50/50 cursor-not-allowed opacity-30' : 
                          'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <span className={`text-base ${isSelected ? '' : 'grayscale opacity-30'}`}>{feat.icon}</span>
                    <span className="text-[8px] font-black text-center truncate w-full uppercase leading-tight">
                        {feat.label}
                    </span>
                    {isLocked && <div className="text-[6px] text-red-400 font-bold uppercase">Locked</div>}
                </button>

                {/* 툴팁 구현 */}
                {isHovered && (
                    <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none">
                        <div className="bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-200">
                            {feat.label}
                            {isLocked && <span className="text-red-300 ml-2">(Requires {feat.dependsOn === 'ENGINE_1' ? 'Object' : 'Face'} Engine)</span>}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${isOverloaded ? 'bg-red-50' : 'bg-slate-50/50'}`}>
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                
                {/* 상단 헤더 */}
                <header className={`mb-6 px-6 py-5 rounded-3xl border transition-all duration-500 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 
                    ${isOverloaded 
                        ? 'bg-white border-red-500 ring-4 ring-red-100' 
                        : 'bg-white border-slate-100'}`}>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`p-3 rounded-2xl shadow-inner flex items-center justify-center transition-colors duration-500
                            ${isOverloaded ? 'bg-red-500 text-white animate-bounce' : 'bg-indigo-600 text-white'}`}>
                            {isOverloaded ? <AlertTriangle className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight leading-none ${isOverloaded ? 'text-red-600' : 'text-slate-900'}`}>
                                IDIS DirectIP NVR VA Resource Calculator
                            </h1>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                                {NVR_MODELS[selectedModelIdx].model}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-lg">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Load Status</span>
                                <span className={`text-sm font-black ${isOverloaded ? 'text-red-500' : 'text-slate-700'}`}>
                                    {isOverloaded ? 'CRITICAL OVERLOAD' : 'SYSTEM OPTIMIZED'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className={`text-lg font-black tabular-nums ${isOverloaded ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {totals.units} <span className="text-xs text-slate-400 font-bold">/ {currentNVR.units} Units</span>
                                </span>
                            </div>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200/50 relative">
                            <div className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm relative z-10 
                                ${isOverloaded ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`}
                                 style={{ width: `${Math.min((totals.units / currentNVR.units) * 100, 100)}%` }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="text-center">
                            <div className={`text-3xl font-black tabular-nums leading-none ${isOverloaded ? 'text-red-600' : 'text-emerald-500'}`}>
                                {usagePercent}%
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Resource Used</p>
                        </div>
                        <div className={`p-2 rounded-full ${isOverloaded ? 'text-red-500 bg-red-100' : 'text-emerald-500 bg-emerald-100'}`}>
                            {isOverloaded ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    <aside className="col-span-12 lg:col-span-3 space-y-4">
                        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
                                <Settings className="w-4 h-4 text-slate-400" />
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Config</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 px-1 uppercase tracking-wider">NVR Model</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                                        value={selectedModelIdx} onChange={e => { setSelectedModelIdx(Number(e.target.value))}}>
                                        {NVR_MODELS.map((m, idx) => <option key={idx} value={idx}>{m.model}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 px-1 uppercase tracking-wider">Firmware Version</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                                        value={selectedVerIdx} onChange={e => setSelectedVerIdx(Number(e.target.value))}>
                                        {NVR_MODELS[selectedModelIdx].versions.map((v, idx) => <option key={idx} value={idx}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>
                        <button onClick={addGroup} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95 group">
                            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Camera Group
                        </button>
                    </aside>

                    <main className="col-span-12 lg:col-span-9 space-y-4">
                        {cameraGroups.length === 0 && (
                            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-xs">No cameras added. Click the button on the left to start.</p>
                            </div>
                        )}
                        {cameraGroups.map(group => {
                            const usage = calculateUsage(group);
                            const config = CAMERA_TYPES[group.typeId];
                            
                            const line1 = VA_FEATURES.filter(f => config.allowedGroups.includes(f.group) && ['ENGINE_1', 'ENGINE_2', 'ENGINE_0'].includes(f.group));
                            const line2 = VA_FEATURES.filter(f => config.allowedGroups.includes(f.group) && !['ENGINE_1', 'ENGINE_2', 'ENGINE_0'].includes(f.group));

                            return (
                                <article key={group.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all">
                                    <div className="w-full md:w-64 bg-slate-50/50 p-5 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4 group/title">
                                                <Video className="w-4 h-4 text-indigo-500" />
                                                <input type="text" value={group.name} onChange={e => updateGroup(group.id, 'name', e.target.value)}
                                                    className="bg-transparent font-black text-sm text-slate-800 outline-none w-full border-b border-transparent focus:border-indigo-300 transition-all" />
                                            </div>
                                            <div className="flex flex-col gap-3 mb-4">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Device Type</span>
                                                    <select value={group.typeId} onChange={e => updateGroup(group.id, 'typeId', e.target.value)}
                                                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-indigo-600 outline-none hover:border-indigo-200 transition-all">
                                                        {Object.entries(CAMERA_TYPES).map(([id, t]) => {
                                                            const isDisabled = t.minFw === "v9.1.0+" && isOldFirmware;
                                                            return <option key={id} value={id} disabled={isDisabled}>{t.label} {isDisabled ? '(v9.1+ Only)' : ''}</option>
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Device Quantity</span>
                                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 focus-within:border-indigo-300 transition-all">
                                                        <input type="number" min="1" value={group.quantity} onChange={e => updateGroup(group.id, 'quantity', parseInt(e.target.value) || 1)}
                                                            className="w-full text-right font-black text-sm text-indigo-600 bg-transparent outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setCameraGroups(cameraGroups.filter(g => g.id !== group.id))} 
                                            className="text-[10px] font-bold text-slate-300 hover:text-red-500 flex items-center justify-center gap-1.5 transition-colors py-2 border border-transparent hover:border-red-50 rounded-xl">
                                            <Trash2 className="w-3.5 h-3.5" /> Remove CH Group
                                        </button>
                                    </div>

                                    <div className="flex-1 p-5 bg-white flex flex-col gap-4">
                                        <div>
                                            <h3 className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-indigo-500"></div> 
                                                Standard & BI Engines
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {line1.map(feat => renderFeatureBtn(feat, group, config))}
                                            </div>
                                        </div>
                                        
                                        {line2.length > 0 && (
                                            <div>
                                                <h3 className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                                    Advanced AI Engines
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {line2.map(feat => renderFeatureBtn(feat, group, config))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-slate-50 border-dashed">
                                            <div className="text-[10px] font-black text-slate-600 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md ${usage.enginesCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {usage.enginesCount} Engines
                                                </span>
                                                <span className="text-slate-300">/</span>
                                                <span className="text-slate-400 uppercase tracking-tighter">Limit: {config.maxConcurrentEngines || 'None'}</span>
                                            </div>
                                            <div className="text-[10px] font-black text-indigo-600">
                                                +{usage.units} Units
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </main>
                </div>
            </div>
        </div>
    );
}

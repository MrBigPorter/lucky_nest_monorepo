
import React, { useState } from 'react';
import { Gift, Edit2, Trash2, Plus, Save, LayoutTemplate, Settings, X, ChevronLeft, GripVertical } from 'lucide-react';
import { Card, Button, Input, Select, Badge, Modal, DragHandle } from '../components/UIComponents';
import { MOCK_LOTTERY_ACTIVITIES, MOCK_PRODUCTS, MOCK_COUPONS } from '../constants';
import { useMockData } from '../hooks/useMockData';
import { LotteryActivity, ActivityPrize } from '../types';

export const ActivityConfig: React.FC = () => {
  const { data: activities, add, remove, update } = useMockData<LotteryActivity>(MOCK_LOTTERY_ACTIVITIES);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [currentActivity, setCurrentActivity] = useState<Partial<LotteryActivity>>({});
  const [activeStep, setActiveStep] = useState(1);

  // DnD States
  const [draggedActivityIndex, setDraggedActivityIndex] = useState<number | null>(null);
  const [draggedPrizeIndex, setDraggedPrizeIndex] = useState<number | null>(null);

  // --- HANDLERS ---
  const handleEdit = (activity: LotteryActivity) => {
    setCurrentActivity(JSON.parse(JSON.stringify(activity))); // Deep copy
    setActiveStep(1);
    setView('builder');
  };

  const handleCreate = () => {
    setCurrentActivity({
      name: 'New Activity',
      status: 'draft',
      template: 'wheel',
      prizes: [],
      rules: { costType: 'free', costAmount: 0, dailyLimit: 0, totalLimit: 0, minVipLevel: 0 },
      sortOrder: activities.length + 1
    });
    setActiveStep(1);
    setView('builder');
  };

  const handleSaveActivity = () => {
    if (currentActivity.id) {
        update(currentActivity.id, currentActivity);
    } else {
        add({ ...currentActivity, id: Date.now().toString() } as LotteryActivity);
    }
    setView('list');
  };

  const updatePrize = (index: number, field: keyof ActivityPrize, value: any) => {
      const newPrizes = [...(currentActivity.prizes || [])];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      setCurrentActivity({ ...currentActivity, prizes: newPrizes });
  };

  const removePrize = (index: number) => {
      const newPrizes = (currentActivity.prizes || []).filter((_, i) => i !== index);
      setCurrentActivity({ ...currentActivity, prizes: newPrizes });
  };

  const addPrize = () => {
      const newPrize: ActivityPrize = {
          id: Date.now().toString(),
          type: 'empty',
          name: 'Thanks',
          image: '',
          probability: 0,
          stock: 9999,
          displayIndex: (currentActivity.prizes?.length || 0) + 1,
          sortOrder: (currentActivity.prizes?.length || 0) + 1
      };
      setCurrentActivity({ ...currentActivity, prizes: [...(currentActivity.prizes || []), newPrize] });
  };

  // Activity DnD
  const handleActivityDrop = (index: number) => {
    if (draggedActivityIndex === null || draggedActivityIndex === index) return;
    const newActivities = [...activities];
    const item = newActivities[draggedActivityIndex];
    newActivities.splice(draggedActivityIndex, 1);
    newActivities.splice(index, 0, item);
    newActivities.forEach((a, i) => update(a.id, { sortOrder: i + 1 }));
    setDraggedActivityIndex(null);
  };

  // Prize DnD
  const handlePrizeDrop = (index: number) => {
    if (draggedPrizeIndex === null || draggedPrizeIndex === index) return;
    const newPrizes = [...(currentActivity.prizes || [])];
    const item = newPrizes[draggedPrizeIndex];
    newPrizes.splice(draggedPrizeIndex, 1);
    newPrizes.splice(index, 0, item);
    // Update sort orders
    newPrizes.forEach((p, i) => { p.sortOrder = i + 1; p.displayIndex = i + 1; });
    setCurrentActivity({ ...currentActivity, prizes: newPrizes });
    setDraggedPrizeIndex(null);
  };

  // --- RENDERERS ---

  if (view === 'list') {
    const sortedActivities = [...activities].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Configuration</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage lucky draws, wheels, and mystery boxes</p>
          </div>
          <Button onClick={handleCreate}>
             <Plus size={18} /> Create Activity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {sortedActivities.map((act, index) => (
             <div 
                key={act.id} 
                draggable
                onDragStart={() => setDraggedActivityIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleActivityDrop(index)}
             >
                <Card className={`group relative overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary-500 cursor-move ${draggedActivityIndex === index ? 'opacity-50' : ''}`}>
                    <div className="aspect-[2/1] bg-gray-100 dark:bg-black/20 mb-4 rounded-lg overflow-hidden relative">
                    <img src={act.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2">
                        <Badge color={act.status === 'active' ? 'green' : act.status === 'draft' ? 'yellow' : 'gray'}>
                            {act.status.toUpperCase()}
                        </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center gap-1">
                        <LayoutTemplate size={12} /> {act.template.toUpperCase()}
                    </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <DragHandle />
                        {act.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">{act.startTime} - {act.endTime}</p>
                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                    <div className="text-xs text-gray-500">
                        <strong>{act.prizes.length}</strong> Prizes Configured
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(act)}><Edit2 size={16} /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => remove(act.id)}><Trash2 size={16} /></Button>
                    </div>
                    </div>
                </Card>
             </div>
           ))}
        </div>
      </div>
    );
  }

  // --- BUILDER VIEW ---

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
       {/* Builder Header */}
       <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-gray-500" />
             </button>
             <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Builder</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                   <span>{currentActivity.name}</span>
                   <span className="text-gray-300 dark:text-gray-600">•</span>
                   <span className="uppercase">{currentActivity.template}</span>
                </div>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
             <Button onClick={handleSaveActivity}><Save size={18} /> Save & Exit</Button>
          </div>
       </div>

       {/* Stepper */}
       <div className="flex justify-center mb-8">
          <div className="flex items-center">
             {[
                { id: 1, label: 'Basic Info', icon: <LayoutTemplate size={18} /> },
                { id: 2, label: 'Prize Pool', icon: <Gift size={18} /> },
                { id: 3, label: 'Rules', icon: <Settings size={18} /> }
             ].map((step, idx) => (
                <div key={step.id} className="flex items-center">
                   <div 
                      onClick={() => setActiveStep(step.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${activeStep === step.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                   >
                      {step.icon}
                      <span className="font-medium">{step.label}</span>
                   </div>
                   {idx < 2 && <div className="w-12 h-px bg-gray-200 dark:bg-white/10 mx-2" />}
                </div>
             ))}
          </div>
       </div>

       {/* Step Content */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {/* STEP 1: BASIC */}
          {activeStep === 1 && (
             <div className="max-w-2xl mx-auto space-y-6">
                <Card title="Activity Details">
                   <div className="space-y-4">
                      <Input 
                         label="Activity Name" 
                         value={currentActivity.name} 
                         onChange={e => setCurrentActivity({...currentActivity, name: e.target.value})} 
                      />
                      <div className="grid grid-cols-2 gap-4">
                         <Select 
                            label="Template Type"
                            value={currentActivity.template}
                            onChange={e => setCurrentActivity({...currentActivity, template: e.target.value as any})}
                            options={[
                               {label: 'Lucky Wheel', value: 'wheel'},
                               {label: 'Mystery Box', value: 'box'},
                               {label: '9-Grid', value: 'grid'}
                            ]}
                         />
                         <Select 
                            label="Status"
                            value={currentActivity.status}
                            onChange={e => setCurrentActivity({...currentActivity, status: e.target.value as any})}
                            options={[
                               {label: 'Draft', value: 'draft'},
                               {label: 'Active', value: 'active'},
                               {label: 'Ended', value: 'ended'}
                            ]}
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <Input label="Start Time" type="date" value={currentActivity.startTime} onChange={e => setCurrentActivity({...currentActivity, startTime: e.target.value})} />
                         <Input label="End Time" type="date" value={currentActivity.endTime} onChange={e => setCurrentActivity({...currentActivity, endTime: e.target.value})} />
                      </div>
                      <Input label="Cover Image URL" value={currentActivity.coverImage} onChange={e => setCurrentActivity({...currentActivity, coverImage: e.target.value})} />
                   </div>
                </Card>
             </div>
          )}

          {/* STEP 2: PRIZE POOL */}
          {activeStep === 2 && (
             <div className="max-w-4xl mx-auto">
                <Card title="Prize Configuration" action={<Button size="sm" onClick={addPrize}><Plus size={16}/> Add Prize</Button>}>
                   <div className="space-y-4">
                      {currentActivity.prizes?.map((prize, idx) => (
                         <div 
                            key={idx} 
                            className={`p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-start relative group transition-all ${draggedPrizeIndex === idx ? 'opacity-50 border-primary-500' : ''}`}
                            draggable
                            onDragStart={() => setDraggedPrizeIndex(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handlePrizeDrop(idx)}
                         >
                            {/* Drag Handle */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move p-2 text-gray-300 hover:text-gray-500">
                                <GripVertical size={16} />
                            </div>

                            <button onClick={() => removePrize(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                            
                            <div className="w-full md:w-auto flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 pl-6">
                               <div className="md:col-span-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Prize Type</label>
                                  <Select 
                                     value={prize.type} 
                                     onChange={e => updatePrize(idx, 'type', e.target.value)}
                                     options={[
                                        {label: 'Product', value: 'product'},
                                        {label: 'Coupon', value: 'coupon'},
                                        {label: 'Coins', value: 'coin'},
                                        {label: 'Balance', value: 'balance'},
                                        {label: 'Empty', value: 'empty'}
                                     ]}
                                  />
                               </div>
                               
                               <div className="md:col-span-2">
                                  <label className="text-xs text-gray-500 mb-1 block">Value / Reference</label>
                                  {prize.type === 'product' ? (
                                     <Select 
                                        value={prize.value}
                                        onChange={e => {
                                            const prod = MOCK_PRODUCTS.find(p => p.id === e.target.value);
                                            updatePrize(idx, 'value', e.target.value);
                                            // Smart Link: Auto-fill name and image
                                            if (prod) {
                                                updatePrize(idx, 'name', prod.name);
                                                updatePrize(idx, 'image', prod.image);
                                            }
                                        }}
                                        options={[{label: 'Select Product...', value: ''}, ...MOCK_PRODUCTS.map(p => ({label: p.name, value: p.id}))]}
                                     />
                                  ) : prize.type === 'coupon' ? (
                                     <Select 
                                        value={prize.value}
                                        onChange={e => {
                                            const coupon = MOCK_COUPONS.find(c => c.id === e.target.value);
                                            updatePrize(idx, 'value', e.target.value);
                                            if (coupon) {
                                                updatePrize(idx, 'name', `${coupon.code} (-${coupon.discount})`);
                                            }
                                        }}
                                        options={[{label: 'Select Coupon...', value: ''}, ...MOCK_COUPONS.map(c => ({label: c.code, value: c.id}))]}
                                     />
                                  ) : (
                                     <Input 
                                        placeholder={prize.type === 'empty' ? 'Message' : 'Amount'} 
                                        value={prize.type === 'empty' ? prize.name : (prize.value as string)} 
                                        onChange={e => {
                                            if (prize.type === 'empty') updatePrize(idx, 'name', e.target.value);
                                            else updatePrize(idx, 'value', e.target.value);
                                        }} 
                                     />
                                  )}
                               </div>

                               <div className="md:col-span-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Image URL</label>
                                  <Input value={prize.image} onChange={e => updatePrize(idx, 'image', e.target.value)} placeholder="http://..." />
                               </div>
                            </div>

                            <div className="w-full md:w-48 grid grid-cols-2 gap-4 border-l border-gray-200 dark:border-white/10 pl-4">
                               <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Prob. (%)</label>
                                  <Input type="number" value={prize.probability} onChange={e => updatePrize(idx, 'probability', Number(e.target.value))} />
                               </div>
                               <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                                  <Input type="number" value={prize.stock} onChange={e => updatePrize(idx, 'stock', Number(e.target.value))} />
                               </div>
                            </div>
                         </div>
                      ))}
                      
                      {(!currentActivity.prizes || currentActivity.prizes.length === 0) && (
                         <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                            No prizes configured. Add one to start.
                         </div>
                      )}
                      
                      <div className="flex justify-end text-sm text-gray-500">
                         Total Probability: <span className={`font-bold ml-1 ${(currentActivity.prizes?.reduce((acc, p) => acc + p.probability, 0) || 0) === 100 ? 'text-green-500' : 'text-red-500'}`}>
                            {currentActivity.prizes?.reduce((acc, p) => acc + p.probability, 0) || 0}%
                         </span>
                      </div>
                   </div>
                </Card>
             </div>
          )}

          {/* STEP 3: RULES */}
          {activeStep === 3 && (
             <div className="max-w-2xl mx-auto space-y-6">
                <Card title="Participation Rules">
                   <div className="space-y-6">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Entry Cost</label>
                         <div className="grid grid-cols-3 gap-4">
                            {['free', 'coin', 'balance'].map(type => (
                               <div 
                                  key={type}
                                  onClick={() => setCurrentActivity({...currentActivity, rules: {...currentActivity.rules!, costType: type as any}})}
                                  className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${currentActivity.rules?.costType === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                               >
                                  <span className="capitalize font-bold">{type}</span>
                               </div>
                            ))}
                         </div>
                         {currentActivity.rules?.costType !== 'free' && (
                            <div className="mt-4">
                               <Input 
                                  label={`Cost Amount (${currentActivity.rules?.costType === 'coin' ? 'Coins' : '$'})`}
                                  type="number"
                                  value={currentActivity.rules?.costAmount}
                                  onChange={e => setCurrentActivity({...currentActivity, rules: {...currentActivity.rules!, costAmount: Number(e.target.value)}})}
                               />
                            </div>
                         )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Daily Limit (Times)"
                            type="number"
                            value={currentActivity.rules?.dailyLimit}
                            onChange={e => setCurrentActivity({...currentActivity, rules: {...currentActivity.rules!, dailyLimit: Number(e.target.value)}})}
                            placeholder="0 for unlimited"
                         />
                         <Input 
                            label="Total Limit (Times)"
                            type="number"
                            value={currentActivity.rules?.totalLimit}
                            onChange={e => setCurrentActivity({...currentActivity, rules: {...currentActivity.rules!, totalLimit: Number(e.target.value)}})}
                            placeholder="0 for unlimited"
                         />
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                         <Select 
                            label="Minimum VIP Level"
                            value={currentActivity.rules?.minVipLevel}
                            onChange={e => setCurrentActivity({...currentActivity, rules: {...currentActivity.rules!, minVipLevel: Number(e.target.value)}})}
                            options={[
                               {label: 'No Requirement (VIP 0)', value: 0},
                               {label: 'VIP 1', value: 1},
                               {label: 'VIP 2', value: 2},
                               {label: 'VIP 3', value: 3},
                               {label: 'VIP 4', value: 4}
                            ]}
                         />
                      </div>
                   </div>
                </Card>
             </div>
          )}
       </div>
    </div>
  );
};

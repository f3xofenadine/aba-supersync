/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button, Input } from './ui';
import { 
  CheckCircle2, 
  User, 
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { cn, calculateDuration, formatMinutes } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { TASK_LIST_DESCRIPTIONS, TASK_LIST_AREAS } from '../data/taskList';

export const SupervisionForm = () => {
  const { currentUser, users, associations, saveSession } = useApp();
  const navigate = useNavigate();
  const isRBT = currentUser?.role === 'RBT';
  const isBCBA = currentUser?.role === 'BCBA' || currentUser?.role === 'BCBA-D';
  const [step, setStep] = React.useState(1);
  const [infoItem, setInfoItem] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    partnerId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    isDirectObservation: false,
    contactType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'GROUP',
    taskListItems: [] as string[],
    clinicalStrengths: '',
    growthOpportunities: '',
    rbtQuestions: '',
    additionalNotes: '',
    privateNotes: '',
  });

  if (!currentUser) return null;

  const connectedUsers = associations
    .filter(a => a.status === 'ACCEPTED' && (a.rbtId === currentUser.id || a.bcbaId === currentUser.id))
    .map(a => {
      const partnerId = a.rbtId === currentUser.id ? a.bcbaId : a.rbtId;
      const partner = users.find(u => u.id === partnerId);
      
      // Safety check: only allow partners with complementary roles
      if (!partner) return null;
      if (isRBT && (partner.role !== 'BCBA' && partner.role !== 'BCBA-D')) return null;
      if (isBCBA && partner.role !== 'RBT') return null;
      
      return partner;
    })
    .filter(Boolean);

  const duration = calculateDuration(formData.startTime, formData.endTime);

  const toggleTask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      taskListItems: prev.taskListItems.includes(id)
        ? prev.taskListItems.filter(t => t !== id)
        : [...prev.taskListItems, id]
    }));
  };

  const handleFinish = () => {
    saveSession({
      ...formData,
      rbtId: isRBT ? currentUser.id : formData.partnerId,
      bcbaId: isBCBA ? currentUser.id : formData.partnerId,
      durationMinutes: duration,
      supervisedHours: duration / 60,
      status: isRBT ? 'SIGNED_BY_RBT' : 'SIGNED_BY_BCBA',
    });
    navigate('/history');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!currentUser.signature && (
        <SignatureNotice />
      )}
      
      <FormHeader step={step} />

      <div className="relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepOne 
              formData={formData} 
              setFormData={setFormData} 
              connectedUsers={connectedUsers} 
              duration={duration} 
              onNext={() => setStep(2)} 
            />
          )}

          {step === 2 && (
            <StepTwo 
              formData={formData} 
              toggleTask={toggleTask} 
              infoItem={infoItem} 
              setInfoItem={setInfoItem} 
              onBack={() => setStep(1)} 
              onNext={() => setStep(3)} 
            />
          )}

          {step === 3 && (
            <StepThree 
              formData={formData} 
              setFormData={setFormData} 
              isRBT={isRBT} 
              isBCBA={isBCBA} 
              onBack={() => setStep(2)} 
              onFinish={handleFinish} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-components (Internal to this file for cleaner main component) ---

const SignatureNotice = () => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-center justify-between gap-4"
  >
    <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium">You haven't set your professional signature yet. Please set it in the sidebar to sign records.</p>
    </div>
  </motion.div>
);

const FormHeader = ({ step }: { step: number }) => (
  <header className="flex items-center justify-between">
    <div>
       <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Log Supervision Record</h1>
       <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Record a clinical supervision session for BACB compliance.</p>
    </div>
    <div className="flex items-center gap-1">
       {[1, 2, 3].map(s => (
         <div key={s} className={cn(
           "w-8 h-1 rounded-full",
           s <= step ? "bg-indigo-600" : "bg-gray-200 shadow-inner"
         )} />
       ))}
    </div>
  </header>
);

const StepOne = ({ formData, setFormData, connectedUsers, duration, onNext }: any) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <Card className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors">Supervision Partner</label>
          <div className="relative">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
             <select 
               value={formData.partnerId}
               onChange={e => setFormData({ ...formData, partnerId: e.target.value })}
               className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-colors"
             >
               <option value="">Select a partner...</option>
               {connectedUsers.map((u: any) => u && (
                 <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
               ))}
             </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors">Session Date</label>
          <Input 
            type="date" 
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors">Time Window</label>
          <div className="flex items-center gap-3">
             <Input 
              type="time" 
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
             />
             <span className="text-gray-400 dark:text-gray-600 font-bold transition-colors">to</span>
             <Input 
              type="time" 
              value={formData.endTime}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
             />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors">Duration</label>
             <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded transition-colors">
               {formatMinutes(duration)}
             </span>
          </div>
          <div className="flex gap-2">
             <button
               type="button"
               onClick={() => setFormData({ ...formData, contactType: 'INDIVIDUAL' })}
               className={cn(
                 "flex-1 p-3 rounded-lg border text-sm font-bold transition-all",
                 formData.contactType === 'INDIVIDUAL' 
                  ? "border-teal-600 dark:border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 shadow-sm" 
                  : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
               )}
             >
               Individual
             </button>
             <button
               type="button"
               onClick={() => setFormData({ ...formData, contactType: 'GROUP' })}
               className={cn(
                 "flex-1 p-3 rounded-lg border text-sm font-bold transition-all",
                 formData.contactType === 'GROUP' 
                  ? "border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm" 
                  : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
               )}
             >
               Group
             </button>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
        <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-900/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all">
          <div className={cn(
            "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
            formData.isDirectObservation ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500" : "border-gray-300 dark:border-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500"
          )}>
             {formData.isDirectObservation && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="hidden"
            checked={formData.isDirectObservation}
            onChange={e => setFormData({ ...formData, isDirectObservation: e.target.checked })}
          />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Direct Observation of Client Service</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required for BACB monthly compliance</p>
          </div>
        </label>
      </div>
    </Card>

    <div className="flex justify-end">
      <Button 
        onClick={onNext} 
        disabled={!formData.partnerId}
        className="gap-2 px-8 py-3"
      >
        Tasks
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  </motion.div>
);

const StepTwo = ({ formData, toggleTask, infoItem, setInfoItem, onBack, onNext }: any) => (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <Card className="p-8">
      <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 transition-colors">Content Covered (BACB 5th Ed)</h2>
      <div className="space-y-10">
        {TASK_LIST_AREAS.map(area => (
          <div key={area.id} className="space-y-4">
             <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center transition-colors">{area.id}</span>
                {area.name}
             </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {area.items.map(item => (
                  <div key={item} className="relative group flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleTask(item)}
                      className={cn(
                        "w-full text-left p-3 pr-10 rounded-xl border flex items-center gap-3 transition-all",
                        formData.taskListItems.includes(item) 
                          ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white shadow-md" 
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-900/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors text-[10px] font-bold",
                        formData.taskListItems.includes(item) 
                          ? "bg-white/20" 
                          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      )}>
                        {item}
                      </div>
                      <p className="text-[11px] font-medium leading-tight truncate">
                        {TASK_LIST_DESCRIPTIONS[item].short}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoItem(infoItem === item ? null : item);
                      }}
                      className={cn(
                        "absolute right-2 p-2 rounded-lg transition-colors z-10",
                        formData.taskListItems.includes(item)
                          ? "text-white/60 hover:text-white hover:bg-white/10"
                          : "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      )}
                      title="View full description"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {infoItem === item && (
                        <>
                          <div 
                            className="fixed inset-0 z-[60] bg-transparent" 
                            onClick={() => setInfoItem(null)} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-gray-900 dark:bg-black text-white rounded-2xl z-[70] shadow-2xl border border-gray-800"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-bold text-indigo-400 text-[10px] uppercase tracking-widest">Task {item}</p>
                              <button onClick={() => setInfoItem(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-95 font-medium">
                              {TASK_LIST_DESCRIPTIONS[item].full}
                            </p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900 dark:border-t-black"></div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </div>
    </Card>

    <div className="flex justify-between">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ChevronLeft className="w-5 h-5" />
        Back to Basics
      </Button>
      <Button onClick={onNext} className="gap-2 px-8">
        Feedback & Sign
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  </motion.div>
);

const StepThree = ({ formData, setFormData, isRBT, isBCBA, onBack, onFinish }: any) => (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <Card className="p-8 space-y-8">
      <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 transition-colors">Session Documentation</h2>
      
      {isBCBA && (
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Clinical Strengths (Required)</label>
             <textarea 
               className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-colors"
               placeholder="Describe behaviors executed at high fidelity..."
               value={formData.clinicalStrengths}
               onChange={e => setFormData({ ...formData, clinicalStrengths: e.target.value })}
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Opportunities for Growth & Action Plan (Required)</label>
             <textarea 
               className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-colors"
               placeholder="Define target behaviors for improvement..."
               value={formData.growthOpportunities}
               onChange={e => setFormData({ ...formData, growthOpportunities: e.target.value })}
             />
          </div>
          <div className="space-y-2 p-4 bg-red-50/50 dark:bg-red-900/5 rounded-2xl border border-red-100 dark:border-red-900/20">
             <label className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Private Notes (Supervisor Only)
             </label>
             <textarea 
               className="w-full bg-white dark:bg-black border-red-100 dark:border-red-900/30 border rounded-xl p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 min-h-[100px] transition-colors"
               placeholder="Confidential documentation..."
               value={formData.privateNotes}
               onChange={e => setFormData({ ...formData, privateNotes: e.target.value })}
             />
          </div>
        </div>
      )}

      {isRBT && (
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Additional Questions for BCBA</label>
             <textarea 
               className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-colors"
               placeholder="Any specific questions about techniques or progress?"
               value={formData.rbtQuestions}
               onChange={e => setFormData({ ...formData, rbtQuestions: e.target.value })}
             />
          </div>
        </div>
      )}

      <div className="space-y-2">
         <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Additional Session Notes</label>
         <textarea 
           className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-colors"
           placeholder="General observations..."
           value={formData.additionalNotes}
           onChange={e => setFormData({ ...formData, additionalNotes: e.target.value })}
         />
      </div>

      <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
         <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-400 text-[10px] transition-colors">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium leading-relaxed">
              By signing, you attest that the information recorded here is accurate and complies with the 
              BACB 5th Edition Supervision requirements.
            </p>
         </div>
      </div>
    </Card>

    <div className="flex justify-between">
       <Button variant="ghost" onClick={onBack} className="gap-2">
         <ChevronLeft className="w-5 h-5" />
         Review Tasks
       </Button>
       <Button 
         onClick={onFinish} 
         disabled={!isRBT && (!formData.clinicalStrengths || !formData.growthOpportunities)}
         className="gap-2 px-12 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 shadow-xl shadow-teal-100 dark:shadow-teal-900/10"
       >
         <CheckCircle2 className="w-5 h-5" />
         File Supervised Record
       </Button>
    </div>
  </motion.div>
);
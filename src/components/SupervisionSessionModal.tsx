/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button } from './ui';
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileSignature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatMinutes } from '../lib/utils';
import { SupervisionSession } from '../types';

interface SupervisionSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SupervisionSession | null;
}

export const SupervisionSessionModal = ({ isOpen, onClose, session }: SupervisionSessionModalProps) => {
  const { users, currentUser, signSession } = useApp();
  const [loading, setLoading] = React.useState(false);

  if (!isOpen || !session || !currentUser) return null;

  const partnerUser = users.find(u => 
    (currentUser.id === session.rbtId ? u.id === session.bcbaId : u.id === session.rbtId)
  );
  const partner = partnerUser || {
    id: currentUser.id === session.rbtId ? session.bcbaId : session.rbtId,
    name: currentUser.id === session.rbtId ? (session.bcbaName || 'Deleted Supervisor') : (session.rbtName || 'Deleted Clinician'),
    certificationNumber: currentUser.id === session.rbtId ? session.bcbaCertification : session.rbtCertification,
    role: currentUser.id === session.rbtId ? (session.bcbaRole || 'BCBA') : (session.rbtRole || 'RBT'),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id === session.rbtId ? (session.bcbaId || 'bcba') : (session.rbtId || 'rbt')}`
  };

  const isPendingMySignature = 
    (currentUser.role === 'RBT' && session.rbtId === currentUser.id && !session.rbtSignature) ||
    ((currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D') && session.bcbaId === currentUser.id && !session.bcbaSignature);

  const handleSign = async () => {
    setLoading(true);
    try {
      await signSession(session.id);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 my-4"
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Supervision Details</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className={cn(
            "p-2 rounded-xl flex items-center justify-between border",
            session.status === 'COMPLETED' 
              ? "bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30 text-teal-700 dark:text-teal-400"
              : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{session.status.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-[9px] font-mono opacity-60 uppercase">{session.id.slice(0, 8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/50">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <CalendarIcon className="w-2.5 h-2.5" />
                Date
              </label>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/50">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Clock className="w-2.5 h-2.5" />
                Time
              </label>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                {session.startTime} - {session.endTime}
                <span className="block text-[9px] text-indigo-500">{formatMinutes(session.durationMinutes)}</span>
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={partner?.avatar} className="w-8 h-8 rounded-full border border-white dark:border-gray-800 shadow-sm" />
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Partner</p>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white">{partner?.name}</p>
                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tighter">{partner?.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Type</p>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{session.contactType}</p>
              {session.isDirectObservation && (
                <span className="text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase">Obs</span>
              )}
            </div>
          </div>

          {/* Task List Items */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5 text-indigo-500" />
              Task List
            </label>
            <div className="flex flex-wrap gap-1 transition-all">
              {session.taskListItems.length > 0 ? session.taskListItems.map((item) => (
                <span 
                  key={item}
                  className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[9px] font-bold text-gray-500 dark:text-gray-400"
                >
                  {item}
                </span>
              )) : (
                <p className="text-[10px] text-gray-400 italic">None specified.</p>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <SignatureStatus 
              label="RBT" 
              signed={!!session.rbtSignature} 
              date={session.rbtSignedAt}
              signature={session.rbtSignature}
            />
            <SignatureStatus 
              label="BCBA" 
              signed={!!session.bcbaSignature} 
              date={session.bcbaSignedAt}
              signature={session.bcbaSignature}
            />
          </div>

          {/* Actions */}
          <div className="pt-1 flex gap-2">
            <Button 
               variant="outline" 
               onClick={onClose} 
               className="flex-1 rounded-lg h-9 text-xs font-bold border-gray-200 dark:border-gray-800"
            >
              Close
            </Button>
            {isPendingMySignature && currentUser.signature && (
               <Button 
                onClick={handleSign} 
                disabled={loading}
                className="flex-[2] rounded-lg h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md text-xs"
               >
                 <FileSignature className="w-3.5 h-3.5" />
                 Sign
               </Button>
            )}
            {isPendingMySignature && !currentUser.signature && (
              <div className="flex-[2] p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <p className="text-[9px] text-amber-800 dark:text-amber-400 font-medium leading-tight">Set signature in Settings.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SignatureStatus = ({ label, signed, date, signature }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className={cn(
       "h-12 rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all overflow-hidden",
       signed 
        ? "bg-teal-50/20 dark:bg-teal-900/5 border-teal-100 dark:border-teal-900/30" 
        : "bg-gray-50/50 dark:bg-gray-800/40 border-dashed border-gray-200 dark:border-gray-800"
    )}>
      {signed ? (
        <>
          <img src={signature} className="h-5 w-auto dark:invert dark:brightness-100 opacity-80" alt="Signature" />
          <p className="text-[7px] font-mono text-teal-600/60 dark:text-teal-400/40 mt-0.5">
            {new Date(date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </>
      ) : (
        <p className="text-[8px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest italic">Pending</p>
      )}
    </div>
  </div>
);

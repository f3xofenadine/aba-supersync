/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button, Input } from './ui';
import { 
  X, 
  Plus, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  AlertCircle,
  Hash,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatMinutes } from '../lib/utils';
import { DirectSession } from '../types';
import { ClockPicker } from './ClockPicker';

interface DirectHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSession?: DirectSession | null;
}

export const DirectHoursModal = ({ isOpen, onClose, editSession }: DirectHoursModalProps) => {
  const { saveDirectSession, deleteDirectSession, directSessions, currentUser, updateUser } = useApp();
  const [mode, setMode] = useState<'choice' | 'session' | 'monthly'>('choice');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [clientInitials, setClientInitials] = useState('');
  const [notes, setNotes] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (editSession) {
      setMode('session');
      setDate(editSession.date);
      setStartTime(editSession.startTime);
      setEndTime(editSession.endTime);
      setClientInitials(editSession.clientInitials || '');
      setNotes(editSession.notes || '');
    } else {
      setMode('choice');
      setDate(new Date().toISOString().split('T')[0]);
      if (currentUser?.manualMonthlyDirectHours?.[currentMonth]) {
        setManualHours(currentUser.manualMonthlyDirectHours[currentMonth].toString());
      } else {
        setManualHours('');
      }
    }

    if (!isOpen) {
      setActiveTimePicker(null);
    }
  }, [editSession, isOpen, currentUser, currentMonth]);

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // Handle overnight if necessary (unlikely for direct service)
    return diff;
  };

  const duration = calculateDuration(startTime, endTime);

  const formatDisplayTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const handleSaveMonthly = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours < 0) {
      setError("Please enter a valid number of hours.");
      setLoading(false);
      return;
    }

    try {
      const currentManual = currentUser?.manualMonthlyDirectHours || {};
      await updateUser({
        manualMonthlyDirectHours: {
          ...currentManual,
          [currentMonth]: hours
        }
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save monthly hours");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMonthly = async () => {
    if (!confirm("Are you sure you want to revert to individual session logging? This will clear the monthly total override.")) return;
    
    setLoading(true);
    try {
      const currentManual = { ...(currentUser?.manualMonthlyDirectHours || {}) };
      delete currentManual[currentMonth];
      await updateUser({
        manualMonthlyDirectHours: currentManual
      });
      setMode('choice');
    } catch (err: any) {
      setError(err.message || "Failed to clear monthly hours");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (duration <= 0) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    // Check for duplicates or overlaps
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    const overlappingSession = directSessions.find(s => 
      s.id !== editSession?.id && 
      s.date === date && 
      Math.max(newStart, timeToMinutes(s.startTime)) < Math.min(newEnd, timeToMinutes(s.endTime))
    );

    if (overlappingSession) {
      setError(`This overlaps with an existing session (${overlappingSession.startTime} - ${overlappingSession.endTime}).`);
      setLoading(false);
      return;
    }

    try {
      await saveDirectSession({
        id: editSession?.id,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        clientInitials,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editSession) return;
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    setLoading(true);
    try {
      await deleteDirectSession(editSession.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 my-4"
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {mode === 'choice' ? 'Log Direct Hours' : mode === 'monthly' ? 'Monthly Total' : (editSession ? 'Edit Hours' : 'Log Session')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3">
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {mode === 'choice' && (
            <div className="space-y-3 py-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-4 text-center px-4">
                Choose how you want to record your direct service hours for {new Date().toLocaleDateString(undefined, { month: 'long' })}.
              </p>
              
              <button
                onClick={() => setMode('session')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
              >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Individual Sessions</h3>
                  <p className="text-[10px] text-gray-500 leading-tight">Log each session separately with client initials and notes.</p>
                </div>
              </button>

              <button
                onClick={() => setMode('monthly')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-left group"
              >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-teal-100 dark:border-teal-800 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Supplemental Hours</h3>
                  <p className="text-[10px] text-gray-500 leading-tight">Enter bulk direct hours that aren't logged as individual sessions.</p>
                </div>
              </button>
            </div>
          )}

          {mode === 'monthly' && (
            <form onSubmit={handleSaveMonthly} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarIcon className="w-2.5 h-2.5" />
                  Selected Month
                </label>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800 text-[12px] font-bold text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-2.5 h-2.5" />
                  Supplemental Direct Hours
                </label>
                <Input 
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ex. 120.5"
                  value={manualHours}
                  onChange={e => setManualHours(e.target.value)}
                  className="bg-gray-50/50 dark:bg-gray-800/40 h-10 text-[14px] font-bold"
                />
              </div>

              <p className="text-[10px] text-gray-500 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                Note: Supplemental hours are added to your individual session total. These entries do not capture client initials or specific session notes as they represent bulk work.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setMode('choice')}
                  className="h-10 px-4 text-xs font-bold"
                >
                  Back
                </Button>
                {currentUser?.manualMonthlyDirectHours?.[currentMonth] && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleClearMonthly}
                    className="h-10 px-4 text-xs font-bold border-red-100 text-red-600"
                  >
                    Clear Override
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-10 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm"
                >
                  {loading ? 'Saving...' : 'Update Total'}
                </Button>
              </div>
            </form>
          )}

          {mode === 'session' && (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarIcon className="w-2.5 h-2.5" />
                    Date
                  </label>
                  <Input 
                    type="date" 
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-gray-50/50 dark:bg-gray-800/40 h-8 text-[12px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash className="w-2.5 h-2.5" />
                    Initials
                  </label>
                  <Input 
                    placeholder="Ex. JD"
                    value={clientInitials}
                    onChange={e => setClientInitials(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="bg-gray-50/50 dark:bg-gray-800/40 h-8 text-[12px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Presets</label>
                <div className="flex flex-wrap gap-1.5 transition-all">
                  {[
                    { label: '1h', start: '09:00', end: '10:00' },
                    { label: '2h', start: '09:00', end: '11:00' },
                    { label: '4h', start: '08:00', end: '12:00' },
                    { label: '6h', start: '08:00', end: '14:00' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStartTime(preset.start);
                        setEndTime(preset.end);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[9px] font-black text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all uppercase whitespace-nowrap"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5 text-indigo-500" />
                    Start
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTimePicker(activeTimePicker === 'start' ? null : 'start')}
                    className={cn(
                       "flex items-center justify-between w-full h-8 px-3 rounded-lg border bg-gray-50/50 dark:bg-gray-800/40 transition-all",
                       activeTimePicker === 'start' ? "border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.1)]" : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <span className="text-[12px] font-bold text-gray-900 dark:text-white">{formatDisplayTime(startTime)}</span>
                    <ChevronRight className={cn("w-3 h-3 text-gray-400 transition-transform", activeTimePicker === 'start' && "rotate-90")} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5 text-rose-500" />
                    End
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTimePicker(activeTimePicker === 'end' ? null : 'end')}
                    className={cn(
                       "flex items-center justify-between w-full h-8 px-3 rounded-lg border bg-gray-50/50 dark:bg-gray-800/40 transition-all",
                       activeTimePicker === 'end' ? "border-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]" : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <span className="text-[12px] font-bold text-gray-900 dark:text-white">{formatDisplayTime(endTime)}</span>
                    <ChevronRight className={cn("w-3 h-3 text-gray-400 transition-transform", activeTimePicker === 'end' && "rotate-90")} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {activeTimePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-gray-800/20 rounded-3xl p-4 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                       <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-2">
                         Picking {activeTimePicker} time
                       </p>
                    </div>
                    <ClockPicker 
                      value={activeTimePicker === 'start' ? startTime : endTime}
                      onChange={(val) => {
                        if (activeTimePicker === 'start') setStartTime(val);
                        else setEndTime(val);
                      }}
                      onDone={() => setActiveTimePicker(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Duration</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{formatMinutes(duration)}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none mb-0.5">Impact</p>
                   <p className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">+{(duration / 60).toFixed(1)}h</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Case Notes</label>
                <Input 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Session details..."
                  className="bg-gray-50/50 dark:bg-gray-800/40 h-8 text-[12px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setMode('choice')}
                  className="h-8 px-4 text-xs font-bold"
                >
                  Back
                </Button>
                {editSession && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDelete}
                    disabled={loading}
                    className="h-8 w-8 p-0 rounded-lg border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-8 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md text-xs"
                >
                  {loading ? '...' : (editSession ? 'Update' : 'Save Session')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

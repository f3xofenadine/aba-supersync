/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button } from './ui';
import { 
  Printer, 
  CheckCircle2, 
  Calendar,
  Share2,
  Download,
  PenLine,
  History,
  AlertCircle,
  FileSearch,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { formatMinutes, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SupervisionSession } from '../types';
import { TASK_LIST_DESCRIPTIONS } from '../data/taskList';
import { ExportRangeModal } from './ExportRangeModal';

export const HistoryView = () => {
  const { 
    currentUser, 
    sessions, 
    directSessions, 
    users, 
    signSession, 
    saveSession,
    updateUser,
    requestSessionDeletion,
    approveSessionDeletion,
    cancelSessionDeletion,
    setDirectModalOpen,
    setEditingDirectSession
  } = useApp();
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'supervision' | 'direct'>('supervision');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState<{ start: string; end: string } | null>(null);
  const [editingBulkSession, setEditingBulkSession] = useState<{ monthStr: string; hours: number } | null>(null);

  if (!currentUser) return null;

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const isRBT = currentUser.role === 'RBT';
  const isBCBA = currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D';

  const filterByDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const matchesYear = d.getFullYear().toString() === selectedYear;
    const matchesMonth = selectedMonth === 'all' || d.getMonth().toString() === selectedMonth;
    return matchesYear && matchesMonth;
  };

  const mySessions = sessions.filter(s => 
    ((isRBT && s.rbtId === currentUser.id) || (isBCBA && s.bcbaId === currentUser.id)) &&
    filterByDate(s.date)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const myDirectSessions = React.useMemo(() => {
    const individual = directSessions
      .filter(s => s.rbtId === currentUser.id && filterByDate(s.date));
    
    const supplemental = currentUser.role === 'RBT' && currentUser.manualMonthlyDirectHours 
      ? Object.entries(currentUser.manualMonthlyDirectHours).map(([monthStr, hours]) => {
          const [year, month] = monthStr.split('-');
          const matchesYear = year === selectedYear;
          const matchesMonth = selectedMonth === 'all' || (parseInt(month) - 1).toString() === selectedMonth;
          
          if (!matchesYear || !matchesMonth) return null;
          
          return {
            id: `bulk-${monthStr}`,
            rbtId: currentUser.id,
            date: `${monthStr}-01`, // For sorting
            durationMinutes: (hours as number) * 60,
            startTime: 'Bulk',
            endTime: 'Bulk',
            clientInitials: '---',
            notes: 'Supplemental bulk direct hours added for compliance totals.',
            isBulk: true,
            createdAt: Date.now()
          };
        }).filter(Boolean) as any[]
      : [];

    return [...individual, ...supplemental].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [directSessions, currentUser, selectedYear, selectedMonth, filterByDate]);

  const activeSession = mySessions.find(s => s.id === selectedSession);
  const activeDirectSession = myDirectSessions.find(s => s.id === selectedSession);
  const [signData, setSignData] = useState<Partial<SupervisionSession>>({});

  const filterSessionsByRange = (sessionsToFilter: any[], start: string, end: string) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    eDate.setHours(23, 59, 59, 999);
    return sessionsToFilter.filter(s => {
      const d = new Date(s.date);
      return d >= sDate && d <= eDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const exportSessions = exportRange 
    ? filterSessionsByRange(
        activeTab === 'supervision' 
          ? sessions.filter(s => (isRBT && s.rbtId === currentUser.id) || (isBCBA && s.bcbaId === currentUser.id))
          : myDirectSessions,
        exportRange.start, 
        exportRange.end
      )
    : [];

  useEffect(() => {
    if (activeSession) {
      setSignData({
        clinicalStrengths: activeSession.clinicalStrengths || '',
        growthOpportunities: activeSession.growthOpportunities || '',
        rbtQuestions: activeSession.rbtQuestions || '',
        additionalNotes: activeSession.additionalNotes || '',
        privateNotes: activeSession.privateNotes || '',
      });
    }
  }, [activeSession]);

  const needsCurrentSignature = activeSession && (
    (isRBT && !activeSession.rbtSignature) ||
    (isBCBA && !activeSession.bcbaSignature)
  );

  const handleSign = () => {
    if (!activeSession) return;
    saveSession({
      ...activeSession,
      ...signData
    });
    signSession(activeSession.id);
  };

  const handleExport = (start: string, end: string) => {
    setExportRange({ start, end });
    setIsExportModalOpen(false);
    // Give react time to render the print list before triggering print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="space-y-6 relative">
      <ExportRangeModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />

      <BulkEditModal 
        isOpen={!!editingBulkSession}
        onClose={() => setEditingBulkSession(null)}
        session={editingBulkSession}
        onSave={async (hours) => {
          if (!editingBulkSession || !currentUser) return;
          const currentManual = currentUser.manualMonthlyDirectHours || {};
          await updateUser({
            manualMonthlyDirectHours: {
              ...currentManual,
              [editingBulkSession.monthStr]: hours
            }
          });
          setEditingBulkSession(null);
        }}
      />

      {/* Print-Only Export View */}
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[100] p-8 min-h-screen text-black">
        <div className="mb-10 border-b-4 border-indigo-600 pb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Clinical Audit Archive</h1>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                {currentUser.role} Record • {currentUser.name}
              </p>
              {exportRange && (
                <p className="text-[10px] text-indigo-600 font-black mt-1">
                  Range: {new Date(exportRange.start).toLocaleDateString()} — {new Date(exportRange.end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase">Verification Status</p>
              <p className="text-sm font-black text-emerald-600">CERTIFIED CLINICAL RECORD</p>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse text-[10px] table-fixed">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-gray-300 font-black">
              <th className="p-3 text-left uppercase tracking-wider border w-24">Date</th>
              <th className="p-3 text-left uppercase tracking-wider border w-32">Type</th>
              <th className="p-3 text-left uppercase tracking-wider border w-20">Hours</th>
              <th className="p-3 text-left uppercase tracking-wider border">Partner / Client</th>
              <th className="p-3 text-left uppercase tracking-wider border w-40">RBT Sign (TS)</th>
              <th className="p-3 text-left uppercase tracking-wider border w-40">BCBA Sign (TS)</th>
            </tr>
          </thead>
          <tbody>
            {exportSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-bold border italic">
                  No sessions found matching this date range.
                </td>
              </tr>
            ) : (
              exportSessions.map((s: any) => {
                const partnerUser = users.find(u => (currentUser.role === 'RBT' ? u.id === s.bcbaId : u.id === s.rbtId));
                const partner = partnerUser || {
                  id: currentUser.role === 'RBT' ? s.bcbaId : s.rbtId,
                  name: currentUser.role === 'RBT' ? (s.bcbaName || 'Deleted Supervisor') : (s.rbtName || 'Deleted Clinician'),
                  certificationNumber: currentUser.role === 'RBT' ? s.bcbaCertification : s.rbtCertification,
                  role: currentUser.role === 'RBT' ? (s.bcbaRole || 'BCBA') : (s.rbtRole || 'RBT')
                };
                return (
                  <tr key={s.id} className="border-b border-gray-200">
                    <td className="p-3 border font-bold text-gray-700">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="p-3 border font-medium text-gray-600">
                      {s.isBulk ? 'Supplemental Aggregate' : (s.contactType || 'Direct Service')} 
                      {!s.isBulk && s.isDirectObservation ? ' (Observation)' : ''}
                    </td>
                    <td className="p-3 border font-mono font-bold text-indigo-600">
                      {activeTab === 'supervision' ? formatMinutes(s.durationMinutes) : `${(s.durationMinutes / 60).toFixed(1)}h`}
                    </td>
                    <td className="p-3 border font-bold text-gray-800">
                      {s.isBulk ? 'Monthly Total' : (s.clientInitials ? `Client: ${s.clientInitials}` : partner?.name || '---')}
                    </td>
                    <td className="p-3 border font-mono text-[9px] text-gray-500">
                      {s.rbtSignedAt ? new Date(s.rbtSignedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'NOT SIGNED'}
                    </td>
                    <td className="p-3 border font-mono text-[9px] text-gray-500">
                      {s.bcbaSignedAt ? new Date(s.bcbaSignedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'NOT SIGNED'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-1">Official Clinical Attestation</p>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-2xl">
              The clinical data above represents authentic records synchronous with the SuperSync platform audit trails. 
              Signatures provided via timestamps indicate verified cryptographic verification of the respective clinicians 
              at the time of processing.
            </p>
          </div>
        </div>
      </div>

      <header className="space-y-6 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Session History</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Review, audit, and export your professional history.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-9 px-3 shrink-0 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Export Logs</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex -mb-px">
            <button 
              onClick={() => { setActiveTab('supervision'); setSelectedSession(null); }}
              className={cn(
                "px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative",
                activeTab === 'supervision' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              Supervision
              {activeTab === 'supervision' && (
                <motion.div layoutId="activeTabHistory" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
            {isRBT && (
              <button 
                onClick={() => { setActiveTab('direct'); setSelectedSession(null); }}
                className={cn(
                  "px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative",
                  activeTab === 'direct' ? "text-teal-600 dark:text-teal-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                Direct
                {activeTab === 'direct' && (
                  <motion.div layoutId="activeTabHistory" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 py-2">
            <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
              <select 
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setSelectedSession(null); }}
                className="bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none px-2 py-0.5"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <select 
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setSelectedSession(null); }}
                className="bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none px-2 py-0.5"
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {(selectedMonth !== new Date().getMonth().toString() || selectedYear !== new Date().getFullYear().toString()) && (
              <button 
                onClick={() => {
                  setSelectedMonth(new Date().getMonth().toString());
                  setSelectedYear(new Date().getFullYear().toString());
                  setSelectedSession(null);
                }}
                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Reset Filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* List */}
        <div className="lg:col-span-1 space-y-3">
          {activeTab === 'supervision' ? (
            mySessions.length === 0 ? (
              <Card className="p-12 text-center bg-transparent border-dashed border-2">
                <History className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No supervision records found.</p>
              </Card>
            ) : (
              mySessions.map(session => {
                const partnerUser = users.find(u => 
                  (currentUser.role === 'RBT' ? u.id === session.bcbaId : u.id === session.rbtId)
                );
                const partner = partnerUser || {
                  id: currentUser.role === 'RBT' ? session.bcbaId : session.rbtId,
                  name: currentUser.role === 'RBT' ? (session.bcbaName || 'Deleted Supervisor') : (session.rbtName || 'Deleted Clinician'),
                  certificationNumber: currentUser.role === 'RBT' ? session.bcbaCertification : session.rbtCertification,
                  role: currentUser.role === 'RBT' ? (session.bcbaRole || 'BCBA') : (session.rbtRole || 'RBT')
                };
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5",
                      selectedSession === session.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 text-gray-900 dark:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      selectedSession === session.id ? "bg-white/20" : "bg-gray-50 dark:bg-gray-800"
                    )}>
                      <Calendar className={cn("w-4 h-4", selectedSession === session.id ? "text-white" : "text-gray-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mb-1", selectedSession === session.id ? "text-indigo-100" : "text-indigo-600 dark:text-indigo-400")}>
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-bold truncate">{partner?.name || 'Unknown Clinician'}</p>
                      <p className={cn("text-[10px] opacity-70", selectedSession === session.id ? "text-white" : "text-gray-500")}>
                        {formatMinutes(session.durationMinutes)} • {session.contactType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                      <CheckCircle2 className={cn("w-3.5 h-3.5", 
                        session.status === 'COMPLETED' ? "text-teal-500" : "text-gray-200 dark:text-gray-800"
                      )} />
                      {session.deleteRequestedBy && (
                        <Trash2 className={cn("w-3.5 h-3.5", 
                          session.deleteRequestedBy === currentUser.id ? "text-amber-500" : "text-red-500 animate-pulse"
                        )} />
                      )}
                    </div>
                  </button>
                );
              })
            )
          ) : (
            myDirectSessions.length === 0 ? (
              <Card className="p-12 text-center bg-transparent border-dashed border-2">
                <Clock className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No direct service logs recorded.</p>
              </Card>
            ) : (
              myDirectSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5",
                    selectedSession === session.id 
                      ? "bg-teal-600 border-teal-600 text-white shadow-md" 
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-900/50 text-gray-900 dark:text-white"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    selectedSession === session.id ? "bg-white/20" : "bg-teal-50 dark:bg-teal-900/20"
                  )}>
                    <span className={cn("text-[10px] font-bold", selectedSession === session.id ? "text-white" : "text-teal-600")}>
                      {session.clientInitials || '??'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mb-1", selectedSession === session.id ? "text-teal-100" : "text-teal-600 dark:text-teal-400")}>
                      {session.isBulk 
                        ? new Date(session.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                        : new Date(session.date).toLocaleDateString()
                      }
                    </p>
                    <p className="text-sm font-bold truncate">{session.isBulk ? 'Supplemental Hours' : 'Direct Service'}</p>
                    <p className={cn("text-[10px] opacity-70", selectedSession === session.id ? "text-white" : "text-gray-500")}>
                      {(session.durationMinutes / 60).toFixed(1)}h {session.isBulk ? 'Bulk Total' : `• ${session.startTime} - ${session.endTime}`}
                    </p>
                  </div>
                </button>
              ))
            )
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'supervision' && activeSession ? (
              <motion.div
                key={activeSession.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Card className="overflow-hidden shadow-xl border-gray-200 dark:border-gray-800 print:border-none print:shadow-none transition-all">
                   {/* Header of Doc */}
                   <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start print:bg-white transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h2 className="text-lg font-bold text-gray-900 dark:text-white">Record #{activeSession.id.toUpperCase().slice(0, 8)}</h2>
                           <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[8px] font-bold rounded uppercase">Verified</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Supervision Details</p>
                      </div>
                      <div className="flex gap-1.5 print:hidden">
                         <Button variant="ghost" size="icon" onClick={() => window.print()} className="w-8 h-8 dark:text-gray-400 dark:hover:bg-gray-700">
                            <Printer className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="w-8 h-8 dark:text-gray-400 dark:hover:bg-gray-700">
                            <Share2 className="w-4 h-4" />
                         </Button>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "w-8 h-8 transition-colors",
                              activeSession.deleteRequestedBy 
                                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                                : "text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            )}
                            onClick={() => {
                              if (!activeSession.deleteRequestedBy) {
                                requestSessionDeletion(activeSession.id);
                              } else if (activeSession.deleteRequestedBy === currentUser.id) {
                                cancelSessionDeletion(activeSession.id);
                              }
                            }}
                            title={activeSession.deleteRequestedBy ? "Cancel Deletion Request" : "Request Deletion"}
                         >
                            <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>

                   {/* Deletion Request Banner */}
                   {activeSession.deleteRequestedBy && (
                     <div className={cn(
                       "px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-b transition-colors",
                       activeSession.deleteRequestedBy === currentUser.id 
                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/30"
                        : "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-100 dark:border-red-900/30"
                     )}>
                       <div className="flex items-center gap-2">
                         <Trash2 className="w-3 h-3" />
                         {activeSession.deleteRequestedBy === currentUser.id 
                           ? "Waiting for clinical partner to approve deletion..." 
                           : "Partner has requested to delete this clinical record."}
                       </div>
                       {activeSession.deleteRequestedBy !== currentUser.id && (
                         <div className="flex gap-2">
                           <button 
                             onClick={() => cancelSessionDeletion(activeSession.id)}
                             className="px-2 py-0.5 hover:bg-white/50 rounded transition-colors"
                           >
                             Deny
                           </button>
                           <button 
                             onClick={() => approveSessionDeletion(activeSession.id)}
                             className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                           >
                             Approve & Delete
                           </button>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Body of Doc */}
                   <div className="p-5 space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 transition-colors">Date</p>
                            <p className="text-xs font-semibold dark:text-white transition-colors">{new Date(activeSession.date).toDateString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 transition-colors">Duration</p>
                            <p className="text-xs font-semibold dark:text-white transition-colors">{formatMinutes(activeSession.durationMinutes)}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 transition-colors">Type</p>
                            <p className="text-xs font-semibold dark:text-white transition-colors">{activeSession.contactType}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 transition-colors">Obs</p>
                            <p className="text-xs font-semibold dark:text-white transition-colors">{activeSession.isDirectObservation ? 'Direct' : 'No'}</p>
                         </div>
                      </div>

                      <div className="pt-5 border-t border-gray-100 dark:border-gray-800 transition-colors">
                         <h3 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 transition-colors">Task List</h3>
                         <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                            {activeSession.taskListItems.map(item => (
                              <span key={item} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-900/30 transition-colors">
                                {item}
                              </span>
                            ))}
                            {activeSession.taskListItems.length === 0 && <span className="text-gray-400 dark:text-gray-600 italic">None recorded</span>}
                         </div>
                      </div>

                       <div className="space-y-6">
                          {/* Visible to Both: Questions & Notes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div className="space-y-2">
                                <h3 className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">RBT Questions</h3>
                                {needsCurrentSignature && currentUser.role === 'RBT' ? (
                                  <textarea 
                                    className="w-full text-xs p-2.5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg min-h-[60px] dark:text-white"
                                    value={signData.rbtQuestions}
                                    onChange={e => setSignData(d => ({ ...d, rbtQuestions: e.target.value }))}
                                  />
                                ) : (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                    {activeSession.rbtQuestions || 'No questions provided.'}
                                  </p>
                                )}
                             </div>
                             <div className="space-y-2">
                                <h3 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Session Notes</h3>
                                {needsCurrentSignature ? (
                                   <textarea 
                                     className="w-full text-xs p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg min-h-[60px] dark:text-white"
                                     value={signData.additionalNotes}
                                     onChange={e => setSignData(d => ({ ...d, additionalNotes: e.target.value }))}
                                   />
                                ) : (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {activeSession.additionalNotes || 'No notes.'}
                                  </p>
                                )}
                             </div>
                          </div>

                          {/* Professional Feedback Section */}
                          <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-gray-800">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                   <h3 className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expert Strengths</h3>
                                   {needsCurrentSignature && isBCBA ? (
                                     <textarea 
                                       className="w-full text-xs p-2.5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg min-h-[80px] dark:text-white"
                                       value={signData.clinicalStrengths}
                                       onChange={e => setSignData(d => ({ ...d, clinicalStrengths: e.target.value }))}
                                     />
                                   ) : (
                                     <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {activeSession.clinicalStrengths || 'Pending verified strengths.'}
                                     </p>
                                   )}
                                </div>
                                <div className="space-y-2">
                                   <h3 className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Growth Plan</h3>
                                   {needsCurrentSignature && isBCBA ? (
                                     <textarea 
                                       className="w-full text-xs p-2.5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg min-h-[80px] dark:text-white"
                                       value={signData.growthOpportunities}
                                       onChange={e => setSignData(d => ({ ...d, growthOpportunities: e.target.value }))}
                                     />
                                   ) : (
                                     <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {activeSession.growthOpportunities || 'Pending growth plan.'}
                                     </p>
                                   )}
                                </div>
                             </div>

                             {/* Private Notes (Supervisor Only) */}
                             {isBCBA && (
                               <div className="space-y-2 p-3 bg-red-50/50 dark:bg-red-900/5 rounded-xl border border-red-100 dark:border-red-900/20">
                                  <h3 className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                                     <AlertCircle className="w-2.5 h-2.5" />
                                     Supervisor Private Notes
                                  </h3>
                                  {needsCurrentSignature ? (
                                    <textarea 
                                      className="w-full text-xs p-2 border border-red-200 dark:border-red-900/30 rounded-lg min-h-[60px] bg-white dark:bg-black dark:text-white"
                                      value={signData.privateNotes}
                                      onChange={e => setSignData(d => ({ ...d, privateNotes: e.target.value }))}
                                    />
                                  ) : (
                                    <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                      {activeSession.privateNotes || 'None recorded.'}
                                    </p>
                                  )}
                               </div>
                             )}
                          </div>
                       </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-gray-100 dark:border-gray-800 transition-colors">
                         <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors flex items-center justify-between">
                              RBT Attestation
                              {activeSession.rbtSignature && <CheckCircle2 className="w-3 h-3 text-teal-500" />}
                            </p>
                            <div className="h-24 border-b-2 border-gray-200 dark:border-gray-800 flex flex-col justify-end pb-2 transition-colors relative group">
                               {activeSession.rbtSignature ? (
                                 <img src={activeSession.rbtSignature} alt="RBT Signature" className="max-h-20 w-auto object-contain mb-1 dark:invert transition-all" />
                               ) : (
                                 isRBT && activeSession.rbtId === currentUser.id ? (
                                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/10 rounded-lg animate-pulse p-4 border border-indigo-100 dark:border-indigo-900/30">
                                     {activeSession.bcbaSignature && (
                                       <p className="text-[8px] text-indigo-600/60 dark:text-indigo-400/60 font-black text-center mb-1 leading-tight px-1 uppercase tracking-tight">
                                         Signing will lock this entry from future edits
                                       </p>
                                     )}
                                     {currentUser.signature ? (
                                       <Button 
                                         size="sm" 
                                         className="w-full h-full bg-transparent hover:bg-transparent text-indigo-600 dark:text-indigo-400 font-bold gap-2 flex-col justify-center"
                                         onClick={handleSign}
                                       >
                                         <PenLine className="w-4 h-4" />
                                         Sign Now
                                       </Button>
                                     ) : (
                                       <p className="text-[10px] text-indigo-600 dark:text-indigo-400 text-center">Set up your signature in sidebar</p>
                                     )}
                                   </div>
                                 ) : (
                                   <p className="text-sm font-handwriting italic text-gray-300 dark:text-gray-700 transition-colors">Pending Signature</p>
                                 )
                               )}
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white transition-colors">{users.find(u => u.id === activeSession.rbtId)?.name || activeSession.rbtName || 'Deleted Clinician'}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 transition-colors">{activeSession.rbtSignedAt ? new Date(activeSession.rbtSignedAt).toLocaleString() : 'Not signed yet'}</p>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors flex items-center justify-between">
                              Supervisor Verification
                              {activeSession.bcbaSignature && <CheckCircle2 className="w-3 h-3 text-teal-500" />}
                            </p>
                            <div className="h-24 border-b-2 border-gray-200 dark:border-gray-800 flex flex-col justify-end pb-2 transition-colors relative group">
                               {activeSession.bcbaSignature ? (
                                 <img src={activeSession.bcbaSignature} alt="BCBA Signature" className="max-h-20 w-auto object-contain mb-1 dark:invert transition-all" />
                               ) : (
                                 isBCBA && activeSession.bcbaId === currentUser.id ? (
                                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/10 rounded-lg animate-pulse p-4 border border-indigo-100 dark:border-indigo-900/30">
                                     {activeSession.rbtSignature && (
                                       <p className="text-[8px] text-indigo-600/60 dark:text-indigo-400/60 font-black text-center mb-1 leading-tight px-1 uppercase tracking-tight">
                                         Signing will lock this entry from future edits
                                       </p>
                                     )}
                                     {currentUser.signature ? (
                                       <Button 
                                         size="sm" 
                                         className="w-full h-full bg-transparent hover:bg-transparent text-indigo-600 dark:text-indigo-400 font-bold gap-2 flex-col justify-center"
                                         onClick={handleSign}
                                       >
                                         <PenLine className="w-4 h-4" />
                                         Sign Now
                                       </Button>
                                     ) : (
                                       <p className="text-[10px] text-indigo-600 dark:text-indigo-400 text-center">Set up your signature in sidebar</p>
                                     )}
                                   </div>
                                 ) : (
                                   <p className="text-sm font-handwriting italic text-gray-300 dark:text-gray-700 transition-colors">Pending Signature</p>
                                 )
                               )}
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white transition-colors">{users.find(u => u.id === activeSession.bcbaId)?.name || activeSession.bcbaName || 'Deleted Supervisor'}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 transition-colors">{activeSession.bcbaSignedAt ? new Date(activeSession.bcbaSignedAt).toLocaleString() : 'Not signed yet'}</p>
                         </div>
                      </div>
                   </div>
                </Card>
              </motion.div>
            ) : activeTab === 'direct' && activeDirectSession ? (
              <motion.div
                key={activeDirectSession.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Card className="p-5 space-y-5 min-h-[350px]">
                   <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                             {activeDirectSession.isBulk ? 'Supplemental Bulk Entry' : 'Direct Service Record'}
                           </h2>
                           <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[8px] font-bold rounded uppercase">
                             {activeDirectSession.isBulk ? 'Bulk' : 'Audit'}
                           </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {activeDirectSession.isBulk ? 'Aggregate hours for compliance.' : 'Clinical session details.'}
                        </p>
                      </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 gap-1.5 text-indigo-600 dark:text-indigo-400"
                          onClick={() => {
                            if (activeDirectSession.isBulk) {
                              setEditingBulkSession({
                                monthStr: activeDirectSession.id.replace('bulk-', ''),
                                hours: activeDirectSession.durationMinutes / 60
                              });
                            } else {
                              setEditingDirectSession(activeDirectSession);
                              setDirectModalOpen(true);
                            }
                          }}
                        >
                           <PenLine className="w-3.5 h-3.5" />
                           <span className="text-[10px]">Edit</span>
                        </Button>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-5 border-y border-gray-100 dark:border-gray-800">
                      <div>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                           {activeDirectSession.isBulk ? 'Period' : 'Date'}
                         </p>
                         <p className="text-xs font-bold dark:text-white">
                           {activeDirectSession.isBulk 
                             ? new Date(activeDirectSession.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                             : new Date(activeDirectSession.date).toDateString()
                           }
                         </p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
                         <p className="text-xs font-bold dark:text-white">
                           {activeDirectSession.isBulk ? 'Consolidated' : `${activeDirectSession.startTime} - ${activeDirectSession.endTime}`}
                         </p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Duration</p>
                         <p className="text-xs font-bold dark:text-white">{(activeDirectSession.durationMinutes / 60).toFixed(1)}h</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Initials</p>
                         <p className="text-xs font-bold dark:text-white">{activeDirectSession.clientInitials || 'N/A'}</p>
                      </div>
                   </div>

                   <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Service Note</p>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[80px]">
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {activeDirectSession.notes || 'No session notes.'}
                        </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-400 mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                      <CheckCircle2 className="w-3 h-3 text-teal-500" />
                      Recorded: {new Date(activeDirectSession.createdAt).toLocaleString()}
                   </div>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-center transition-colors">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-200 dark:text-gray-700 mb-4 transition-colors">
                   {activeTab === 'supervision' ? <FileSearch className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Select a record</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1 transition-colors">Review the clinical details and export high-fidelity audit reports.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: { monthStr: string; hours: number } | null;
  onSave: (hours: number) => Promise<void>;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, session, onSave }) => {
  const [hours, setHours] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setHours(session.hours.toString());
    }
  }, [session]);

  const handleSave = async () => {
    const val = parseFloat(hours);
    if (isNaN(val) || val < 0) return;
    setIsSaving(true);
    try {
      await onSave(val);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && session && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Edit Supplemental Hours</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(session.monthStr + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Total Direct Hours
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter total hours..."
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                  These hours are added as an aggregate total for this month to ensure your direct vs. supervision percentages remain accurate.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-10 text-xs font-bold">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-[2] rounded-xl h-10 bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Update Hours'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

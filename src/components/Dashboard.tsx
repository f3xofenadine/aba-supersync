/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button } from './ui';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText,
  Plus,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatMinutes } from '../lib/utils';
import { Link } from 'react-router-dom';
import { DirectSession } from '../types';

export const Dashboard = () => {
  const { 
    currentUser, 
    sessions, 
    directSessions, 
    associations, 
    users, 
    updateUser,
    setDirectModalOpen,
    setEditingDirectSession,
    setSupervisionModalOpen,
    setEditingSupervisionSession
  } = useApp();

  if (!currentUser) return null;

  const isRbt = currentUser.role === 'RBT';
  const isBcba = currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D';

  const mySessions = sessions.filter(s => 
    (isRbt && s.rbtId === currentUser.id) ||
    (isBcba && s.bcbaId === currentUser.id)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentSessions = mySessions.slice(0, 5);

  const calculateCompliance = React.useCallback((userId: string) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const userSessions = sessions.filter(s => s.rbtId === userId && s.status !== 'DRAFT' && s.date.startsWith(currentMonth));
    
    // Find the user to get their actual logged direct hours
    const user = users.find(u => u.id === userId);
    const effectiveDirectHours = user?.monthlyDirectHours || 0;

    const totalMins = userSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const targetMins = (effectiveDirectHours * 60) * 0.05;
    const observationCount = userSessions.filter(s => s.isDirectObservation).length;
    const groupMins = userSessions.filter(s => s.contactType === 'GROUP').reduce((acc, s) => acc + s.durationMinutes, 0);
    
    return {
      totalMins,
      targetMins,
      percentage: targetMins > 0 ? Math.min(200, (totalMins / targetMins) * 100) : 100, // Handle targetMins === 0 as 100% compliant
      observationCount,
      groupPercentage: totalMins > 0 ? (groupMins / totalMins) * 100 : 0
    };
  }, [sessions, users]);

  const [rbtStatsMap, setRbtStatsMap] = React.useState<Record<string, any>>({});

  const myAssociations = React.useMemo(() => associations.filter(a => a.bcbaId === currentUser.id), [associations, currentUser.id]);
  const activeAssocs = React.useMemo(() => myAssociations.filter(a => a.status === 'ACCEPTED'), [myAssociations]);
  const pendingAssocs = React.useMemo(() => myAssociations.filter(a => a.status === 'PENDING'), [myAssociations]);
  
  const myRbts = React.useMemo(() => users.filter(u => activeAssocs.some(a => a.rbtId === u.id)), [users, activeAssocs]);
  const pendingRbts = React.useMemo(() => users.filter(u => pendingAssocs.some(a => a.rbtId === u.id)), [users, pendingAssocs]);

  const performAudit = React.useCallback(() => {
    const newStats: Record<string, any> = {};
    myRbts.forEach(rbt => {
      newStats[rbt.id] = calculateCompliance(rbt.id);
    });
    setRbtStatsMap(newStats);
  }, [myRbts, sessions, calculateCompliance]);

  // Initial and reactive audit
  React.useEffect(() => {
    if (isBcba && myRbts.length > 0) {
      performAudit();
    }
  }, [isBcba, myRbts, performAudit]);

  const rbtStats = calculateCompliance(currentUser.id);
  const currentMonthSessions = directSessions
    .filter(s => s.date.startsWith(new Date().toISOString().slice(0, 7)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const duplicateCertUser = React.useMemo(() => {
    if (!currentUser.certificationNumber) return null;
    return users.find(u => 
      u.id !== currentUser.id && 
      u.certificationNumber?.trim().toLowerCase() === currentUser.certificationNumber?.trim().toLowerCase()
    );
  }, [users, currentUser]);

  if (isBcba) {
    const directWorkMonthly = myRbts.reduce((acc, rbt) => acc + (rbt.monthlyDirectHours || 0), 0);
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Clinical Oversight <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">
              Supervising {myRbts.length} Registered Behavior Technicians • {directWorkMonthly.toFixed(1)}h Total Direct
            </p>
          </div>
        </header>

        {duplicateCertUser && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-4 items-start"
          >
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg shrink-0">
               <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Duplicate Certification Number Detected</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Another provider, <span className="font-bold">{duplicateCertUser.name}</span> (<span className="underline italic text-amber-800 dark:text-amber-200">{duplicateCertUser.email}</span>), is currently registered with the same certification number: <span className="font-mono font-bold">{currentUser.certificationNumber}</span>.
              </p>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/50 italic pt-1">
                Please verify your profile settings. If this is an error, please contact support at <span className="font-bold underline">anvil.aba.official@gmail.com</span> for resolution. This does not restrict your ability to log hours.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Users} 
            label="Active RBTs" 
            value={myRbts.length.toString()} 
            color="indigo"
            sublabel={pendingRbts.length > 0 ? `${pendingRbts.length} Pending` : undefined}
          />
          <StatCard 
            icon={FileText} 
            label="Pending Signatures" 
            value={sessions.filter(s => s.bcbaId === currentUser.id && s.status === 'SIGNED_BY_RBT').length.toString()} 
            color="amber"
          />
          <StatCard 
            icon={ShieldCheck} 
            label="Directory Search" 
            value="Active" 
            color="teal"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">RBT Compliance Directory</h2>
              <div className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-400">
                AUDIT TARGET: 5.0%
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {myRbts.length === 0 && pendingRbts.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No associated RBTs found in your network.</p>
                  <Link to="/people" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 inline-block">Visit Clinical Directory →</Link>
                </div>
              ) : (
                <>
                  {myRbts.map(rbt => {
                    const stats = rbtStatsMap[rbt.id] || { totalMins: 0, targetMins: 0, percentage: 0, observationCount: 0 };
                    return (
                      <div key={rbt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <div className="flex items-center gap-4 w-60 shrink-0">
                          <img src={rbt.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{rbt.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase truncate">{rbt.certificationNumber || 'No Cert #'}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full flex flex-col gap-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Supervision Completion</span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              stats.percentage >= 100 ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"
                            )}>
                              {stats.percentage.toFixed(1)}% of 5%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.percentage}%` }}
                              className={cn("h-full", stats.percentage >= 100 ? "bg-teal-500" : "bg-amber-500")}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{(rbt.monthlyDirectHours || 0).toFixed(1)}h</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Direct</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{(stats.totalMins / 60).toFixed(1)}h</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Supervision</p>
                          </div>
                          <div className="text-center">
                            <p className={cn("text-xs font-bold", stats.observationCount > 0 ? "text-teal-600" : "text-red-500")}>{stats.observationCount}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Obs</p>
                          </div>
                          <Link to="/history">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {pendingRbts.map(rbt => (
                    <div key={rbt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6 bg-amber-50/20 dark:bg-amber-900/5 transition-colors">
                      <div className="flex items-center gap-4 w-60 shrink-0">
                        <img src={rbt.avatar} className="w-10 h-10 rounded-full border-2 border-amber-100 dark:border-amber-900/30 opacity-60" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 truncate">{rbt.name}</p>
                          <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Awaiting Acceptance</span>
                        </div>
                      </div>
                      <div className="flex-1 italic text-xs text-amber-600/60 dark:text-amber-400/40">
                        Waiting for technician to confirm association...
                      </div>
                      <div className="shrink-0">
                        <Link to="/history">
                           <Button size="sm" variant="ghost" disabled className="h-8 w-8 p-0 rounded-lg opacity-20">
                             <ArrowRight className="w-4 h-4 text-gray-400" />
                           </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome, <span className="text-indigo-600 dark:text-indigo-400">{currentUser.name.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 uppercase transition-colors">
            {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} Report
          </p>
        </div>
      </header>

      {duplicateCertUser && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-4 items-start"
        >
          <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg shrink-0">
             <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Duplicate Certification Number Detected</h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Another provider, <span className="font-bold">{duplicateCertUser.name}</span> (<span className="underline italic text-amber-800 dark:text-amber-200">{duplicateCertUser.email}</span>), is currently registered with the same certification number: <span className="font-mono font-bold">{currentUser.certificationNumber}</span>.
            </p>
            <p className="text-xs text-amber-700/70 dark:text-amber-300/50 italic pt-1">
              Please verify your profile settings. If this is an error, please contact support at <span className="font-bold underline">anvil.aba.official@gmail.com</span> for resolution. This does not restrict your ability to log hours.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <StatCard 
          icon={TrendingUp} 
          label="DIRECT" 
          value={`${currentUser?.monthlyDirectHours?.toFixed(1) || '0.0'}h`} 
          sublabel="DIRECT HRS"
          color="teal"
        />
        <StatCard 
          icon={Clock} 
          label="Supervision" 
          value={`${(rbtStats.totalMins / 60).toFixed(1)}h`} 
          sublabel="Supervision Hrs"
          color="blue"
        />
        <StatCard 
          icon={History} 
          label="Required" 
          value={`${Math.max(0, (rbtStats.targetMins - rbtStats.totalMins) / 60).toFixed(1)}h`} 
          color={rbtStats.totalMins >= rbtStats.targetMins ? "teal" : "amber"}
          sublabel="5% of Logged"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Tracker */}
        <Card className="lg:col-span-2 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-bold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Compliance Audit</h2>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Monthly Volume (5%)</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  rbtStats.percentage >= 100 ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                )}>
                  {rbtStats.percentage >= 100 ? "Compliant" : `${Math.round(100 - rbtStats.percentage)}% Remaining`}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${rbtStats.percentage}%` }}
                  className={cn("h-full transition-all duration-1000", rbtStats.percentage >= 100 ? "bg-teal-500" : "bg-indigo-500")}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase truncate">
                 <span>{formatMinutes(rbtStats.totalMins)} Logged</span>
                 <span>Required: {formatMinutes(rbtStats.targetMins)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ComplianceCheck 
                title="Direct Observation" 
                met={rbtStats.observationCount >= 1} 
                description="Min 1 client observation."
                value={`${rbtStats.observationCount} Found`}
              />
              <ComplianceCheck 
                title="Group Supervision" 
                met={rbtStats.groupPercentage <= 50} 
                description="Max 50% group hours."
                value={`${Math.round(rbtStats.groupPercentage)}%`}
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center">
             <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Verified Clinical Data Compliance
             </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <h2 className="text-md font-bold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3 mb-4">Recent Supervision</h2>
          <div className="space-y-3">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-200 dark:text-gray-800 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">No sessions recorded yet.</p>
              </div>
            ) : (
              recentSessions.map(session => {
                const partner = users.find(u => 
                  (isRbt ? u.id === session.bcbaId : u.id === session.rbtId)
                );
                return (
                  <div 
                    key={session.id} 
                    id={`supervision-${session.id}`}
                    onClick={() => {
                      setEditingSupervisionSession(session);
                      setSupervisionModalOpen(true);
                    }}
                    className="group relative flex items-start gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mb-1">{new Date(session.date).toLocaleDateString()}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{partner?.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatMinutes(session.durationMinutes)} • {session.contactType}</p>
                    </div>
                    <CheckCircle2 className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-opacity",
                      session.status === 'COMPLETED' ? "text-teal-500" : "text-gray-300 dark:text-gray-700 opacity-20 group-hover:opacity-100"
                    )} />
                  </div>
                );
              })
            )}
          </div>
          {mySessions.length > 5 && (
            <Link to="/history" className="mt-4 block text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              View All History
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, sublabel }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    teal: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400',
    amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
  };

  return (
    <Card className="p-3 overflow-hidden relative border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn("p-1 rounded-lg", colors[color])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {sublabel && <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{sublabel}</p>}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-0.5">{value}</p>
        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
    </Card>
  );
};

const ComplianceCheck = ({ title, met, description, value }: { title: string; met: boolean; description: string; value?: string }) => (
  <div className={cn(
    "p-3 rounded-xl border flex gap-2.5 transition-all",
    met ? "border-teal-50 dark:border-teal-900/20 bg-teal-50/30 dark:bg-teal-900/5" : "border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/5"
  )}>
    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
      met ? "bg-teal-500 text-white" : "bg-red-500 text-white"
    )}>
      {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <h3 className={cn("text-xs font-bold truncate", met ? "text-teal-900 dark:text-teal-400" : "text-red-900 dark:text-red-400")}>{title}</h3>
        {value && <span className={cn("text-[9px] font-mono font-bold px-1 rounded", met ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400")}>{value}</span>}
      </div>
      <p className={cn("text-[10px] leading-tight", met ? "text-teal-600 dark:text-teal-500" : "text-red-600 dark:text-red-500")}>{description}</p>
    </div>
  </div>
);

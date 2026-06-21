/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button, Input } from './ui';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ShieldClose, 
  Users, 
  Mail, 
  Send,
  UserX,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';

export const PeopleView = () => {
  const { currentUser, users, associations, createAssociation, updateAssociationStatus, removeAssociation } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmRemoveId, setConfirmRemoveId] = React.useState<string | null>(null);
  const activeSubTab = (searchParams.get('tab') as 'network' | 'find') || 'network';
  const setActiveSubTab = (tab: 'network' | 'find') => {
    setSearchParams({ tab });
  };
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  if (!currentUser) return null;

  const handleAssociate = async (targetId: string) => {
    setLoadingIds(prev => new Set(prev).add(targetId));
    try {
      await createAssociation(targetId);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const getAssoc = (userId: string) => {
    return associations.find(a => 
      (a.rbtId === currentUser.id && a.bcbaId === userId) ||
      (a.bcbaId === currentUser.id && a.rbtId === userId)
    );
  };

  // 1. My Network Subtab Data
  // Active associated users
  const connectedUsers = React.useMemo(() => {
    return users.filter(u => {
      const assoc = getAssoc(u.id);
      return assoc && assoc.status === 'ACCEPTED';
    });
  }, [users, associations, currentUser.id]);

  const isBcba = currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D';
  const isRbt = currentUser.role === 'RBT';

  // Incoming pending requests
  const incomingRequests = React.useMemo(() => {
    return associations.filter(a => 
      a.status === 'PENDING' && 
      (a.bcbaId === currentUser.id || a.rbtId === currentUser.id) &&
      a.senderId !== currentUser.id
    );
  }, [associations, currentUser.id]);

  // Outgoing pending requests
  const outgoingRequests = React.useMemo(() => {
    return associations.filter(a =>
      a.status === 'PENDING' &&
      a.senderId === currentUser.id
    );
  }, [associations, currentUser.id]);

  // 2. Find People Subtab Data
  // Directory users for finding *new* people: we exclude self AND current accepted connections to make it strictly for adding *new* people.
  const findPeopleUsers = React.useMemo(() => {
    return users.filter(u => {
      if (u.id === currentUser.id) return false;

      // Filter by compatible roles: 
      // BCBAs should only see RBTs
      // RBTs should only see BCBAs
      const isCurrentUserBcba = currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D';
      const isCurrentUserRbt = currentUser.role === 'RBT';
      const isTargetBcba = u.role === 'BCBA' || u.role === 'BCBA-D';
      const isTargetRbt = u.role === 'RBT';

      if (isCurrentUserBcba && !isTargetRbt) return false;
      if (isCurrentUserRbt && !isTargetBcba) return false;
      
      const assoc = getAssoc(u.id);
      // Filter out completed/accepted associations so "Find People" is strictly for adding new/drafting connections
      if (assoc && assoc.status === 'ACCEPTED') return false;
      
      // Match clinical search term
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.certificationNumber && u.certificationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [users, associations, currentUser.id, searchTerm]);

  const foundUserByEmail = searchTerm && searchTerm.includes('@') && !findPeopleUsers.some(u => u.email === searchTerm.toLowerCase()) && !connectedUsers.some(u => u.email === searchTerm.toLowerCase());

  const sendEmailInvite = () => {
    const subject = encodeURIComponent("Invitation to join my supervision network on SuperSync");
    const body = encodeURIComponent(`Hello,\n\nI would like to connect with you on SuperSync, a supervision and compliance portal for BCBAs and RBTs. This will help us track our supervision hours and compliance documents more efficiently.\n\nYou can join here: ${window.location.origin}\n\nBest regards,\n${currentUser.name}`);
    window.location.href = `mailto:${searchTerm}?subject=${subject}&body=${body}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">People</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your supervision network and add new associations.</p>
        </div>

        {/* Subtabs Selectors */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveSubTab('network')}
              className={cn(
                "whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-all duration-150 flex items-center gap-2",
                activeSubTab === 'network' 
                  ? "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <Users className="w-4.5 h-4.5" />
              My Network
              {connectedUsers.length > 0 && (
                <span className={cn(
                  "ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full",
                  activeSubTab === 'network'
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-400"
                )}>
                  {connectedUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('find')}
              className={cn(
                "whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-all duration-150 flex items-center gap-2",
                activeSubTab === 'find' 
                  ? "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <Search className="w-4.5 h-4.5" />
              Find People
            </button>
          </nav>
        </div>
      </div>

      {/* --- SUBTAB: MY NETWORK --- */}
      {activeSubTab === 'network' && (
        <div className="space-y-6">
          {/* Incoming requests section inside my network */}
          {incomingRequests.length > 0 && (
            <section className="bg-indigo-50/40 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40 animate-fade-in">
              <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Incoming Connection Requests
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {incomingRequests.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingRequests.map(assoc => {
                  const sender = users.find(u => u.id === assoc.senderId);
                  if (!sender) return null;
                  return (
                    <motion.div
                      layout
                      key={assoc.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4 flex items-center gap-4 bg-white dark:bg-gray-900 border-indigo-100 dark:border-indigo-900/30">
                        <img src={sender.avatar} className="w-12 h-12 rounded-full border-2 border-indigo-50 dark:border-gray-800" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sender.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{sender.role} • {sender.certificationNumber || 'No Cert #'}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 h-9"
                            onClick={() => updateAssociationStatus(assoc.id, 'DECLINED')}
                          >
                            <ShieldClose className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 h-9"
                            onClick={() => updateAssociationStatus(assoc.id, 'ACCEPTED')}
                          >
                            Accept
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Outgoing pending invitations section */}
          {outgoingRequests.length > 0 && (
            <section className="bg-gray-50/50 dark:bg-gray-900/10 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 animate-fade-in">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Pending Sent Invitations
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {outgoingRequests.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outgoingRequests.map(assoc => {
                  const targetId = assoc.rbtId === currentUser.id ? assoc.bcbaId : assoc.rbtId;
                  const target = users.find(u => u.id === targetId);
                  if (!target) return null;
                  return (
                    <motion.div
                      layout
                      key={assoc.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="p-4 flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={target.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{target.name}</p>
                            <span className="text-[9px] font-extrabold bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded mr-1 uppercase">
                              {target.role}
                            </span>
                            <span className="text-[10px] text-gray-455 dark:text-gray-500 italic">Awaiting response</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold h-9 px-3"
                          onClick={() => removeAssociation(assoc.id)}
                        >
                          Cancel
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Active associated providers list */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              My Clinical Connections
            </h2>

            {connectedUsers.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Network is Empty</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 px-6 max-w-md mx-auto mt-1">
                  You don't have any associated RBTs or BCBAs right now. Go to the "Find People" tab to expand your network.
                </p>
                <Button 
                  onClick={() => setActiveSubTab('find')} 
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-100 dark:shadow-none gap-2"
                >
                  <Search className="w-4 h-4" />
                  Find Providers
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {connectedUsers.map(user => {
                    return (
                      <motion.div
                        layout
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                      >
                        <Card className="p-5 flex flex-col justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 hover:shadow-lg transition-all h-full self-stretch">
                          <div className="flex items-start gap-4">
                            <img 
                              src={user.avatar} 
                              className="w-14 h-14 rounded-full border-2 border-indigo-50 dark:border-gray-800 shadow-inner" 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded tracking-wider uppercase inline-block mb-1">
                                {user.role}
                              </span>
                              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              {user.certificationNumber && (
                                <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Cert: {user.certificationNumber}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold">
                                <UserCheck className="w-4 h-4" />
                                Active Network
                              </div>
                              <Link to="/history" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                                Oversight History
                              </Link>
                            </div>

                            {confirmRemoveId === user.id ? (
                              <div className="flex gap-2 justify-end items-center mt-1 pt-1 border-t border-gray-50/50 dark:border-gray-850/50 animate-fade-in">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Are you sure?</span>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 px-2.5 text-[10px] uppercase font-bold"
                                  onClick={() => setConfirmRemoveId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase font-bold"
                                  onClick={async () => {
                                    const assoc = getAssoc(user.id);
                                    if (assoc) {
                                      await removeAssociation(assoc.id);
                                    }
                                    setConfirmRemoveId(null);
                                  }}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end mt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 font-bold uppercase tracking-wide px-2 rounded-lg"
                                  onClick={() => setConfirmRemoveId(user.id)}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Remove Connection
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      )}

      {/* --- SUBTAB: FIND PEOPLE --- */}
      {activeSubTab === 'find' && (
        <div className="space-y-6">
          {/* Find & Search card */}
          <div className="bg-gradient-to-br from-indigo-50/55 to-slate-50/50 dark:from-indigo-950/10 dark:to-gray-900/30 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Add Provider to Network
              </h2>
              <Button 
                onClick={handleRefresh}
                variant="ghost" 
                size="sm"
                className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800"
              >
                <RefreshCw className={cn("w-3 h-3 text-indigo-500", isRefreshing && "animate-spin")} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Directory'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Search for credentialed supervisors (BCBAs) or providers (RBTs) already registered, or send a professional invite.
            </p>
            
            <div className="flex flex-col md:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  className="pl-12 h-14 text-md bg-white dark:bg-gray-800 shadow-md shadow-indigo-100/20 dark:shadow-none border-gray-200 focus:ring-2 focus:ring-indigo-500 font-medium" 
                  placeholder="Enter name, email, or BACB credential #..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {foundUserByEmail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button 
                    onClick={sendEmailInvite}
                    className="h-14 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100/20 dark:shadow-none font-bold gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Invite via Email
                  </Button>
                </motion.div>
              )}
            </div>
            {foundUserByEmail && (
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-3 flex items-center gap-1.5 uppercase tracking-wide">
                <Mail className="w-3.5 h-3.5" />
                Provider not found in directory. Generate professional email invitation above!
              </p>
            )}
          </div>

          {/* Search Result List */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {searchTerm ? 'Search Results' : 'Registered Providers Available to Add'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {findPeopleUsers.map(user => {
                  const assoc = getAssoc(user.id);
                  return (
                    <motion.div
                      layout
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="p-6 h-full flex flex-col justify-between hover:shadow-lg transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center">
                          <img 
                            src={user.avatar} 
                            className="w-20 h-20 rounded-full border-4 border-slate-50 dark:border-gray-800 shadow-md mb-3" 
                          />
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                            {user.role}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{user.certificationNumber || 'Cert # Not listed'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-450 mt-2 italic px-2 line-clamp-2">{user.bio || 'Available for supervision collaboration.'}</p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-850 w-full">
                          {assoc || loadingIds.has(user.id) ? (
                            <div className="flex flex-col gap-2">
                              {assoc?.status === 'PENDING' && assoc.senderId !== currentUser.id ? (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 border-gray-255 dark:border-gray-700 text-red-600 hover:bg-red-50"
                                    onClick={() => updateAssociationStatus(assoc.id, 'DECLINED')}
                                  >
                                    Decline
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
                                    onClick={() => updateAssociationStatus(assoc.id, 'ACCEPTED')}
                                  >
                                    Accept
                                  </Button>
                                </div>
                              ) : (
                                <div className={cn(
                                  "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors",
                                  assoc?.status === 'ACCEPTED' ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" :
                                  "bg-amber-50/70 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                                )}>
                                  {assoc?.status === 'ACCEPTED' ? <UserCheck className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
                                  {assoc?.status === 'ACCEPTED' ? 'Already Connected' : 'Association Request Pending'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button 
                              className="w-full gap-2 py-2.5 rounded-xl border-gray-250 hover:bg-indigo-50/50 hover:border-indigo-300 dark:border-gray-700" 
                              variant="outline"
                              onClick={() => handleAssociate(user.id)}
                            >
                              <UserPlus className="w-4 h-4 text-indigo-500" />
                              Send Association Invite
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {findPeopleUsers.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 max-w-md mx-auto">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserX className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">No available providers found</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-6 mt-1">
                    Try checking spelling or type an email address to invite them to join the portal.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

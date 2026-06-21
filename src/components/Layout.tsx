/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  History, 
  Settings, 
  LogOut, 
  Plus,
  Bell,
  Menu,
  X,
  PenLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Button } from './ui';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DirectHoursModal } from './DirectHoursModal';
import { SupervisionSessionModal } from './SupervisionSessionModal';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { 
    currentUser, 
    logout, 
    associations, 
    users, 
    pendingSignaturesCount, 
    updateUser,
    sessions,
    updateAssociationStatus,
    isDirectModalOpen,
    setDirectModalOpen,
    editingDirectSession,
    setEditingDirectSession,
    isSupervisionModalOpen,
    setSupervisionModalOpen,
    editingSupervisionSession,
    setEditingSupervisionSession
  } = useApp();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  // Accordion open/collapse states
  const [isPeopleExpanded, setIsPeopleExpanded] = React.useState(location.pathname === '/people');
  const [isSettingsExpanded, setIsSettingsExpanded] = React.useState(location.pathname === '/settings');

  // React to route changes to open corresponding accordion sections automatically
  React.useEffect(() => {
    if (location.pathname === '/people') {
      setIsPeopleExpanded(true);
    }
    if (location.pathname === '/settings') {
      setIsSettingsExpanded(true);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) return <>{children}</>;

  const incomingRequests = React.useMemo(() => {
    if (!currentUser || !associations) return [];
    return associations.filter(a => 
      a.status === 'PENDING' && 
      (a.rbtId === currentUser.id || a.bcbaId === currentUser.id) &&
      a.senderId !== currentUser.id
    );
  }, [associations, currentUser?.id]);

  const pendingSignaturesList = React.useMemo(() => {
    if (!currentUser || !sessions) return [];
    return sessions.filter(s => {
      if (s.rbtId === currentUser.id && !s.rbtSignature) return true;
      if (s.bcbaId === currentUser.id && !s.bcbaSignature) return true;
      return false;
    });
  }, [sessions, currentUser?.id]);

  const pendingRequests = incomingRequests.length;
  const totalNotificationsCount = incomingRequests.length + pendingSignaturesList.length;

  return (
    <div className="h-screen overflow-hidden print:h-auto print:overflow-visible bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 transform lg:translate-x-0 lg:static lg:block",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <img 
              src="/abass-icon.png" 
              alt="ABA SuperSync Logo" 
              className="w-10 h-10 object-contain filter drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              SuperSync
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {/* Dashboard */}
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                location.pathname === '/' 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm" 
                  : "text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <LayoutDashboard className={cn(
                "w-5 h-5",
                location.pathname === '/' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              )} />
              Dashboard
            </Link>

            {/* People (Accordion Item) */}
            <div>
              <button
                onClick={() => setIsPeopleExpanded(!isPeopleExpanded)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                  location.pathname === '/people' 
                    ? "bg-indigo-50/60 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Users className={cn(
                    "w-5 h-5",
                    location.pathname === '/people' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )} />
                  <span>People</span>
                  {pendingRequests > 0 && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                      {pendingRequests}
                    </span>
                  )}
                </div>
                {isPeopleExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isPeopleExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden pl-8 pr-2 mt-1 space-y-1 border-l border-gray-100 dark:border-gray-800 ml-5"
                  >
                    <Link
                      to="/people?tab=network"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/people' && (location.search === '' || location.search.includes('tab=network'))
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      My Network
                    </Link>
                    <Link
                      to="/people?tab=find"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/people' && location.search.includes('tab=find')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Find People
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* History */}
            <Link
              to="/history"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                location.pathname === '/history' 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm" 
                  : "text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <History className={cn(
                "w-5 h-5",
                location.pathname === '/history' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              )} />
              History
            </Link>

            {/* Settings (Accordion Item) */}
            <div>
              <button
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                  location.pathname === '/settings' 
                    ? "bg-indigo-50/60 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className={cn(
                    "w-5 h-5",
                    location.pathname === '/settings' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )} />
                  <span>Settings</span>
                </div>
                {isSettingsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isSettingsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden pl-8 pr-2 mt-1 space-y-1 border-l border-gray-100 dark:border-gray-800 ml-5"
                  >
                    <Link
                      to="/settings?tab=profile"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/settings' && location.search.includes('tab=profile')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Full Name
                    </Link>
                    <Link
                      to="/settings?tab=email"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/settings' && location.search.includes('tab=email')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Email Address
                    </Link>
                    <Link
                      to="/settings?tab=certification"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/settings' && location.search.includes('tab=certification')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Certification #
                    </Link>
                    <Link
                      to="/settings?tab=organizations"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/settings' && location.search.includes('tab=organizations')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Organizations
                    </Link>
                    <Link
                      to="/settings?tab=signature"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-2.5 rounded-md text-xs font-semibold transition-all",
                        location.pathname === '/settings' && location.search.includes('tab=signature')
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
                      )}
                    >
                      Signature
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtle Ad Placement */}
            <div className="mt-6 px-2">
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-3 border border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sponsored</span>
                    <span className="text-[7.5px] text-gray-450 dark:text-gray-500 font-medium lowercase tracking-wide italic">(keep it free :))</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="aspect-[16/9] bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative group cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <p className="text-[10px] text-gray-400 font-medium italic text-center px-4 leading-tight group-hover:text-gray-500 transition-colors">
                    AdSense Placement<br/><span className="text-[8px] opacity-60">Subtle Integration</span>
                  </p>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 px-3 py-4">
              <img 
                src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} 
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded inline-block">
                  {currentUser.role}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>



      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto relative">
        <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-all duration-300 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8 dark:text-gray-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <Link to="/history" className="relative group">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative h-8 w-8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all",
                  pendingSignaturesCount > 0 && "text-amber-500 dark:text-amber-400 animate-pulse"
                )}
              >
                {pendingSignaturesCount > 0 ? (
                  <PenLine className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                )}
                {pendingSignaturesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full border border-white dark:border-gray-900">
                    {pendingSignaturesCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3">
             {/* Desktop Actions */}
             <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-xs">
               <Link to="/log-session">
                 <Button className="h-8 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold gap-1.5 px-3 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 text-[11px]">
                   <Plus className="w-3.5 h-3.5" />
                   Supervision
                 </Button>
               </Link>

               {currentUser.role === 'RBT' && (
                 <Button 
                  onClick={() => {
                    setEditingDirectSession(null);
                    setDirectModalOpen(true);
                  }}
                  className="h-8 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold gap-1.5 px-3 rounded-lg shadow-md shadow-teal-200 dark:shadow-none transition-transform active:scale-95 text-[11px]"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Direct
                 </Button>
               )}
             </div>

             {/* Mobile Actions Dropdown */}
             <div className="sm:hidden relative">
                <Button 
                  onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold w-8 h-8 p-0 rounded-lg shadow-md transition-all active:scale-90"
                >
                  <Plus className={cn("w-4 h-4 transition-transform", mobileActionsOpen && "rotate-45")} />
                </Button>

                <AnimatePresence>
                  {mobileActionsOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileActionsOpen(false)}
                        className="fixed inset-0 z-40 bg-black/5"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 z-50 origin-top-right"
                      >
                        <Link 
                          to="/log-session"
                          onClick={() => setMobileActionsOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">Add Supervision</span>
                        </Link>
                        
                        {currentUser.role === 'RBT' && (
                          <button
                            onClick={() => {
                              setEditingDirectSession(null);
                              setDirectModalOpen(true);
                              setMobileActionsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Add Direct</span>
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>

             <div className="relative" ref={notificationsRef}>
               <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative h-8 w-8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all",
                  showNotifications && "bg-gray-150 dark:bg-gray-800/80"
                )}
                onClick={() => setShowNotifications(!showNotifications)}
               >
                  <Bell className="w-4 h-4" />
                  {totalNotificationsCount > 0 && (
                     <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-white dark:border-gray-900 rounded-full"></span>
                  )}
               </Button>

               <AnimatePresence>
                 {showNotifications && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 10 }}
                     transition={{ duration: 0.15 }}
                     className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/85 z-50 overflow-hidden"
                   >
                     <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
                       <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Notifications</span>
                       {totalNotificationsCount > 0 && (
                         <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                           {totalNotificationsCount} New
                         </span>
                       )}
                     </div>

                     <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850/50">
                       {totalNotificationsCount === 0 ? (
                         <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                           <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100/60 dark:border-gray-800/60">
                             <Bell className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                           </div>
                           <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">All caught up!</p>
                           <p className="text-[11px] text-gray-450 dark:text-gray-550">You have no new notifications.</p>
                         </div>
                       ) : (
                         <>
                           {/* Connection Requests */}
                           {incomingRequests.length > 0 && (
                             <div className="p-3 bg-indigo-50/10 dark:bg-indigo-950/5">
                               <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 mb-2">Connection Requests</p>
                               <div className="space-y-1.5">
                                 {incomingRequests.map(assoc => {
                                   const sender = users.find(u => u.id === assoc.senderId);
                                   const senderName = sender?.name || 'Provider Colleague';
                                   const senderAvatar = sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assoc.senderId}`;
                                   const senderRole = sender?.role || (assoc.senderId === assoc.rbtId ? 'RBT' : 'BCBA');
                                   const senderCert = sender?.certificationNumber ? `Cert #${sender.certificationNumber}` : 'Pending Verification';
                                   return (
                                     <div key={assoc.id} className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 flex items-center gap-3">
                                       <img src={senderAvatar} className="w-9 h-9 rounded-full border border-gray-100 dark:border-gray-800" />
                                       <div className="min-w-0 flex-1">
                                         <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{senderName}</p>
                                         <p className="text-[10px] text-gray-500 dark:text-gray-450 truncate">{senderRole} • {senderCert}</p>
                                       </div>
                                       <div className="flex gap-1 shrink-0">
                                         <Button 
                                           size="sm" 
                                           variant="ghost" 
                                           className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 h-7 w-7 rounded-lg"
                                           onClick={() => updateAssociationStatus(assoc.id, 'DECLINED')}
                                         >
                                           <X className="w-4 h-4" />
                                         </Button>
                                         <Button 
                                           size="sm" 
                                           className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold px-2.5 h-7 rounded-lg text-[10px]"
                                           onClick={() => updateAssociationStatus(assoc.id, 'ACCEPTED')}
                                         >
                                           Accept
                                         </Button>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           )}

                           {/* Pending Signatures */}
                           {pendingSignaturesList.length > 0 && (
                             <div className="p-3">
                               <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-2 mb-2">Signatures Needed</p>
                               <div className="space-y-1.5">
                                 {pendingSignaturesList.map(session => {
                                   const displayDate = session.date ? new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';
                                   return (
                                     <div key={session.id} className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 flex items-center justify-between gap-3">
                                       <div className="min-w-0">
                                         <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Supervision Session</p>
                                         <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{displayDate}</p>
                                         <p className="text-[9px] text-gray-500 dark:text-gray-450 truncate">{session.totalHours} hrs • {session.setting}</p>
                                       </div>
                                       <Link to="/history" onClick={() => setShowNotifications(false)}>
                                         <Button 
                                           size="sm" 
                                           className="h-7 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2.5 rounded-lg"
                                         >
                                           Sign
                                         </Button>
                                       </Link>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           )}
                         </>
                       )}
                     </div>

                     <div className="p-2.5 border-t border-gray-150 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/30 text-center">
                       <Link 
                         to="/people" 
                         onClick={() => setShowNotifications(false)}
                         className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block"
                       >
                         View All Network Connections
                       </Link>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto print:static p-4 lg:p-8">
           <motion.div
             key={location.pathname}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-7xl mx-auto"
           >
             {children}
           </motion.div>
        </main>
      </div>

      <DirectHoursModal 
        isOpen={isDirectModalOpen}
        onClose={() => {
          setDirectModalOpen(false);
          setEditingDirectSession(null);
        }}
        editSession={editingDirectSession}
      />

      <SupervisionSessionModal 
        isOpen={isSupervisionModalOpen}
        onClose={() => {
          setSupervisionModalOpen(false);
          setEditingSupervisionSession(null);
        }}
        session={editingSupervisionSession}
      />

      {/* AdSense Script Placeholder (Requires real Publisher ID and Domain Verification) */}
      {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script> */}
    </div>
  );
};

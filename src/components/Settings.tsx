/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button, Input } from './ui';
import { SignaturePad } from './SignaturePad';
import { 
  User, 
  Mail, 
  Award, 
  PenTool, 
  Check, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

export const SettingsView = () => {
  const { currentUser, updateUser, resetDatabase, isAdmin, deleteAccount } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Align active tab with url parameter or default to 'profile'
  const activeTabFromUrl = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // States for name & email & cert
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState(currentUser?.email || '');
  const [certNumber, setCertNumber] = React.useState(currentUser?.certificationNumber || '');
  
  // Validation, status & loading state
  const [loading, setLoading] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || '').trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(currentUser.email || '');
      setCertNumber(currentUser.certificationNumber || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleUpdateField = async (fields: Record<string, any>, successMsg: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      await updateUser(fields);
      setStatusMessage({ type: 'success', text: successMsg });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setStatusMessage({ type: 'error', text: 'First name and Last name cannot be empty' });
      return;
    }
    const combined = `${firstName.trim()} ${lastName.trim()}`;
    handleUpdateField({ name: combined }, 'Your name has been updated successfully!');
  };

  const saveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    handleUpdateField({ email: email.trim() }, 'Your email address has been updated successfully!');
  };

  const saveCertification = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateField({ certificationNumber: certNumber.trim() }, 'Your certification number has been updated!');
  };

  const saveSignature = (dataUrl: string) => {
    handleUpdateField({ signature: dataUrl }, 'Your professional signature has been registered and updated!');
  };

  const handleSystemReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    
    setLoading(true);
    setStatusMessage(null);
    try {
      console.log('UI: Initiating system reset request...');
      await resetDatabase();
    } catch (e: any) {
      console.error('System reset error in UI:', e);
      setStatusMessage({ type: 'error', text: `Reset failed: ${e.message || 'Unknown error'}` });
      setLoading(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Portal Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage credentials, details, and signatures required for clinical audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-1.5">
          <TabButton 
            active={activeTabFromUrl === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User className="w-4 h-4 shrink-0" />} 
            label="Full Name" 
          />
          <TabButton 
            active={activeTabFromUrl === 'email'} 
            onClick={() => setActiveTab('email')} 
            icon={<Mail className="w-4 h-4 shrink-0" />} 
            label="Email" 
          />
          <TabButton 
            active={activeTabFromUrl === 'certification'} 
            onClick={() => setActiveTab('certification')} 
            icon={<Award className="w-4 h-4 shrink-0" />} 
            label="Certification #" 
          />
          <TabButton 
            active={activeTabFromUrl === 'signature'} 
            onClick={() => setActiveTab('signature')} 
            icon={<PenTool className="w-4 h-4 shrink-0" />} 
            label="Signature" 
          />
          <TabButton 
            active={activeTabFromUrl === 'delete-account'} 
            onClick={() => setActiveTab('delete-account')} 
            icon={<Trash2 className="w-4 h-4 shrink-0" />} 
            label="Delete Account" 
            variant="danger"
          />

          {isAdmin && (
            <TabButton 
              active={activeTabFromUrl === 'system'} 
              onClick={() => setActiveTab('system')} 
              icon={<Trash2 className="w-4 h-4 shrink-0" />} 
              label="Reset System" 
              variant="danger"
            />
          )}
        </aside>

        <main className="md:col-span-3">
          <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-sm relative overflow-hidden">
            <AnimatePresence>
              {statusMessage && (
                <StatusMessage type={statusMessage.type} text={statusMessage.text} />
              )}
            </AnimatePresence>

            {activeTabFromUrl === 'profile' && (
              <ProfileTab firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} saveName={saveName} loading={loading} />
            )}

            {activeTabFromUrl === 'email' && (
              <EmailTab email={email} setEmail={setEmail} saveEmail={saveEmail} loading={loading} />
            )}

            {activeTabFromUrl === 'certification' && (
              <CertificationTab certNumber={certNumber} setCertNumber={setCertNumber} saveCertification={saveCertification} loading={loading} />
            )}

            {activeTabFromUrl === 'signature' && (
              <SignatureTab signature={currentUser.signature} onSave={saveSignature} />
            )}

            {activeTabFromUrl === 'delete-account' && (
              <DeleteAccountTab loading={loading} deleteAccount={deleteAccount} />
            )}

            {activeTabFromUrl === 'system' && isAdmin && (
              <SystemResetTab loading={loading} confirmReset={confirmReset} setConfirmReset={setConfirmReset} onReset={handleSystemReset} />
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

// --- Sub-components for Cleaner Organization ---

const TabButton = ({ active, onClick, icon, label, variant = 'default' }: any) => {
  const baseClasses = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left";
  const activeClasses = variant === 'danger' 
    ? "bg-red-600 text-white shadow-md shadow-red-100 dark:shadow-none"
    : "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none";
  
  const inactiveClasses = variant === 'danger'
    ? "text-red-500/80 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300"
    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200";

  return (
    <button onClick={onClick} className={cn(baseClasses, active ? activeClasses : inactiveClasses)}>
      {icon}
      {label}
    </button>
  );
};

const StatusMessage = ({ type, text }: { type: 'success' | 'error', text: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
      type === 'success' 
        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
        : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900/40"
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
    <p className="text-sm font-semibold">{text}</p>
  </motion.div>
);

const ProfileTab = ({ firstName, setFirstName, lastName, setLastName, saveName, loading }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clinical Profile Name</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Update your clinical directory name for formal audits.</p>
    </div>
    <form onSubmit={saveName} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <Input required className="pl-11 h-11 bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <Input required className="pl-11 h-11 bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6">Save Changes</Button>
    </form>
  </motion.div>
);

const EmailTab = ({ email, setEmail, saveEmail, loading }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Address</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Manage your connected address for professional synchronization.</p>
    </div>
    <form onSubmit={saveEmail} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <Input required type="email" className="pl-11 h-11 bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6">Update Email Address</Button>
    </form>
  </motion.div>
);

const CertificationTab = ({ certNumber, setCertNumber, saveCertification, loading }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Behavior Analyst Certification</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Manage your BACB Certification ID number.</p>
    </div>
    <form onSubmit={saveCertification} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Certification Number</label>
        <div className="relative">
          <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <Input className="pl-11 h-11 bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 1-19-35489" value={certNumber} onChange={e => setCertNumber(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6">Save Certification ID</Button>
    </form>
  </motion.div>
);

const SignatureTab = ({ signature, onSave }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit Signature</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Register your formal professional sign-off.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Current Saved Signature</h4>
        {signature ? (
          <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner flex items-center justify-center max-w-md">
            <img src={signature} alt="Professional Sign-off" className="max-h-24 object-contain" />
          </div>
        ) : (
          <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-dashed border-amber-200/65 dark:border-amber-900/30 p-5 rounded-xl flex items-start gap-3 max-w-md">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">No Signature Found</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-500/85">Please draw your signature to complete validation paperwork.</p>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Draw / Update Signature</h4>
        <SignaturePad initialData={signature} onSave={onSave} />
      </div>
    </div>
  </motion.div>
);

const SystemResetTab = ({ loading, confirmReset, setConfirmReset, onReset }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
    <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl">
      <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
        <Trash2 className="w-6 h-6" />
        <h3 className="text-xl font-bold">System Purge (Factory Reset)</h3>
      </div>
      <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-6">
        Performing a system reset will permanently delete every record from the database. This action is intended for migrations or fresh development cycles.
      </p>
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button onClick={onReset} disabled={loading} className={cn("h-12 px-8 shadow-lg font-bold border-0 transition-all", confirmReset ? "bg-red-700 hover:bg-red-800 scale-105" : "bg-red-600 hover:bg-red-700")}>
            {loading ? "Wiping Data..." : confirmReset ? "CONFIRM: Purge All Data" : "Purge All Data"}
          </Button>
          {confirmReset && !loading && (
            <button onClick={() => setConfirmReset(false)} className="text-xs text-gray-500 hover:text-gray-700 underline font-medium">Cancel Reset</button>
          )}
        </div>
        <p className="text-[10px] text-red-400 dark:text-red-600 uppercase font-bold tracking-widest">Caution: This will log you out and clear all remote datastores.</p>
      </div>
    </div>
  </motion.div>
);

const DeleteAccountTab = ({ loading, deleteAccount }: { loading: boolean, deleteAccount: () => Promise<void> }) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [typedConfirm, setTypedConfirm] = React.useState('');
  const [errorLocal, setErrorLocal] = React.useState('');

  const handleDelete = async () => {
    if (typedConfirm !== 'DELETE') {
      setErrorLocal('Please type DELETE to confirm transaction.');
      return;
    }
    setErrorLocal('');
    try {
      await deleteAccount();
    } catch (err: any) {
      setErrorLocal(err.message || 'An error occurred during account deletion.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
          <Trash2 className="w-6 h-6" />
          <h3 className="text-xl font-bold">Delete Account</h3>
        </div>
        
        <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-4">
          Deleting your account is permanent and irreversible. Your active professional associations and direct service logs will be removed immediately.
        </p>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl mb-6">
          <p className="text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">Signed Documents & Historical Data Integrity</p>
          <p className="text-xs text-amber-700 dark:text-amber-500/90 leading-relaxed">
            In compliance with clinical auditing requirements, any finished forms or logs you have already signed will be preserved. Your name, certification number, role, and state will remain embedded inside those locked forms, while your active credential/user record is deleted.
          </p>
        </div>

        {errorLocal && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs font-bold rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="leading-snug">{errorLocal}</p>
          </div>
        )}

        <div className="space-y-4">
          {!confirmDelete ? (
            <Button 
              onClick={() => setConfirmDelete(true)} 
              disabled={loading} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-6 shadow"
            >
              Initiate Account Deletion
            </Button>
          ) : (
            <div className="space-y-3 max-w-sm">
              <label className="text-[10px] font-black uppercase tracking-wider text-red-500 block">
                Type <span className="font-mono text-xs font-black select-none text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-1 py-0.5 rounded">DELETE</span> to confirm permanent deletion:
              </label>
              <Input 
                value={typedConfirm} 
                onChange={(e) => setTypedConfirm(e.target.value)} 
                placeholder="DELETE" 
                className="h-11 bg-white border-red-200 dark:border-red-900 focus:ring-2 focus:ring-red-500 text-red-700"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleDelete} 
                  disabled={loading || typedConfirm !== 'DELETE'} 
                  className="bg-red-700 hover:bg-red-800 text-white font-bold h-11 flex-1 shadow"
                >
                  {loading ? 'Deleting...' : 'Permanent Delete'}
                </Button>
                <Button 
                  onClick={() => { setConfirmDelete(false); setTypedConfirm(''); setErrorLocal(''); }} 
                  variant="outline" 
                  className="h-11 flex-1 border-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

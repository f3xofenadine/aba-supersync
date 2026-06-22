/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Button, Input } from './ui';
import { SignaturePad } from './SignaturePad';
import { User as UserType } from '../types';
import { 
  User, 
  Mail, 
  Award, 
  PenTool, 
  Check, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  Trash2,
  Building2,
  X,
  Users,
  Search,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

export const SettingsView = () => {
  const { currentUser, updateUser, resetDatabase, isAdmin, deleteAccount, users, adminDeleteUser } = useApp();
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
  const [orgInput, setOrgInput] = React.useState('');

  const currentUserOrgs = currentUser?.organizations || [];

  const existingOrgs = React.useMemo(() => {
    const orgSet = new Set<string>();
    users.forEach(u => {
      if (u.organizations && Array.isArray(u.organizations)) {
        u.organizations.forEach(o => {
          if (o && o.trim()) {
            orgSet.add(o.trim());
          }
        });
      }
    });
    return Array.from(orgSet);
  }, [users]);

  const orgSuggestions = React.useMemo(() => {
    if (!orgInput.trim()) return [];
    const query = orgInput.toLowerCase();
    return existingOrgs.filter(org => 
      org.toLowerCase().includes(query) && 
      !currentUserOrgs.some((tag: string) => tag.toLowerCase() === org.toLowerCase())
    );
  }, [orgInput, existingOrgs, currentUserOrgs]);

  const handleAddOrg = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (currentUserOrgs.some((t: string) => t.toLowerCase() === trimmed.toLowerCase())) {
      setOrgInput('');
      return;
    }
    const updated = [...currentUserOrgs, trimmed];
    await handleUpdateField({ organizations: updated }, 'Added company association!');
    setOrgInput('');
  };

  const handleRemoveOrg = async (indexToRemove: number) => {
    const updated = currentUserOrgs.filter((_: any, idx: number) => idx !== indexToRemove);
    await handleUpdateField({ organizations: updated }, 'Removed company association.');
  };

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
            active={activeTabFromUrl === 'organizations'} 
            onClick={() => setActiveTab('organizations')} 
            icon={<Building2 className="w-4 h-4 shrink-0" />} 
            label="Organizations" 
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
            <>
              <TabButton 
                active={activeTabFromUrl === 'users'} 
                onClick={() => setActiveTab('users')} 
                icon={<Users className="w-4 h-4 shrink-0" />} 
                label="Registered Users" 
              />
              <TabButton 
                active={activeTabFromUrl === 'system'} 
                onClick={() => setActiveTab('system')} 
                icon={<Trash2 className="w-4 h-4 shrink-0" />} 
                label="Reset System" 
                variant="danger"
              />
            </>
          )}
        </aside>

        <main className="md:col-span-3">
          <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-sm relative overflow-visible">
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

            {activeTabFromUrl === 'organizations' && (
              <OrganizationsTab 
                list={currentUserOrgs} 
                onAdd={handleAddOrg} 
                onRemove={handleRemoveOrg} 
                suggestions={orgSuggestions} 
                inputValue={orgInput} 
                setInputValue={setOrgInput} 
                loading={loading} 
              />
            )}

            {activeTabFromUrl === 'signature' && (
              <SignatureTab signature={currentUser.signature} onSave={saveSignature} />
            )}

            {activeTabFromUrl === 'delete-account' && (
              <DeleteAccountTab loading={loading} deleteAccount={deleteAccount} />
            )}

            {activeTabFromUrl === 'users' && isAdmin && (
              <UsersTab users={users} adminDeleteUser={adminDeleteUser} />
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

const OrganizationsTab = ({ list, onAdd, onRemove, suggestions, inputValue, setInputValue, loading }: any) => (
  <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Company & Organization List</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Manage company or organization affiliations. Providers who share organizations will be high-confidence recommended matches.</p>
    </div>

    <div className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">My Connected Organizations</label>
        {list.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-3.5 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800/80 rounded-xl">
            {list.map((tag: string, idx: number) => (
              <div 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800/40"
              >
                <span>{tag}</span>
                <button 
                  type="button" 
                  onClick={() => onRemove(idx)} 
                  className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/60 inline-flex items-center justify-center text-indigo-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-850/20 text-xs text-start text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-150 dark:border-gray-800 rounded-xl">
            You haven't listed any company/organization associations. Add them below!
          </div>
        )}
      </div>

      <div className="pt-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Add Association</label>
          <div className="relative">
            <div className="flex gap-2">
              <Input 
                className="bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500 h-11" 
                placeholder="Type and press Add/Enter..." 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAdd(inputValue);
                  }
                }}
              />
              <Button onClick={() => onAdd(inputValue)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shrink-0">
                Add
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-xl shadow-lg divide-y divide-gray-50 dark:divide-gray-800">
                <div className="p-2 text-[10px] uppercase tracking-wider font-extrabold text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">Existing Organizations</div>
                {suggestions.map((org: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAdd(org)}
                    className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 font-medium transition-colors flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{org}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Selecting from Suggestions avoids spelling discrepancies and aligns recommendation engines.</p>
        </div>
      </div>
    </div>
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

// --- Admin-only Tab: Registered Users List ---
interface UsersTabProps {
  users: UserType[];
  adminDeleteUser: (targetUserId: string) => Promise<void>;
}

const UsersTab = ({ users, adminDeleteUser }: UsersTabProps) => {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');

  // Deletion States
  const [deletingUser, setDeletingUser] = React.useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorLocal, setErrorLocal] = React.useState('');

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      const nameMatch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const certMatch = (u.certificationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const orgMatch = (u.organizations || []).some(o => o.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSearch = nameMatch || emailMatch || certMatch || orgMatch;
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setErrorLocal('');
    try {
      await adminDeleteUser(deletingUser.id);
      setDeletingUser(null);
    } catch (err: any) {
      setErrorLocal(err.message || 'Failed to delete clinician record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registered Clinicians Portal</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">View and audit active users, registered emails, credentials, and affiliations.</p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 self-start sm:self-auto">
          {filteredUsers.length} Clinicians Listed
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            className="pl-9 h-10 bg-gray-50/50 dark:bg-gray-800/40 focus:ring-2 focus:ring-indigo-500 text-xs" 
            placeholder="Search by name, email, BACB cert #, or organization..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-150 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-800/40 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="BCBA">BCBA</option>
            <option value="BCBA-D">BCBA-D</option>
            <option value="RBT">RBT</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 dark:border-gray-800/65 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3.5">Clinician</th>
              <th className="px-4 py-3.5">Contact Detail (Email)</th>
              <th className="px-4 py-3.5">Clinical Credentials</th>
              <th className="px-4 py-3.5">Affiliated Companies</th>
              <th className="px-4 py-3.5">Registration Date</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/65 font-medium">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 text-xs transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100/40 dark:border-indigo-900/30">
                        {(user.name || 'C').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white leading-snug">{user.name || 'Anonymous User'}</div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5 select-all">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono select-all text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded-md border",
                        user.role?.includes('BCBA') 
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                          : user.role === 'ADMIN'
                          ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                      )}>
                        {user.role}
                      </span>
                      {user.certificationNumber && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold dark:text-gray-400">
                          <Award className="w-3 h-3 text-indigo-500" />
                          <span>{user.certificationNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {user.organizations && user.organizations.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.organizations.map((org, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                            <Building2 className="w-2.5 h-2.5 text-gray-400" />
                            <span>{org}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No organizations</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-gray-500 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          setDeletingUser(user);
                          setErrorLocal('');
                        }}
                        className="p-1.5 h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg inline-flex items-center justify-center transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40"
                        title="Delete User Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                  No clinicians found matching the filter query
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Confirmation Modal overlay */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">Confirm User Deletion</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    You are trying to delete the user profile for <span className="font-bold text-gray-900 dark:text-white">{deletingUser.name || deletingUser.email}</span>.
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 p-2.5 rounded-lg leading-relaxed">
                    Warning: This will purge their personal profile document, professional supervisor links, and private direct data templates permanently logs.
                  </p>
                </div>
              </div>

              {errorLocal && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/35">
                  {errorLocal}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => setDeletingUser(null)}
                  variant="outline"
                  className="flex-1 h-10 border-gray-200 dark:border-gray-800 text-xs font-bold"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white border-0 text-xs font-bold"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

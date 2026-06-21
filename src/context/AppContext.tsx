/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Association, SupervisionSession, AssociationStatus, DirectSession } from '../types';
import { auth, db, signInWithGoogle, signInWithGoogleRedirect, getRedirectResult } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

interface AppContextType {
  users: User[];
  sessions: SupervisionSession[];
  directSessions: DirectSession[];
  associations: Association[];
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithRedirect: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: Partial<User>) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  createAssociation: (bcbaId: string) => Promise<void>;
  updateAssociationStatus: (assocId: string, status: AssociationStatus) => Promise<void>;
  removeAssociation: (assocId: string) => Promise<void>;
  saveSession: (session: Partial<SupervisionSession>) => Promise<string>;
  saveDirectSession: (session: Partial<DirectSession>) => Promise<string>;
  deleteDirectSession: (sessionId: string) => Promise<void>;
  requestSessionDeletion: (sessionId: string) => Promise<void>;
  approveSessionDeletion: (sessionId: string) => Promise<void>;
  cancelSessionDeletion: (sessionId: string) => Promise<void>;
  signSession: (sessionId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  pendingSignaturesCount: number;
  isAdmin: boolean;
  isDirectModalOpen: boolean;
  setDirectModalOpen: (open: boolean) => void;
  editingDirectSession: DirectSession | null;
  setEditingDirectSession: (session: DirectSession | null) => void;
  isSupervisionModalOpen: boolean;
  setSupervisionModalOpen: (open: boolean) => void;
  editingSupervisionSession: SupervisionSession | null;
  setEditingSupervisionSession: (session: SupervisionSession | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<SupervisionSession[]>([]);
  const [directSessions, setDirectSessions] = useState<DirectSession[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDirectModalOpen, setDirectModalOpen] = useState(false);
  const [editingDirectSession, setEditingDirectSession] = useState<DirectSession | null>(null);
  const [isSupervisionModalOpen, setSupervisionModalOpen] = useState(false);
  const [editingSupervisionSession, setEditingSupervisionSession] = useState<SupervisionSession | null>(null);

  const isAdmin = firebaseUser?.email === "f3xofenadine@gmail.com";

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Handle Redirect Result
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect login successful:", result.user);
        }
      })
      .catch((error) => {
        console.error("Error in redirect login flow:", error);
      });
  }, []);

  // Sync Current User Profile
  useEffect(() => {
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUser(doc.data() as User);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [firebaseUser]);

  // Sync Global Data
  useEffect(() => {
    if (!currentUser) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as User));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubAssoc = onSnapshot(
      query(collection(db, 'associations'), where('participants', 'array-contains', currentUser.id)),
      (snapshot) => {
        setAssociations(snapshot.docs.map(d => d.data() as Association));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'associations');
      }
    );

    const unsubSessions = onSnapshot(
      query(collection(db, 'sessions'), where('participants', 'array-contains', currentUser.id)),
      (snapshot) => {
        setSessions(snapshot.docs.map(d => d.data() as SupervisionSession));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sessions');
      }
    );

    const unsubDirect = onSnapshot(
      query(collection(db, 'direct_sessions'), where('rbtId', '==', currentUser.id)),
      (snapshot) => {
        setDirectSessions(snapshot.docs.map(d => d.data() as DirectSession));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'direct_sessions');
      }
    );

    return () => {
      unsubUsers();
      unsubAssoc();
      unsubSessions();
      unsubDirect();
    };
  }, [currentUser]);

  const cleanData = (data: any) => {
    const clean = { ...data };
    Object.keys(clean).forEach(key => (clean[key] === undefined || clean[key] === null) && delete clean[key]);
    return clean;
  };

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithRedirect = async () => {
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signup = async (userData: Partial<User>) => {
    if (!firebaseUser) return;
    
    // Let clinical role be chosen, while administrative access is preserved in the UI/context via isAdmin helper
    const assignedRole = userData.role || "RBT";

    const newUser = cleanData({
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userData.name || firebaseUser.displayName || 'Anonymous',
      role: assignedRole,
      certificationNumber: userData.certificationNumber,
      state: userData.state,
      avatar: userData.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
      createdAt: Date.now(),
      ...userData
    });
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const createAssociation = async (targetUserId: string) => {
    if (!currentUser) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const assocRef = doc(collection(db, 'associations'));
    
    // Determine RBT and BCBA based on roles and enforce validation
    let rbtId = '';
    let bcbaId = '';
    
    const currentUserRole = currentUser.role;
    const targetRole = targetUser.role;
    const isCurrentUserBcba = currentUserRole === 'BCBA' || currentUserRole === 'BCBA-D';
    const isTargetBcba = targetRole === 'BCBA' || targetRole === 'BCBA-D';
    const isCurrentUserRbt = currentUserRole === 'RBT';
    const isTargetRbt = targetRole === 'RBT';

    if (isCurrentUserRbt && isTargetBcba) {
      rbtId = currentUser.id;
      bcbaId = targetUserId;
    } else if (isCurrentUserBcba && isTargetRbt) {
      bcbaId = currentUser.id;
      rbtId = targetUserId;
    } else {
      console.warn('Supervision association rejected: Only BCBA and RBT pairs are permitted.');
      throw new Error('Incompatible roles: Only BCBA to RBT associations are permitted.');
    }

    const newAssoc = {
      id: assocRef.id,
      rbtId,
      bcbaId,
      status: 'PENDING',
      senderId: currentUser.id,
      participants: [currentUser.id, targetUserId],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await setDoc(assocRef, newAssoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'associations');
    }
  };

  const updateAssociationStatus = async (assocId: string, status: AssociationStatus) => {
    try {
      await updateDoc(doc(db, 'associations', assocId), { 
        status, 
        updatedAt: Date.now() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `associations/${assocId}`);
    }
  };

  const removeAssociation = async (assocId: string) => {
    try {
      await deleteDoc(doc(db, 'associations', assocId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `associations/${assocId}`);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), cleanData(userData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const saveSession = async (session: Partial<SupervisionSession>) => {
    if (!currentUser) throw new Error("Not logged in");
    
    const sessRef = session.id ? doc(db, 'sessions', session.id) : doc(collection(db, 'sessions'));
    const id = sessRef.id;
    
    const signatureUpdate: Partial<SupervisionSession> = {};
    if (currentUser.role === 'RBT' && currentUser.signature && !session.rbtSignature) {
      signatureUpdate.rbtSignature = currentUser.signature;
      signatureUpdate.rbtSignedAt = Date.now();
    } else if ((currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D') && currentUser.signature && !session.bcbaSignature) {
      signatureUpdate.bcbaSignature = currentUser.signature;
      signatureUpdate.bcbaSignedAt = Date.now();
    }

    // Validate roles for supervision sessions
    const rbt = users.find(u => u.id === session.rbtId);
    const bcba = users.find(u => u.id === session.bcbaId);

    if (rbt && rbt.role !== 'RBT') {
      throw new Error('Invalid record: The selected clinician must have the RBT role.');
    }
    if (bcba && bcba.role !== 'BCBA' && bcba.role !== 'BCBA-D') {
      throw new Error('Invalid record: The selected supervisor must have a BCBA/BCBA-D role.');
    }

    const embeddedDetails: any = {};
    if (rbt) {
      embeddedDetails.rbtName = rbt.name;
      embeddedDetails.rbtCertification = rbt.certificationNumber || '';
      embeddedDetails.rbtRole = rbt.role;
      embeddedDetails.rbtState = rbt.state || '';
    }
    if (bcba) {
      embeddedDetails.bcbaName = bcba.name;
      embeddedDetails.bcbaCertification = bcba.certificationNumber || '';
      embeddedDetails.bcbaRole = bcba.role;
      embeddedDetails.bcbaState = bcba.state || '';
    }

    const sessionData: any = {
      ...session,
      id,
      status: session.status || 'DRAFT',
      participants: [session.rbtId || currentUser.id, session.bcbaId || currentUser.id].filter(Boolean),
      ...signatureUpdate,
      ...embeddedDetails
    };

    // Clean data
    const finalData = cleanData(sessionData);

    try {
      await setDoc(sessRef, finalData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sessions/${id}`);
    }
    return id;
  };

  const saveDirectSession = async (session: Partial<DirectSession>) => {
    if (!currentUser) throw new Error("Not logged in");
    
    const sessRef = session.id ? doc(db, 'direct_sessions', session.id) : doc(collection(db, 'direct_sessions'));
    const id = sessRef.id;
    
    const sessionData: any = {
      ...session,
      id,
      rbtId: currentUser.id,
      createdAt: session.createdAt || Date.now(),
    };

    const finalData = cleanData(sessionData);

    try {
      await setDoc(sessRef, finalData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `direct_sessions/${id}`);
    }
    return id;
  };

  const deleteDirectSession = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db, 'direct_sessions', sessionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `direct_sessions/${sessionId}`);
    }
  };
  
  const requestSessionDeletion = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { 
        deleteRequestedBy: currentUser.id 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  };

  const approveSessionDeletion = async (sessionId: string) => {
    if (!currentUser) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.deleteRequestedBy || session.deleteRequestedBy === currentUser.id) return;
    
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sessions/${sessionId}`);
    }
  };

  const cancelSessionDeletion = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { 
        deleteRequestedBy: null 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  };

  const signSession = async (sessionId: string) => {
    if (!currentUser || !currentUser.signature) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const signatureUpdate: any = {};
    if (currentUser.role === 'RBT') {
      signatureUpdate.rbtSignature = currentUser.signature;
      signatureUpdate.rbtSignedAt = Date.now();
      signatureUpdate.rbtName = currentUser.name;
      signatureUpdate.rbtCertification = currentUser.certificationNumber || '';
      signatureUpdate.rbtRole = currentUser.role;
      signatureUpdate.rbtState = currentUser.state || '';
    } else {
      signatureUpdate.bcbaSignature = currentUser.signature;
      signatureUpdate.bcbaSignedAt = Date.now();
      signatureUpdate.bcbaName = currentUser.name;
      signatureUpdate.bcbaCertification = currentUser.certificationNumber || '';
      signatureUpdate.bcbaRole = currentUser.role;
      signatureUpdate.bcbaState = currentUser.state || '';
    }

    const hasRbt = signatureUpdate.rbtSignature || session.rbtSignature;
    const hasBcba = signatureUpdate.bcbaSignature || session.bcbaSignature;
    
    let status = session.status;
    if (hasRbt && hasBcba) status = 'COMPLETED';
    else if (hasRbt) status = 'SIGNED_BY_RBT';
    else if (hasBcba) status = 'SIGNED_BY_BCBA';

    signatureUpdate.status = status;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), signatureUpdate);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  };

  const resetDatabase = async () => {
    if (!firebaseUser || !isAdmin) {
      console.warn('Reset aborted: Unauthorized or no session.');
      return;
    }
    
    try {
      const collectionsToReset = ['sessions', 'direct_sessions', 'associations', 'users'];
      
      for (const colName of collectionsToReset) {
        const querySnapshot = await getDocs(collection(db, colName));
        
        if (!querySnapshot.empty) {
          const docs = querySnapshot.docs;
          
          let sortedDocs = [...docs];
          if (colName === 'users' && firebaseUser) {
            sortedDocs = docs.filter(d => d.id !== firebaseUser.uid);
            const currentUserDoc = docs.find(d => d.id === firebaseUser.uid);
            if (currentUserDoc) sortedDocs.push(currentUserDoc);
          }

          for (let i = 0; i < sortedDocs.length; i += 450) {
            const chunk = sortedDocs.slice(i, i + 450);
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            
            try {
              await batch.commit();
            } catch (batchErr: any) {
              for (const doc of chunk) {
                try {
                  await deleteDoc(doc.ref);
                } catch (singleErr) {
                  // Silently continue or handle critical failure
                }
              }
            }
          }
        }
      }
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Cache clear fail is non-blocking
      }
      
      window.location.href = '/'; 
      await logout();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, 'bulk-reset');
    }
  };

  const deleteAccount = async () => {
    if (!currentUser || !firebaseUser) return;
    const userId = currentUser.id;

    try {
      // 1. Fetch all supervision sessions of this user
      const sessionsSnapshot = await getDocs(
        query(collection(db, 'sessions'), where('participants', 'array-contains', userId))
      );

      // 2. Archive their identity on all their sessions (including completed ones!)
      if (!sessionsSnapshot.empty) {
        const batch = writeBatch(db);
        sessionsSnapshot.docs.forEach((docSnap) => {
          const s = docSnap.data();
          const updateData: any = {};
          if (s.rbtId === userId) {
            updateData.rbtName = currentUser.name;
            updateData.rbtCertification = currentUser.certificationNumber || '';
            updateData.rbtRole = currentUser.role;
            updateData.rbtState = currentUser.state || '';
          }
          if (s.bcbaId === userId) {
            updateData.bcbaName = currentUser.name;
            updateData.bcbaCertification = currentUser.certificationNumber || '';
            updateData.bcbaRole = currentUser.role;
            updateData.bcbaState = currentUser.state || '';
          }
          batch.update(docSnap.ref, updateData);
        });
        await batch.commit();
      }

      // 3. Delete any professional associations holding this user
      const assocSnapshot = await getDocs(
        query(collection(db, 'associations'), where('participants', 'array-contains', userId))
      );
      if (!assocSnapshot.empty) {
        const batch = writeBatch(db);
        assocSnapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      // 4. Delete their private direct sessions (if any)
      const directSnapshot = await getDocs(
        query(collection(db, 'direct_sessions'), where('rbtId', '==', userId))
      );
      if (!directSnapshot.empty) {
        const batch = writeBatch(db);
        directSnapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      // 5. Delete their user profile doc in Firestore
      await deleteDoc(doc(db, 'users', userId));

      // 6. Delete user from Firebase Authentication
      await deleteUser(firebaseUser);

      // 7. Clear storage cache and redirect to home page
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      window.location.href = '/';
    } catch (error: any) {
      if (error && error.code === 'auth/requires-recent-login') {
        throw new Error('For security reasons, deleting your account requires a recent login. Please log out, log back in, and try again.');
      }
      handleFirestoreError(error, OperationType.DELETE, `account-deletion-${userId}`);
    }
  };

  const pendingSignaturesCount = currentUser ? sessions.filter(s => {
    const isRBT = currentUser.role === 'RBT';
    const isBCBA = currentUser.role === 'BCBA' || currentUser.role === 'BCBA-D';
    if (isRBT && s.rbtId === currentUser.id && !s.rbtSignature) return true;
    if (isBCBA && s.bcbaId === currentUser.id && !s.bcbaSignature) return true;
    return false;
  }).length : 0;

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  
  const monthlyDirectHours = useMemo(() => {
    if (!currentUser || currentUser.role !== 'RBT') return 0;
    
    let total = 0;
    
    // Add manual supplemental hours if present for this month
    if (currentUser.manualMonthlyDirectHours && currentUser.manualMonthlyDirectHours[currentMonth]) {
      total += currentUser.manualMonthlyDirectHours[currentMonth];
    }
    
    const items = directSessions.filter(s => s.date.startsWith(currentMonth));
    const totalMinutes = items.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    total += totalMinutes / 60;

    return Math.round(total * 10) / 10;
  }, [directSessions, currentUser, currentMonth]);

  // Sync monthlyDirectHours to Firestore user profile for BCBA visibility
  useEffect(() => {
    if (currentUser && currentUser.role === 'RBT' && monthlyDirectHours !== currentUser.monthlyDirectHours) {
      const userRef = doc(db, 'users', currentUser.id);
      updateDoc(userRef, { monthlyDirectHours }).catch(err => {
        console.error("Failed to sync monthlyDirectHours:", err);
      });
    }
  }, [monthlyDirectHours, currentUser]);

  return (
    <AppContext.Provider value={{
      users,
      sessions,
      directSessions,
      associations,
      currentUser: currentUser ? { ...currentUser, monthlyDirectHours } : null,
      firebaseUser,
      loading,
      login,
      loginWithRedirect,
      loginWithEmail,
      signupWithEmail,
      logout,
      signup,
      updateUser,
      createAssociation,
      updateAssociationStatus,
      removeAssociation,
      saveSession,
      saveDirectSession,
      deleteDirectSession,
      requestSessionDeletion,
      approveSessionDeletion,
      cancelSessionDeletion,
      signSession,
      deleteAccount,
      resetDatabase,
      pendingSignaturesCount,
      isAdmin,
      isDirectModalOpen,
      setDirectModalOpen,
      editingDirectSession,
      setEditingDirectSession,
      isSupervisionModalOpen,
      setSupervisionModalOpen,
      editingSupervisionSession,
      setEditingSupervisionSession
    }}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContent = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContent must be used within AppProvider');
  return context;
};

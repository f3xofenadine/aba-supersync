/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Global declaration to augment the standard ImportMeta interface with Vite's env property
declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}
 
// Helper to sanitize environment variables or local configs (handling wrapped quotes, empty strings, and placeholders)
function cleanValue(val: any): string | undefined {
  if (typeof val !== 'string') return undefined;
  let trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  
  // Remove enclosing quotes if any
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;

  // Filter out placeholder templates (e.g. from copy-pasted .env.example)
  const isPlaceholder = 
    trimmed.includes('your-') || 
    trimmed === 'AIza...' || 
    trimmed.includes('1:123456789') || 
    trimmed.includes('abcdef...') ||
    trimmed === '123456789';

  if (isPlaceholder) {
    return undefined;
  }
  
  return trimmed;
}

// We MUST use direct static import.meta.env properties so that the Vite build-time static replacement
// compiles properly and pulls the production (Vercel) config if available!
const vApiKey = cleanValue(import.meta.env.VITE_FIREBASE_API_KEY);
const vAuthDomain = cleanValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const vProjectId = cleanValue(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const vStorageBucket = cleanValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const vMessagingSenderId = cleanValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const vAppId = cleanValue(import.meta.env.VITE_FIREBASE_APP_ID);
const vMeasurementId = cleanValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);
const vDatabaseId = cleanValue(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);

const firebaseConfig = {
  apiKey: vApiKey || cleanValue(localConfig.apiKey) || '',
  authDomain: vAuthDomain || cleanValue(localConfig.authDomain) || '',
  projectId: vProjectId || cleanValue(localConfig.projectId) || '',
  storageBucket: vStorageBucket || cleanValue(localConfig.storageBucket) || '',
  messagingSenderId: vMessagingSenderId || cleanValue(localConfig.messagingSenderId) || '',
  appId: vAppId || cleanValue(localConfig.appId) || '',
  measurementId: vMeasurementId || cleanValue(localConfig.measurementId) || '',
};

const databaseId = vDatabaseId || cleanValue((localConfig as any).firestoreDatabaseId) || '(default)';
 
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
 
// Google Sign In helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export { getRedirectResult };

// Diagnostic logger for developer console to troubleshoot custom Vercel environments & key restrictions
if (typeof window !== 'undefined') {
  const sanitizeForLog = (val: any) => {
    if (!val) return '✖ (empty/undefined/null)';
    const str = String(val);
    if (str.length <= 8) return `✔ (length: ${str.length})`;
    return `✔ (${str.substring(0, 5)}... with length: ${str.length})`;
  };

  console.group('🔧 ABA SuperSync Clinical Portal Configuration Diagnostics');
  console.log('Current Hostname:', window.location.hostname);
  console.log('API Key Status:', sanitizeForLog(firebaseConfig.apiKey));
  console.log('Auth Domain Status:', sanitizeForLog(firebaseConfig.authDomain));
  console.log('Project ID:', firebaseConfig.projectId || '✖ (missing)');
  console.log('Database ID:', databaseId);
  console.log('App ID Status:', sanitizeForLog(firebaseConfig.appId));
  console.log('Vercel Env Variables Present:');
  console.log(' - VITE_FIREBASE_API_KEY (EnvOverride):', !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.groupEnd();
}


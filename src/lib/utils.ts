/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeOrgName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // remove punctuation
    .replace(/\b(inc|llc|gmbh|co|corp|corporation|ltd|limited|company|association|assoc|behavioral|therapy|services|group)\b/gi, '') // remove common suffixes
    .replace(/\s+/g, ' ') // collapse multi-spaces
    .trim();
}

export function hasOrganizationOverlap(orgsA?: string[], orgsB?: string[]): boolean {
  if (!orgsA || !orgsB || orgsA.length === 0 || orgsB.length === 0) return false;
  const cleanA = orgsA.map(normalizeOrgName).filter(Boolean);
  const cleanB = orgsB.map(normalizeOrgName).filter(Boolean);
  return cleanA.some(a => cleanB.includes(a));
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const startTotal = sH * 60 + sM;
  const endTotal = eH * 60 + eM;
  return Math.max(0, endTotal - startTotal);
}

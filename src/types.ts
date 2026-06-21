/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'RBT' | 'BCBA' | 'BCBA-D' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  certificationNumber?: string;
  avatar?: string;
  bio?: string;
  state?: string;
  signature?: string; // Data URL of the signature
  monthlyDirectHours?: number; // Current month's accrued direct hours (computed)
  manualMonthlyDirectHours?: Record<string, number>; // Map of YYYY-MM to manual hour total
  createdAt: number;
}

export type AssociationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Association {
  id: string;
  rbtId: string;
  bcbaId: string;
  status: AssociationStatus;
  senderId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SupervisionSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rbtId: string;
  bcbaId: string;
  isDirectObservation: boolean;
  contactType: 'INDIVIDUAL' | 'GROUP';
  isServiceDelivery: boolean; // Hours spent delivering behavior-analytic services
  supervisedHours: number;
  taskListItems: string[]; // e.g., ["A-1", "B-2"]
  clinicalStrengths?: string;
  growthOpportunities?: string;
  rbtQuestions?: string;
  additionalNotes?: string;
  privateNotes?: string;
  rbtSignature?: string; // Data URL or SVG string
  bcbaSignature?: string;
  rbtSignedAt?: number;
  bcbaSignedAt?: number;
  deleteRequestedBy?: string; // ID of the user requesting deletion
  status: 'DRAFT' | 'SIGNED_BY_RBT' | 'SIGNED_BY_BCBA' | 'COMPLETED';
  // Embedded snapshots of signers to preserve identity on account deletion
  rbtName?: string;
  rbtCertification?: string;
  rbtRole?: string;
  rbtState?: string;
  bcbaName?: string;
  bcbaCertification?: string;
  bcbaRole?: string;
  bcbaState?: string;
}

export interface DirectSession {
  id: string;
  rbtId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  clientInitials?: string;
  notes?: string;
  createdAt: number;
}

export interface MonthlyCompliance {
  month: string; // YYYY-MM
  totalServiceHours: number;
  supervisedHours: number;
  individualHours: number;
  groupHours: number;
  observationCount: number;
  targetSupervisionHours: number; // 5% of service hours
  isCompliant: boolean;
}

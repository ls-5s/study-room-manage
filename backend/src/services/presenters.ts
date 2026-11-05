import type { User } from '../models/user.model.js';
import type { UserRole, UserStatus } from '../models/user.model.js';

export interface UserSummary {
  id: string;
  studentNo: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  restrictionUntil: string | null;
}

export interface UserProfile extends UserSummary {
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  violationCount: number;
}

export interface AdminUserView extends UserSummary {
  email: string | null;
  phone: string | null;
  violationCount: number;
  restrictionActive: boolean;
  createdAt: string;
}

function activeRestrictionUntil(user: User, now: Date): string | null {
  return user.restriction_until && user.restriction_until.getTime() > now.getTime()
    ? user.restriction_until.toISOString()
    : null;
}

export function toUserSummary(user: User, now = new Date()): UserSummary {
  return {
    id: String(user.id),
    studentNo: user.student_no,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    status: user.status,
    restrictionUntil: activeRestrictionUntil(user, now),
  };
}

export function toUserProfile(user: User, now = new Date()): UserProfile {
  return {
    ...toUserSummary(user, now),
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    violationCount: Number(user.violation_count),
  };
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 1)}***@${domain}`;
}

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const visible = phone.slice(-4);
  return `***${visible}`;
}

export function toAdminUserView(user: User, now = new Date()): AdminUserView {
  return {
    ...toUserSummary(user, now),
    email: maskEmail(user.email),
    phone: maskPhone(user.phone),
    violationCount: Number(user.violation_count),
    restrictionActive: Boolean(activeRestrictionUntil(user, now)),
    createdAt: user.created_at.toISOString(),
  };
}

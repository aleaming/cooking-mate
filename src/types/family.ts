// Family Sharing Feature Types

import { Recipe } from './recipe';
import { MealSlotType } from './mealPlan';

// ============================================================
// ENUMS
// ============================================================

/** Role hierarchy: owner > admin > voter > viewer */
export type FamilyRole = 'owner' | 'admin' | 'voter' | 'viewer';

/** Invitation lifecycle states */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/** Meal plan approval states */
export type MealPlanStatus = 'proposed' | 'approved' | 'rejected';

/** Vote options for meal proposals */
export type VoteType = 'approve' | 'reject' | 'abstain';

// ============================================================
// CORE ENTITIES
// ============================================================

/** Family/household group */
export interface Family {
  id: string;
  name: string;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

/** Family with additional computed data */
export interface FamilyWithDetails extends Family {
  memberCount: number;
  ownerProfile?: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/** Family member record */
export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  nickname?: string;
  joinedAt: string;
  invitedBy?: string;
}

/** Family member with profile details */
export interface FamilyMemberWithProfile extends FamilyMember {
  profile: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/** Invitation record */
export interface FamilyInvitation {
  id: string;
  familyId: string;
  inviterId: string;
  email: string;
  role: FamilyRole;
  token: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

/** Invitation with family and inviter details */
export interface FamilyInvitationWithDetails extends FamilyInvitation {
  family: {
    name: string;
  };
  inviter: {
    email: string;
    displayName?: string;
  };
}

// ============================================================
// MEAL PLANS & VOTING
// ============================================================

/** Family meal plan record */
export interface FamilyMealPlan {
  id: string;
  familyId: string;
  planDate: string; // ISO date string (YYYY-MM-DD)
  mealType: MealSlotType;
  recipeId: string;
  servings: number;
  createdBy: string;
  status: MealPlanStatus;
  createdAt: string;
  updatedAt: string;
}

/** Family meal plan with recipe and vote data */
export interface FamilyMealPlanWithDetails extends FamilyMealPlan {
  recipe?: Recipe;
  createdByProfile?: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
  votes: VoteSummary;
}

/** Vote record */
export interface FamilyMealVote {
  id: string;
  mealPlanId: string;
  userId: string;
  vote: VoteType;
  comment?: string;
  votedAt: string;
}

/** Vote with voter profile */
export interface FamilyMealVoteWithProfile extends FamilyMealVote {
  profile: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/** Aggregated vote counts */
export interface VoteSummary {
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  totalVotes: number;
  /** Current user's vote, if any */
  userVote?: VoteType;
}

// ============================================================
// PERMISSIONS & HELPERS
// ============================================================

/** Permission flags based on user's role */
export interface FamilyPermissions {
  /** Can add/remove members, change roles */
  canManageMembers: boolean;
  /** Can send invitations */
  canInvite: boolean;
  /** Can vote on meal proposals */
  canVote: boolean;
  /** Can propose new meals */
  canProposeMeals: boolean;
  /** Can approve/reject meal proposals directly */
  canApproveMeals: boolean;
  /** Can update family settings */
  canUpdateSettings: boolean;
  /** Can delete the family */
  canDeleteFamily: boolean;
}

/** Get permissions for a given role */
export function getPermissionsForRole(role: FamilyRole): FamilyPermissions {
  switch (role) {
    case 'owner':
      return {
        canManageMembers: true,
        canInvite: true,
        canVote: true,
        canProposeMeals: true,
        canApproveMeals: true,
        canUpdateSettings: true,
        canDeleteFamily: true,
      };
    case 'admin':
      return {
        canManageMembers: true,
        canInvite: true,
        canVote: true,
        canProposeMeals: true,
        canApproveMeals: true,
        canUpdateSettings: true,
        canDeleteFamily: false,
      };
    case 'voter':
      return {
        canManageMembers: false,
        canInvite: false,
        canVote: true,
        canProposeMeals: true,
        canApproveMeals: false,
        canUpdateSettings: false,
        canDeleteFamily: false,
      };
    case 'viewer':
    default:
      return {
        canManageMembers: false,
        canInvite: false,
        canVote: false,
        canProposeMeals: false,
        canApproveMeals: false,
        canUpdateSettings: false,
        canDeleteFamily: false,
      };
  }
}

// ============================================================
// INPUT TYPES (for server actions)
// ============================================================

/** Input for creating a family */
export interface CreateFamilyInput {
  name: string;
}

/** Input for updating a family */
export interface UpdateFamilyInput {
  name?: string;
  maxMembers?: number;
}

/** Input for sending an invitation */
export interface SendInvitationInput {
  familyId: string;
  email: string;
  role: FamilyRole;
}

/** Input for updating a member */
export interface UpdateMemberInput {
  role?: FamilyRole;
  nickname?: string;
}

/** Input for proposing a family meal */
export interface ProposeFamilyMealInput {
  familyId: string;
  planDate: string;
  mealType: MealSlotType;
  recipeId: string;
  servings?: number;
}

/** Input for casting a vote */
export interface CastVoteInput {
  mealPlanId: string;
  vote: VoteType;
  comment?: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

/** Standard action response */
export interface FamilyActionResponse<T = void> {
  data: T | null;
  error: string | null;
}

/** Invitation acceptance response */
export interface AcceptInvitationResponse {
  familyId: string;
  familyName: string;
  role: FamilyRole;
  memberId: string;
}

/** Invitation preview (from token lookup) */
export interface InvitationPreview {
  id: string;
  familyId: string;
  familyName: string;
  inviterName: string;
  inviterEmail: string;
  role: FamilyRole;
  expiresAt: string;
}

// ============================================================
// CALENDAR INTEGRATION
// ============================================================

/** Day's family meal plan data */
export interface FamilyDayMealPlan {
  date: string;
  breakfast: FamilyMealPlanWithDetails | null;
  lunch: FamilyMealPlanWithDetails | null;
  dinner: FamilyMealPlanWithDetails | null;
}

/** Query options for fetching family meal plans */
export interface FamilyMealPlanQuery {
  familyId: string;
  startDate: string;
  endDate: string;
  status?: MealPlanStatus | 'all';
}

// ============================================================
// ROLE DISPLAY HELPERS
// ============================================================

/** Display labels for roles */
export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  voter: 'Voter',
  viewer: 'Viewer',
};

/** Display descriptions for roles */
export const ROLE_DESCRIPTIONS: Record<FamilyRole, string> = {
  owner: 'Full control over family settings and members',
  admin: 'Can manage members and approve meal plans',
  voter: 'Can vote on and propose meal plans',
  viewer: 'View-only access to family meal plans',
};

/** Badge colors for roles (Tailwind class suffixes) */
export const ROLE_COLORS: Record<FamilyRole, string> = {
  owner: 'olive',
  admin: 'aegean',
  voter: 'terracotta',
  viewer: 'sand',
};

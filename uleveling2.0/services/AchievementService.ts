import { AchievementDefinition, AchievementRequirement, achievements, getAchievementDefinition } from '@/data/achievementsData';
import { UserProfile } from '@/contexts/UserContext'; // Assuming UserProfile is defined/exported
import { UserStats } from './StatService';
import TitleService from './TitleService';

// Simulate persistence of unlocked achievements (replace with actual DB/API calls)
const unlockedAchievementsByUser: Record<string, Set<string>> = {
    // userId: Set<achievementId>
};

// Type for the status of a single achievement for a user
export interface UserAchievementStatus {
  id: string;
  isUnlocked: boolean; // Meets requirements
  isClaimed: boolean; // Reward has been claimed (if applicable)
  canClaim: boolean; // Is unlocked but not yet claimed
}

class AchievementService {

  /**
   * Checks if a user meets the requirements for a SINGLE achievement definition.
   *
   * @param achievement - The achievement definition to check.
   * @param profile - The user's profile data.
   * @param stats - The user's stats data.
   * @param completedQuestsCount - Total number of quests completed by the user.
   * @returns boolean - True if all requirements are met, false otherwise.
   */
  private static checkSingleAchievementRequirements(
    achievement: AchievementDefinition,
    profile: UserProfile | null,
    stats: UserStats | null,
    completedQuestsCount: number // TODO: This needs to be tracked/passed in
  ): boolean {
    if (!profile || !stats) return false; // Cannot check without profile/stats

    for (const req of achievement.requirements) {
      switch (req.type) {
        case 'level':
          if (profile.level < req.value) return false;
          break;
        case 'stat':
          if (!stats[req.label] || stats[req.label].totalValue < req.value) return false;
          break;
        case 'quests_completed':
          // TODO: Implement tracking/fetching of completed quests count
          if (completedQuestsCount < req.value) {
            console.warn(`[AchievementService] quests_completed check skipped for ${achievement.id} - count not available.`);
            // return false; // Enable this once count is available
          }
          break;
        // Add more requirement types here
        default:
          console.warn(`[AchievementService] Unknown requirement type: ${(req as any).type}`);
          return false; // Unknown requirement type fails the check
      }
    }
    return true; // All requirements passed
  }

  /**
   * Gets the status (unlocked, claimed) for ALL achievements for a given user.
   *
   * @param userId - The ID of the user.
   * @param profile - The user's profile data.
   * @param stats - The user's stats data.
   * @param completedQuestsCount - Total number of quests completed by the user.
   * @returns Array of UserAchievementStatus objects.
   */
  static async getAllAchievementsStatus(
    userId: string,
    profile: UserProfile | null,
    stats: UserStats | null,
    completedQuestsCount: number = 0 // Defaulting to 0 for now
  ): Promise<{ data: UserAchievementStatus[]; error: Error | null }> {
    console.log(`[AchievementService] Getting all achievement statuses for user ${userId}...`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay

    const userUnlockedSet = unlockedAchievementsByUser[userId] || new Set<string>();
    const results: UserAchievementStatus[] = [];

    for (const achievement of achievements) {
      const isUnlocked = this.checkSingleAchievementRequirements(
        achievement,
        profile,
        stats,
        completedQuestsCount
      );
      const isClaimed = userUnlockedSet.has(achievement.id);
      results.push({
        id: achievement.id,
        isUnlocked,
        isClaimed,
        canClaim: isUnlocked && !isClaimed && achievement.rewards.length > 0, // Can only claim if unlocked, not claimed, and has rewards
      });
    }
    // console.log(`[AchievementService] Statuses for user ${userId}:`, results);
    return { data: results, error: null };
  }

  /**
   * Marks an achievement as claimed for a user and grants rewards.
   *
   * @param userId - The ID of the user claiming the achievement.
   * @param achievementId - The ID of the achievement to claim.
   * @param profile - The user's profile data (needed to re-check requirements).
   * @param stats - The user's stats data (needed to re-check requirements).
   * @param completedQuestsCount - User's completed quest count (needed to re-check requirements).
   * @returns The updated status for the claimed achievement, or null if claim failed.
   */
  static async claimAchievementReward(
    userId: string,
    achievementId: string,
    profile: UserProfile | null,
    stats: UserStats | null,
    completedQuestsCount: number = 0
  ): Promise<{ data: UserAchievementStatus | null; error: Error | null }> {
    console.log(`[AchievementService] User ${userId} attempting to claim achievement ${achievementId}...`);
    const achievement = getAchievementDefinition(achievementId);
    if (!achievement) {
      console.error(`[AchievementService] Claim failed: Achievement ${achievementId} not found.`);
      return { data: null, error: new Error("Achievement not found") };
    }

    if (achievement.rewards.length === 0) {
       console.warn(`[AchievementService] Claim failed: Achievement ${achievementId} has no rewards.`);
       return { data: null, error: new Error("Achievement has no rewards") };
    }

    // Re-check requirements before claiming
    const meetsRequirements = this.checkSingleAchievementRequirements(
      achievement,
      profile,
      stats,
      completedQuestsCount
    );
    if (!meetsRequirements) {
      console.error(`[AchievementService] Claim failed: User ${userId} does not meet requirements for ${achievementId}.`);
      return { data: null, error: new Error("Requirements not met") };
    }

    // Check if already claimed
    const userUnlockedSet = unlockedAchievementsByUser[userId] || new Set<string>();
    if (userUnlockedSet.has(achievementId)) {
      console.warn(`[AchievementService] Claim failed: Achievement ${achievementId} already claimed by user ${userId}.`);
      return { data: null, error: new Error("Achievement already claimed") };
    }

    // --- Grant Rewards --- (Simulated)
    let grantError: Error | null = null;
    for (const reward of achievement.rewards) {
      switch (reward.type) {
        case 'title':
          console.log(` -> Granting title reward: ${reward.titleId}`);
          const { error } = await TitleService.grantTitle(userId, reward.titleId);
          if (error) {
            console.error(`[AchievementService] Failed to grant title ${reward.titleId}:`, error.message);
            grantError = error; // Store the first error encountered
          }
          break;
        // Add cases for other reward types (XP, items, etc.)
        default:
          console.warn(`[AchievementService] Unknown reward type: ${(reward as any).type}`);
      }
      if (grantError) break; // Stop granting if one reward failed
    }

    if (grantError) {
      // TODO: Consider rollback logic if partial rewards were granted before failure
      return { data: null, error: grantError };
    }

    // --- Mark as Claimed (Simulated Persistence) ---
    if (!unlockedAchievementsByUser[userId]) {
      unlockedAchievementsByUser[userId] = new Set<string>();
    }
    unlockedAchievementsByUser[userId].add(achievementId);
    console.log(`[AchievementService] Achievement ${achievementId} marked as claimed for user ${userId}.`);
    console.log(` -> User ${userId} now has claimed:`, Array.from(unlockedAchievementsByUser[userId]));

    // Return the new status
    const updatedStatus: UserAchievementStatus = {
      id: achievementId,
      isUnlocked: true, // Must be true if claimed
      isClaimed: true,
      canClaim: false, // Cannot claim again
    };

    return { data: updatedStatus, error: null };
  }
}

export default AchievementService; 
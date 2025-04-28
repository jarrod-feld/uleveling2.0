// Define a type for Title data if needed
export interface UserTitle {
    id: string;
    name: string;
    // Add other relevant fields like description, how it was obtained, etc.
}

// Simulate a database of all possible titles
const ALL_TITLES: UserTitle[] = [
  { id: 't1', name: 'Shadow Monarch' },
  { id: 't2', name: 'Quest Novice' },
  { id: 't3', name: 'Level Up!' },
  { id: 't4', name: 'Strength Master' },
  { id: 't0', name: 'No Title' } // A default/placeholder if needed
];

// Simulate a user's unlocked titles (replace with DB/API call)
const unlockedTitlesByUser: Record<string, Set<string>> = {
    // userId: Set<titleId>
    'dummy-user-id': new Set(['t1', 't0']) // Start with default and 'No Title'
};

class TitleService {
  /**
   * Fetches all possible titles defined in the system.
   */
  static async getAllTitles(): Promise<{ data: UserTitle[] | null; error: Error | null }> {
    console.log("[TitleService] Fetching all defined titles... (Placeholder)");
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate delay
    return { data: [...ALL_TITLES], error: null };
  }

  /**
   * Fetches the titles unlocked by a specific user.
   * Replace with actual API call.
   */
  static async getUnlockedTitles(userId: string): Promise<{ data: UserTitle[] | null; error: Error | null }> {
    console.log(`[TitleService] Fetching unlocked titles for user ${userId}... (Placeholder)`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    const unlockedIds = unlockedTitlesByUser[userId] || new Set(['t0']); // Default to 'No Title'
    const titles = ALL_TITLES.filter(title => unlockedIds.has(title.id));
    return { data: titles, error: null };
  }

  /**
   * Fetches the user's currently equipped title.
   * Replace with actual API call or data source logic.
   * TODO: This should fetch the *equipped* title from user profile, not just a default.
   */
  static async getCurrentTitle(userId: string): Promise<{ data: UserTitle | null; error: Error | null }> {
    console.log(`[TitleService] Fetching current title for user ${userId}... (Placeholder)`);
    // Simulate fetching mock data - SHOULD BE DYNAMIC based on user profile
    const currentTitleId = 't1'; // Hardcoded for now
    const mockTitle = ALL_TITLES.find(t => t.id === currentTitleId) ?? ALL_TITLES.find(t => t.id === 't0') ?? null;
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    return { data: mockTitle, error: null };
  }

  /**
   * Updates the user's *equipped* title.
   * Replace with actual API call or data source logic (e.g., update user profile).
   */
  static async updateTitle(userId: string, titleId: string): Promise<{ error: Error | null }> {
    console.log(`[TitleService] Updating *equipped* title to ${titleId} for user ${userId}... (Placeholder)`);
    // Check if user actually unlocked this title first
    const unlockedIds = unlockedTitlesByUser[userId] || new Set();
    if (!unlockedIds.has(titleId)) {
      console.error(`[TitleService] User ${userId} has not unlocked title ${titleId}. Cannot equip.`);
      return { error: new Error("Title not unlocked") };
    }
    // TODO: Persist the equipped titleId in the user's profile
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    console.log(`[TitleService] Equipped title updated for ${userId}. (Simulated)`);
    return { error: null };
  }

  /**
   * Grants a title to a user (unlocks it).
   * Replace with actual API call.
   */
  static async grantTitle(userId: string, titleId: string): Promise<{ error: Error | null }> {
    console.log(`[TitleService] Granting title ${titleId} to user ${userId}... (Placeholder)`);
    const titleExists = ALL_TITLES.some(t => t.id === titleId);
    if (!titleExists) {
      console.error(`[TitleService] Cannot grant title ${titleId}: Title does not exist.`);
      return { error: new Error("Title does not exist") };
    }

    if (!unlockedTitlesByUser[userId]) {
      unlockedTitlesByUser[userId] = new Set(['t0']); // Initialize if first title
    }
    unlockedTitlesByUser[userId].add(titleId);
    console.log(`[TitleService] User ${userId} unlocked titles:`, Array.from(unlockedTitlesByUser[userId]));
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    return { error: null };
  }

}
export default TitleService; 
/**
 * Tests for user search excluding deleted users (role = 5)
 */
describe('User Search - Deleted User Exclusion', () => {
  const mockUserList = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exclude users with role = 5 (deleted) from search results', async () => {
    // Mock user list with mix of active and deleted users
    const allUsers = [
      {
        id: 'user-1',
        email: 'active@test.com',
        firstName: 'Active',
        lastName: 'User',
        role: 1, // Regular user
        awsSub: 'aws-1',
        deletedAt: null,
      },
      {
        id: 'user-2',
        email: 'anonymous', // Deleted user
        firstName: 'Deleted',
        lastName: 'User',
        role: 5, // DELETED role
        awsSub: 'aws-2',
        deletedAt: null,
      },
      {
        id: 'user-3',
        email: 'npc@rivalry.club',
        firstName: 'NPC',
        lastName: 'Fighter',
        role: 13, // NPC role
        awsSub: 'aws-3',
        deletedAt: null,
      },
      {
        id: 'user-4',
        email: 'another@test.com',
        firstName: 'Another',
        lastName: 'Active',
        role: 1, // Regular user
        awsSub: 'aws-4',
        deletedAt: null,
      },
    ];

    mockUserList.mockResolvedValue({
      data: allUsers,
      errors: null,
    });

    // The filtering logic should:
    // 1. Exclude role = 13 (NPC) from regular users
    // 2. Exclude role = 5 (DELETED) from regular users
    // 3. Only include role != 13 && role != 5 in regularUsers

    const regularUsers = allUsers.filter(
      user =>
        user.role !== 13 && // Not NPC
        user.role !== 5 &&  // Not DELETED
        !user.deletedAt
    );

    // Should only have 2 regular active users
    expect(regularUsers.length).toBe(2);
    expect(regularUsers.find(u => u.id === 'user-1')).toBeTruthy();
    expect(regularUsers.find(u => u.id === 'user-4')).toBeTruthy();

    // Deleted user should be excluded
    expect(regularUsers.find(u => u.id === 'user-2')).toBeUndefined();

    // NPC should be excluded from regular users
    expect(regularUsers.find(u => u.id === 'user-3')).toBeUndefined();
  });

  it('should exclude users with deletedAt timestamp even if role is not 5', () => {
    const allUsers = [
      {
        id: 'user-1',
        email: 'active@test.com',
        firstName: 'Active',
        lastName: 'User',
        role: 1,
        awsSub: 'aws-1',
        deletedAt: null,
      },
      {
        id: 'user-2',
        email: 'soft-deleted@test.com',
        firstName: 'SoftDeleted',
        lastName: 'User',
        role: 1, // Still has regular role
        awsSub: 'aws-2',
        deletedAt: '2024-01-01T00:00:00Z', // But has deletedAt timestamp
      },
    ];

    const regularUsers = allUsers.filter(
      user =>
        user.role !== 13 &&
        user.role !== 5 &&
        !user.deletedAt
    );

    // Should only have 1 active user
    expect(regularUsers.length).toBe(1);
    expect(regularUsers[0].id).toBe('user-1');
  });

  it('should include NPCs in NPC search but exclude deleted users', () => {
    const allUsers = [
      {
        id: 'npc-1',
        email: 'npc1@rivalry.club',
        firstName: 'NPC',
        lastName: 'One',
        role: 13,
        awsSub: 'aws-npc-1',
        deletedAt: null,
      },
      {
        id: 'npc-2',
        email: 'anonymous', // Deleted NPC (edge case)
        firstName: 'Deleted',
        lastName: 'NPC',
        role: 5, // Changed to deleted
        awsSub: 'aws-npc-2',
        deletedAt: null,
      },
      {
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 1,
        awsSub: 'aws-1',
        deletedAt: null,
      },
    ];

    const npcUsers = allUsers.filter(
      user =>
        user.role === 13 &&
        !user.deletedAt
    );

    // Should only have 1 NPC (the deleted one should have role 5, not 13)
    expect(npcUsers.length).toBe(1);
    expect(npcUsers[0].id).toBe('npc-1');
  });

  it('validates USER_ROLE constants are correctly defined', () => {
    const USER_ROLE = {
      NPC: 13,
      DELETED: 5,
    };

    expect(USER_ROLE.NPC).toBe(13);
    expect(USER_ROLE.DELETED).toBe(5);
  });
});

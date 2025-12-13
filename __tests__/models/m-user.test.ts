import type { User } from '../../src/API';
import { getMUser, MUser } from '../../src/models/m-user';

describe('MUser Model', () => {
  const mockUser: User = {
    __typename: 'User',
    id: 'user-123',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 1,
    awsSub: 'aws-sub-123',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMUser', () => {
    it('should create an MUser from a User object', () => {
      const mUser = getMUser({ user: mockUser });

      expect(mUser).toBeDefined();
      expect(mUser.id).toBe(mockUser.id);
      expect(mUser.email).toBe(mockUser.email);
    });

    it('should compute fullName correctly', () => {
      const mUser = getMUser({ user: mockUser });

      expect(mUser.fullName).toBe('John Doe');
    });

    it('should return baseUser', () => {
      const mUser = getMUser({ user: mockUser });

      expect(mUser.baseUser).toEqual(mockUser);
    });
  });

  describe('displayName', () => {
    it('should return firstName when compared to user with different first name', () => {
      const mUser = getMUser({ user: mockUser });

      const result = mUser.displayName('Jane Smith');

      expect(result).toBe('John');
    });

    it('should return firstName when compared to MUser with different first name', () => {
      const mUser1 = getMUser({ user: mockUser });
      const mUser2 = getMUser({
        user: { ...mockUser, id: 'user-456', firstName: 'Jane' },
      });

      const result = mUser1.displayName(mUser2);

      expect(result).toBe('John');
    });

    it('should return firstName with ID suffix when full names match', () => {
      const mUser = getMUser({ user: mockUser });

      const result = mUser.displayName('John Doe');

      expect(result).toBe('John #user-123');
    });

    it('should return abbreviated name when first names match but last names differ', () => {
      const mUser = getMUser({ user: mockUser });

      const result = mUser.displayName('John Smith');

      expect(result).toBe('John D.');
    });

    it('should handle partial name matches', () => {
      const user: User = {
        ...mockUser,
        firstName: 'Jonathan',
        lastName: 'Doe',
      };
      const mUser = getMUser({ user });

      const result = mUser.displayName('John Doe');

      expect(result).toBe('Jonathan');
    });

    it('should handle empty firstName gracefully', () => {
      const user: User = {
        ...mockUser,
        firstName: '',
      };
      const mUser = getMUser({ user });

      const result = mUser.displayName('Jane Smith');

      expect(result).toBe('');
    });
  });
});

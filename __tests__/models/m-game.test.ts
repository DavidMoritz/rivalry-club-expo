import type { Schema } from '../../amplify/data/resource';
import {
  getMGame,
  PROVISIONAL_THRESHOLD,
  STEPS_PER_STOCK,
  STOCK,
} from '../../src/models/m-game';

// Extract Gen 2 type
type Game = Schema['Game']['type'];

describe('MGame Model', () => {
  const mockGame: Game = {
    id: '123',
    name: 'Super Smash Bros Ultimate',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMGame', () => {
    it('should create an MGame from a Game object', () => {
      const mGame = getMGame(mockGame);

      expect(mGame).toBeDefined();
      expect(mGame.id).toBe(mockGame.id);
      expect(mGame.name).toBe(mockGame.name);
    });

    it('should compute abbr correctly', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.abbr).toBe('SSBU');
    });

    it('should compute abbr for single word game', () => {
      const singleWordGame: Game = {
        ...mockGame,
        name: 'Tekken',
      };
      const mGame = getMGame(singleWordGame);

      expect(mGame.abbr).toBe('T');
    });

    it('should compute abbr for game with numbers', () => {
      const gameWithNumbers: Game = {
        ...mockGame,
        name: 'Tekken 8',
      };
      const mGame = getMGame(gameWithNumbers);

      expect(mGame.abbr).toBe('T8');
    });

    it('should compute abbr for game with special characters', () => {
      const gameWithSpecialChars: Game = {
        ...mockGame,
        name: 'Street Fighter V: Champion Edition',
      };
      const mGame = getMGame(gameWithSpecialChars);

      expect(mGame.abbr).toBe('SFVCE');
    });

    it('should compute abbr for game with multiple consecutive spaces', () => {
      const gameWithSpaces: Game = {
        ...mockGame,
        name: 'Super  Smash  Bros',
      };
      const mGame = getMGame(gameWithSpaces);

      // Multiple spaces create empty strings in split array, which have empty charAt(0)
      expect(mGame.abbr).toBe('SSB');
    });

    it('should return baseGame', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.baseGame).toEqual(mockGame);
    });

    it('should preserve all original Game properties', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.id).toBe(mockGame.id);
      expect(mGame.name).toBe(mockGame.name);
      expect(mGame.createdAt).toBe(mockGame.createdAt);
      expect(mGame.updatedAt).toBe(mockGame.updatedAt);
    });

    it('should compute title correctly', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.title).toBe('Super Smash Bros Ultimate (unofficial)');
    });

    it('should compute properties dynamically (getters)', () => {
      const mGame = getMGame(mockGame);

      // Verify computed properties are getters that recalculate
      expect(mGame.abbr).toBe('SSBU');
      expect(mGame.title).toBe('Super Smash Bros Ultimate (unofficial)');

      // Access multiple times to ensure they're stable
      expect(mGame.abbr).toBe('SSBU');
      expect(mGame.abbr).toBe('SSBU');
    });
  });

  describe('Constants', () => {
    it('should have correct STOCK value', () => {
      expect(STOCK).toBe(3);
    });

    it('should have correct STEPS_PER_STOCK value', () => {
      expect(STEPS_PER_STOCK).toBe(3);
    });

    it('should have correct PROVISIONAL_THRESHOLD value', () => {
      expect(PROVISIONAL_THRESHOLD).toBe(10);
    });
  });
});

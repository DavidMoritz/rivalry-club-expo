import type { Schema } from '../../amplify/data/resource';
import { getMFighter } from '../../src/models/m-fighter';
import { getMGame } from '../../src/models/m-game';

// Extract Gen 2 type
type Fighter = Schema['Fighter']['type'];

describe('MFighter Model', () => {
  const mockFighter: Fighter = {
    id: 'fighter-123',
    gameId: 'game-123',
    name: 'Mario',
    gamePosition: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMFighter', () => {
    it('should create an MFighter from a Fighter object', () => {
      const mFighter = getMFighter(mockFighter);

      expect(mFighter).toBeDefined();
      expect(mFighter.id).toBe(mockFighter.id);
      expect(mFighter.name).toBe(mockFighter.name);
    });

    it('should return baseFighter', () => {
      const mFighter = getMFighter(mockFighter);

      expect(mFighter.baseFighter).toEqual(mockFighter);
    });

    it('should initialize with null game', () => {
      const mFighter = getMFighter(mockFighter);

      expect(mFighter.game).toBeNull();
      expect(mFighter._mGame).toBeNull();
    });
  });

  describe('game getter/setter', () => {
    it('should set and get game', () => {
      const mFighter = getMFighter(mockFighter);
      const mGame = getMGame({
        id: 'game-123',
        name: 'Super Smash Bros Ultimate',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      mFighter.game = mGame;

      expect(mFighter.game).toEqual(mGame);
      expect(mFighter._mGame).toEqual(mGame);
    });

    it('should return null when game is not set', () => {
      const mFighter = getMFighter(mockFighter);

      expect(mFighter.game).toBeNull();
    });
  });
});

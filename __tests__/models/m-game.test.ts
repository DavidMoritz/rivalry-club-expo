import { Game } from '../../src/API';
import {
  getMGame,
  MGame,
  PROVISIONAL_THRESHOLD,
  STEPS_PER_STOCK,
  STOCK,
} from '../../src/models/m-game';

describe('MGame Model', () => {
  const mockGame: Game = {
    __typename: 'Game',
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

    it('should return baseGame', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.baseGame).toEqual(mockGame);
    });

    it('should compute title correctly', () => {
      const mGame = getMGame(mockGame);

      expect(mGame.title).toBe('Super Smash Bros Ultimate (unofficial)');
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

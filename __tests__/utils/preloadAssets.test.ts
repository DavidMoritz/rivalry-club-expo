// Mock the modules BEFORE importing
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('react-native', () => ({
  Image: {
    prefetch: jest.fn().mockResolvedValue(true)
  }
}));

// Mock the fighter images
jest.mock('../../assets/images/games/ssbu', () => ({
  fighterImages: {
    mario: 1,
    link: 2,
    samus: 3,
    pikachu: 4,
    kirby: 5
  }
}));

import { Asset } from 'expo-asset';
import { Image } from 'react-native';

import { preloadFighterImages, preloadAssets } from '../../src/utils/preloadAssets';

describe('preloadAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('preloadFighterImages', () => {
    it('should preload all fighter images using Asset.loadAsync', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      await preloadFighterImages();

      // Should call Asset.loadAsync for each image (all are numbers in our mock)
      expect(mockLoadAsync).toHaveBeenCalledTimes(5);
      expect(mockLoadAsync).toHaveBeenCalledWith(1); // mario
      expect(mockLoadAsync).toHaveBeenCalledWith(2); // link
      expect(mockLoadAsync).toHaveBeenCalledWith(3); // samus
      expect(mockLoadAsync).toHaveBeenCalledWith(4); // pikachu
      expect(mockLoadAsync).toHaveBeenCalledWith(5); // kirby
    });

    it('should not log success messages (implementation does not include logging)', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      await preloadFighterImages();

      // Implementation does not log start/success messages, only errors/warnings
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle individual image loading failures gracefully', async () => {
      const mockLoadAsync = jest.fn()
        .mockResolvedValueOnce(undefined) // mario - success
        .mockRejectedValueOnce(new Error('Network error')) // link - fail
        .mockResolvedValueOnce(undefined) // samus - success
        .mockResolvedValueOnce(undefined) // pikachu - success
        .mockResolvedValueOnce(undefined); // kirby - success

      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      // Should not throw even if one image fails (each image has its own try-catch)
      await expect(preloadFighterImages()).resolves.not.toThrow();

      // Should warn about the failed image with the [preloadAssets] prefix
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[preloadAssets] Failed to preload image'),
        expect.any(Error)
      );
    });

    it('should not call Image.prefetch for number-based (require) images', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      const mockPrefetch = jest.fn().mockResolvedValue(true);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;
      (Image.prefetch as jest.Mock) = mockPrefetch;

      await preloadFighterImages();

      // Should not call Image.prefetch since all images are numbers (require)
      expect(mockPrefetch).not.toHaveBeenCalled();
    });
  });

  describe('preloadAssets', () => {
    it('should call preloadFighterImages', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      await preloadAssets();

      // Should have called Asset.loadAsync for all fighter images
      expect(mockLoadAsync).toHaveBeenCalled();
      expect(mockLoadAsync).toHaveBeenCalledTimes(5);
    });
  });

  describe('caching behavior', () => {
    it('should verify Asset.loadAsync is called for all images on first load', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      await preloadFighterImages();

      // Verify all 5 images were loaded
      expect(mockLoadAsync).toHaveBeenCalledTimes(5);

      // Verify each image source was passed
      expect(mockLoadAsync).toHaveBeenCalledWith(1);
      expect(mockLoadAsync).toHaveBeenCalledWith(2);
      expect(mockLoadAsync).toHaveBeenCalledWith(3);
      expect(mockLoadAsync).toHaveBeenCalledWith(4);
      expect(mockLoadAsync).toHaveBeenCalledWith(5);
    });

    it('should call Asset.loadAsync again on subsequent preloads (Expo handles caching)', async () => {
      const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      // First preload
      await preloadFighterImages();
      const firstCallCount = mockLoadAsync.mock.calls.length;

      // Reset mock to track second call
      mockLoadAsync.mockClear();

      // Second preload - Asset.loadAsync should still be called
      // (Expo handles caching internally, so calling it again is safe and idempotent)
      await preloadFighterImages();
      const secondCallCount = mockLoadAsync.mock.calls.length;

      // Both should call the same number of times
      expect(firstCallCount).toBe(5);
      expect(secondCallCount).toBe(5);
    });
  });

  describe('performance', () => {
    it('should preload images in parallel, not sequentially', async () => {
      const loadTimes: number[] = [];
      const mockLoadAsync = jest.fn().mockImplementation(() => {
        const start = Date.now();
        loadTimes.push(start);

        return new Promise(resolve => setTimeout(resolve, 10));
      });

      (Asset.loadAsync as jest.Mock) = mockLoadAsync;

      const startTime = Date.now();
      await preloadFighterImages();
      const totalTime = Date.now() - startTime;

      // If images loaded in parallel, total time should be ~10ms
      // If sequential, it would be ~50ms (5 images * 10ms each)
      expect(totalTime).toBeLessThan(100); // Much less than 5 * 10ms

      // All loads should start around the same time (parallel)
      const maxTimeDiff = Math.max(...loadTimes) - Math.min(...loadTimes);
      expect(maxTimeDiff).toBeLessThan(20); // Should start within 20ms of each other
    });
  });
});

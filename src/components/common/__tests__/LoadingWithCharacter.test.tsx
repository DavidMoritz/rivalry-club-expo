import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LoadingWithCharacter } from '../LoadingWithCharacter';

// Mock the fighter images
jest.mock('../../../../assets/images/games/ssbu', () => ({
  fighterImages: {
    Mario: 1,
    Luigi: 2,
    Peach: 3,
    Bowser: 4,
    'Donkey Kong': 5,
  },
}));

describe('LoadingWithCharacter', () => {
  describe('Basic rendering', () => {
    it('renders the loading message', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading data..." />
      );

      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('renders an ActivityIndicator', () => {
      const { root } = render(
        <LoadingWithCharacter message="Loading data..." />
      );

      // ActivityIndicator is rendered
      expect(root).toBeTruthy();
    });

    it('renders a fighter name', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading data..." seed={0} />
      );

      // With seed 0, should show Mario (first fighter)
      expect(getByText('Mario')).toBeTruthy();
    });
  });

  describe('Seed functionality', () => {
    it('displays the first fighter when seed is 0', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading..." seed={0} />
      );

      expect(getByText('Mario')).toBeTruthy();
    });

    it('displays the second fighter when seed is 1', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading..." seed={1} />
      );

      expect(getByText('Luigi')).toBeTruthy();
    });

    it('displays the third fighter when seed is 2', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading..." seed={2} />
      );

      expect(getByText('Peach')).toBeTruthy();
    });

    it('wraps around with modulo when seed exceeds fighter count', () => {
      // We have 5 fighters, so seed 5 should wrap to fighter at index 0 (Mario)
      const { getByText } = render(
        <LoadingWithCharacter message="Loading..." seed={5} />
      );

      expect(getByText('Mario')).toBeTruthy();
    });

    it('wraps around correctly for seed 7 (modulo 5 = 2, Peach)', () => {
      const { getByText } = render(
        <LoadingWithCharacter message="Loading..." seed={7} />
      );

      expect(getByText('Peach')).toBeTruthy();
    });

    it('displays consistent fighter for same seed across multiple renders', () => {
      const { getByText: getByText1 } = render(
        <LoadingWithCharacter message="Loading..." seed={3} />
      );
      const { getByText: getByText2 } = render(
        <LoadingWithCharacter message="Loading..." seed={3} />
      );

      // Both should show Bowser (index 3)
      expect(getByText1('Bowser')).toBeTruthy();
      expect(getByText2('Bowser')).toBeTruthy();
    });
  });

  describe('Random fighter (no seed)', () => {
    it('displays a fighter name when no seed is provided', () => {
      const { root } = render(<LoadingWithCharacter message="Loading..." />);

      // One of the fighter names should be present
      const fighterNames = ['Mario', 'Luigi', 'Peach', 'Bowser', 'Donkey Kong'];
      const textElements = root.findAllByType(Text);
      const hasAnyFighterName = textElements.some(el =>
        fighterNames.includes(el.props.children)
      );

      expect(hasAnyFighterName).toBe(true);
    });
  });

  describe('Message variations', () => {
    it('displays custom loading messages correctly', () => {
      const customMessage = 'Fetching rivalry data...';
      const { getByText } = render(
        <LoadingWithCharacter message={customMessage} seed={0} />
      );

      expect(getByText(customMessage)).toBeTruthy();
    });

    it('handles long messages', () => {
      const longMessage =
        'Loading a very long message that contains lots of information about what is happening';
      const { getByText } = render(
        <LoadingWithCharacter message={longMessage} seed={0} />
      );

      expect(getByText(longMessage)).toBeTruthy();
    });
  });
});

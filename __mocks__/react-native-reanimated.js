module.exports = {
  default: {
    call: jest.fn(),
  },
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn(value => value),
  withTiming: jest.fn(value => value),
  Easing: {
    bezier: jest.fn(),
    ease: jest.fn(),
    elastic: jest.fn(),
    inOut: jest.fn(),
    linear: jest.fn(),
    out: jest.fn(),
    in: jest.fn(),
  },
};

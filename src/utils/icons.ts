import {
  faCheckCircle,
  faExclamationTriangle,
  faShuffle,
  faSquareCheck,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Note: The original app used @fortawesome/pro-solid-svg-icons for:
 * - faBoxingGlove
 * - faSwords
 *
 * These require a FontAwesome Pro license. For now, we're using free alternatives.
 * If you have a Pro license, install @fortawesome/pro-solid-svg-icons and add them here.
 *
 * Use in the project like this:
 * <FontAwesomeIcon icon="shuffle" color="black" />
 */

// If you have FontAwesome Pro:
// import { faBoxingGlove } from '@fortawesome/pro-solid-svg-icons/faBoxingGlove';
// import { faSwords } from '@fortawesome/pro-solid-svg-icons/faSwords';

export const iconsInProject = [
  // faBoxingGlove, // Pro icon - uncomment if you have Pro license
  faCheckCircle,
  faExclamationTriangle,
  faShuffle,
  faSquareCheck,
  // faSwords, // Pro icon - uncomment if you have Pro license
] as const;

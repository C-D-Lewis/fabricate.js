import { MOBILE_MAX_WIDTH } from './constants';

/**
 * Determine if a mobile device is being used which has a narrow screen.
 *
 * @returns {boolean} true if running on a 'narrow' screen device.
 */
// eslint-disable-next-line import/prefer-default-export
export const isNarrow = () => window.innerWidth < MOBILE_MAX_WIDTH;

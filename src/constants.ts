import { FabricateOptions } from './types';

/** Max mobile width. */
export const MOBILE_MAX_WIDTH = 1000;

/** LocalStorage key for persisted state */
export const STORAGE_KEY_STATE = '_fabricate:state';

/** Default options */
export const DEFAULT_OPTIONS: FabricateOptions = {
  logStateUpdates: false,
  persistState: [],
  strict: false,
  theme: {
    palette: {},
    styles: {},
  },
};

export type { Interpolator } from '../_internal/_types';

/**
 * 繰り返すときの向き（CSS の `animation-direction` と同じ）
 */
export type RepeatDirection =
  'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/**
 * `repeatInterpolator` のオプション
 */
export type RepeatInterpolatorOptions = {
  /**
   * 繰り返すときの向き。デフォルトは `'normal'`
   */
  direction?: RepeatDirection;
};

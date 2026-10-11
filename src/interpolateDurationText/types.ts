export type { Rounding } from '../_internal/_types';
import type { Rounding } from '../_internal/_types';

/**
 * `interpolateDurationText` のオプション
 */
export type InterpolateDurationTextOptions = {
  /**
   * 途中の値を `b` の最小の単位に丸める方法。デフォルトは `'round'`
   */
  rounding?: Rounding;
};

import { _positiveOr } from '../_internal/_numbers';
import type { Interpolator } from '../_internal/_types';
import type { RepeatInterpolatorOptions } from './types';

/**
 * interpolator を指定した回数だけ繰り返す interpolator を返す
 *
 * 回の境目ちょうどの t は前の回の終わりにする。
 * 範囲外の t は、最初または最後の回にそのまま延長して渡す
 * @param interpolator 繰り返す interpolator
 * @param count 繰り返す回数。小数の場合は最後の回の途中で終わる。0 以下や有限でない数の場合は 1
 * @param options オプション
 * @returns 繰り返す interpolator
 */
export default function repeatInterpolator<T>(
  interpolator: Interpolator<T>,
  count: number,
  options: RepeatInterpolatorOptions = {},
): Interpolator<T> {
  const { direction = 'normal' } = options;
  const repeatCount = _positiveOr(count, 1);
  const lastIndex = Math.ceil(repeatCount) - 1;

  return (t) => {
    const position = t * repeatCount;
    const index =
      position <= 0 ? 0 : Math.min(Math.ceil(position) - 1, lastIndex);
    const local = position - index;
    const reversed =
      direction === 'reverse' ||
      (direction === 'alternate' && index % 2 === 1) ||
      (direction === 'alternate-reverse' && index % 2 === 0);
    return interpolator(reversed ? 1 - local : local);
  };
}

import type { Interpolator } from '../_internal/_types';

/**
 * interpolator を逆向きに再生する interpolator を返す
 * @param interpolator 逆向きにする interpolator
 * @returns `t => interpolator(1 - t)`
 */
export default function reverseInterpolator<T>(
  interpolator: Interpolator<T>,
): Interpolator<T> {
  return (t) => interpolator(1 - t);
}

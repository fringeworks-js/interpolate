/**
 * 0 以上の有限の数ならそのまま、そうでなければ fallback を返す
 */
export const _nonNegativeOr = (value: number, fallback: number): number =>
  value >= 0 && value < Infinity ? value : fallback;

/**
 * 0 より大きい有限の数ならそのまま、そうでなければ fallback を返す
 */
export const _positiveOr = (value: number, fallback: number): number =>
  value > 0 && value < Infinity ? value : fallback;

/**
 * 有限の数ならそのまま、そうでなければ fallback を返す
 */
export const _finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

/**
 * 数値を min 〜 max に収める。`NaN` の場合は fallback を返す
 */
export const _clampOr = (
  value: number,
  min: number,
  max: number,
  fallback: number,
): number =>
  Number.isNaN(value) ? fallback : Math.max(min, Math.min(max, value));

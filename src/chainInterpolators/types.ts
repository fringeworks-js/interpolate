import type { Easing, Interpolator } from '../_internal/_types';

export type { Easing, Interpolator } from '../_internal/_types';

/**
 * `chainInterpolators` のオプション
 */
export type ChainInterpolatorsOptions = {
  /**
   * 区間の長さの比。省略した場合は均等に分ける。足りない分や負の数・有限でない数は 1 にし、余った分は無視する。合計が 0 の場合は均等に分ける
   */
  weights?: readonly number[];
  /**
   * 区間ごとに適用するイージング関数
   */
  ease?: Easing;
};

/**
 * `chainInterpolators` が返す値の型（各 interpolator の戻り値の union）
 */
export type ChainedValue<I extends readonly (Interpolator<unknown> | null)[]> =
  ReturnType<NonNullable<I[number]>>;

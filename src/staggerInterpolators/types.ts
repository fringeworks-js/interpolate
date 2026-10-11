import type { Easing, Interpolator } from '../_internal/_types';

export type { Easing, Interpolator } from '../_internal/_types';

/**
 * `staggerInterpolators` のオプション
 */
export type StaggerInterpolatorsOptions = {
  /**
   * 次の開始までの間隔を、1つ分の長さに対する割合で表す。
   * 0 は同時、1 は重ならずに順番になる。負の数・有限でない数の場合は 0.5 にする。デフォルトは 0.5
   */
  stagger?: number;
  /**
   * interpolator ごとの範囲 `[start, end]`。指定した場合は `stagger` より優先する。足りない分は `stagger` から求めた区間で補い、余った分は無視する
   */
  ranges?: readonly (readonly [number, number])[];
  /**
   * 区間ごとに適用するイージング関数
   */
  ease?: Easing;
};

/**
 * `staggerInterpolators` が返す値の型（各 interpolator の戻り値のタプル）
 */
export type StaggeredValues<I extends readonly Interpolator<unknown>[]> = {
  -readonly [K in keyof I]: ReturnType<I[K]>;
};

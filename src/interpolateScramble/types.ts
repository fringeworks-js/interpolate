/**
 * `interpolateScramble` のオプション
 */
export type InterpolateScrambleOptions = {
  /**
   * 次の文字の開始までの間隔を、1文字分の長さに対する割合で表す。
   * 0 は全ての文字が同時、1 は1文字ずつ順番になる。負の数・有限でない数の場合は 0.2 にする。デフォルトは 0.2
   */
  stagger?: number;
  /**
   * ランダムに使う文字。空の場合はデフォルトにする。デフォルトは英大文字・小文字・数字
   */
  characters?: string;
  /**
   * t が 0 から 1 まで進む間に、ランダムな文字が入れ替わる回数。負の数・有限でない数の場合は 60 にする。デフォルトは 60
   */
  changeCount?: number;
  /**
   * ランダムな文字の並びを決める値。デフォルトは 0
   */
  seed?: number;
};

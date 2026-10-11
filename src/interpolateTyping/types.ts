/**
 * `interpolateTyping` のオプション
 */
export type InterpolateTypingOptions = {
  /**
   * 消してから打つ場合に、全体のうち消す時間の割合（0 〜 1）。範囲外は 0 〜 1 に収め、`NaN` は 0.5 にする。デフォルトは 0.5
   */
  eraseRatio?: number;
  /**
   * 共通する先頭部分を残し、違う部分だけを消して打つ
   */
  keepCommonPrefix?: boolean;
};

import interpolateTyping from '../interpolateTyping/interpolateTyping';
import chainInterpolators from './chainInterpolators';

/**
 * 渡された t を名前と一緒に返す interpolator
 */
const record =
  <N extends string>(name: N) =>
  (t: number): [N, number] => [name, t];

const a = record('a'),
  b = record('b'),
  c = record('c');

describe('chainInterpolators', () => {
  describe('区間の分け方', () => {
    it('既定では均等に分け、区間内の t に直して渡す', () => {
      const i = chainInterpolators([a, b]);
      expect(i(0)).toEqual(['a', 0]);
      expect(i(0.25)).toEqual(['a', 0.5]);
      expect(i(0.75)).toEqual(['b', 0.5]);
      expect(i(1)).toEqual(['b', 1]);
    });

    it('境目ちょうどの t は後ろの区間に入れる', () => {
      expect(chainInterpolators([a, b])(0.5)).toEqual(['b', 0]);
    });

    it('weights の比で分ける', () => {
      const i = chainInterpolators([a, b], { weights: [3, 7] });
      expect(i(0.15)).toEqual(['a', 0.5]);
      expect(i(0.3)).toEqual(['b', 0]);
      const [name, t] = i(0.65);
      expect(name).toBe('b');
      expect(t).toBeCloseTo(0.5, 10);
    });

    it('最後の区間は t=1 でちょうど 1 を渡す', () => {
      expect(chainInterpolators([a, b, c])(1)).toEqual(['c', 1]);
    });

    it('重みが 0 の区間は飛ばす', () => {
      const i = chainInterpolators([a, b, c], { weights: [1, 0, 1] });
      expect(i(0.5)).toEqual(['c', 0]);
      expect(i(0.49)[0]).toBe('a');
    });
  });

  describe('範囲外の t', () => {
    it('最初または最後の interpolator に延長した t を渡す', () => {
      const i = chainInterpolators([a, b]);
      expect(i(-0.5)).toEqual(['a', -1]);
      expect(i(1.5)).toEqual(['b', 2]);
    });
  });

  describe('待機の区間（null）', () => {
    it('直前の interpolator の終わりの値を返す', () => {
      const i = chainInterpolators([a, null, b], { weights: [1, 1, 2] });
      expect(i(0.3)).toEqual(['a', 1]);
      expect(i(0.5)).toEqual(['b', 0]);
    });

    it('先頭の場合は次の interpolator の始まりの値を返す', () => {
      const i = chainInterpolators([null, a]);
      expect(i(0.25)).toEqual(['a', 0]);
      expect(i(-1)).toEqual(['a', 0]);
    });

    it('待機の区間が続く場合は、その前後の interpolator の値を返す', () => {
      expect(chainInterpolators([null, null, a])(0.5)).toEqual(['a', 0]);
      expect(chainInterpolators([a, null, null])(0.9)).toEqual(['a', 1]);
    });

    it('複数の待機の区間はそれぞれ直前の値を返す', () => {
      const i = chainInterpolators([a, null, b, null]);
      expect(i(0.3)).toEqual(['a', 1]);
      expect(i(0.8)).toEqual(['b', 1]);
      expect(i(2)).toEqual(['b', 1]);
    });

    it('打ち替えの間に待機を入れる', () => {
      const erase = interpolateTyping('Hello', ''),
        type = interpolateTyping('', 'World');
      const i = chainInterpolators([erase, null, type], {
        weights: [2, 1, 2],
      });
      expect(i(0.2)).toBe('He');
      expect(i(0.5)).toBe('');
      expect(i(0.8)).toBe('Wo');
    });
  });

  describe('ease', () => {
    it('区間内の t に適用する', () => {
      const i = chainInterpolators([a, b], { ease: (t) => t * t });
      expect(i(0.25)).toEqual(['a', 0.25]);
      expect(i(0.75)).toEqual(['b', 0.25]);
    });

    it('待機の区間には適用しない', () => {
      const ease = vi.fn((t: number) => t);
      chainInterpolators([a, null], { ease })(0.75);
      expect(ease).not.toHaveBeenCalled();
    });
  });

  describe('不正な weights', () => {
    it('足りない分は 1、余った分は無視する', () => {
      expect(chainInterpolators([a, b, c], { weights: [2] })(0.5)).toEqual([
        'b',
        0,
      ]);
      expect(chainInterpolators([a, b], { weights: [1, 1, 5] })(0.5)).toEqual([
        'b',
        0,
      ]);
    });

    it('負の数や有限でない数は 1 にする', () => {
      for (const weight of [-1, NaN, Infinity]) {
        expect(
          chainInterpolators([a, b], { weights: [1, weight] })(0.5),
        ).toEqual(['b', 0]);
      }
    });

    it('合計が 0 の場合は均等に分ける', () => {
      expect(chainInterpolators([a, b], { weights: [0, 0] })(0.5)).toEqual([
        'b',
        0,
      ]);
    });
  });

  describe('エラー', () => {
    it('interpolator がない場合', () => {
      expect(() => chainInterpolators([])).toThrow(RangeError);
    });

    it('全て待機の区間の場合', () => {
      expect(() => chainInterpolators([null, null])).toThrow(RangeError);
    });
  });

  it('戻り値の型は各 interpolator の戻り値の union', () => {
    const i = chainInterpolators([() => 1, () => 'x']);
    expectTypeOf(i).returns.toEqualTypeOf<number | string>();
  });
});

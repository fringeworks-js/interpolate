import repeatInterpolator from './repeatInterpolator';

const identity = (t: number) => t;

describe('repeatInterpolator', () => {
  describe("direction: 'normal'（既定）", () => {
    const i = repeatInterpolator(identity, 3);

    it('指定した回数だけ繰り返す', () => {
      expect(i(0)).toBe(0);
      expect(i(1 / 6)).toBeCloseTo(0.5, 10);
      expect(i(0.5)).toBeCloseTo(0.5, 10);
      expect(i(1)).toBe(1);
    });

    it('回の境目ちょうどの t は前の回の終わりにする', () => {
      expect(i(1 / 3)).toBeCloseTo(1, 10);
    });

    it('小数の回数は最後の回の途中で終わる', () => {
      expect(repeatInterpolator(identity, 2.5)(1)).toBeCloseTo(0.5, 10);
    });
  });

  it("direction: 'reverse' は毎回逆向きに再生する", () => {
    const i = repeatInterpolator(identity, 2, { direction: 'reverse' });
    expect(i(0)).toBe(1);
    expect(i(0.25)).toBe(0.5);
    expect(i(0.5)).toBe(0);
    expect(i(1)).toBe(0);
  });

  it("direction: 'alternate' は行って戻る", () => {
    const i = repeatInterpolator(identity, 2, { direction: 'alternate' });
    expect(i(0)).toBe(0);
    expect(i(0.25)).toBe(0.5);
    expect(i(0.5)).toBe(1);
    expect(i(0.75)).toBe(0.5);
    expect(i(1)).toBe(0);
  });

  it("direction: 'alternate-reverse' は戻ってから行く", () => {
    const i = repeatInterpolator(identity, 2, {
      direction: 'alternate-reverse',
    });
    expect(i(0)).toBe(1);
    expect(i(0.25)).toBe(0.5);
    expect(i(0.5)).toBe(0);
    expect(i(1)).toBe(1);
  });

  describe('範囲外の t', () => {
    it('最初と最後の回にそのまま延長して渡す', () => {
      const i = repeatInterpolator(identity, 2);
      expect(i(-0.5)).toBe(-1);
      expect(i(1.5)).toBe(2);
    });

    it('逆向きの回では逆向きに延長する', () => {
      const i = repeatInterpolator(identity, 2, { direction: 'alternate' });
      expect(i(1.5)).toBe(-1);
    });
  });

  it('回数が 0 以下や有限でない数の場合は 1 回にする', () => {
    for (const count of [0, -1, NaN, Infinity]) {
      const i = repeatInterpolator(identity, count);
      expect(i(0.5)).toBe(0.5);
      expect(i(1)).toBe(1);
    }
  });
});

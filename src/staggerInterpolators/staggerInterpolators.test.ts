import staggerInterpolators from './staggerInterpolators';

const identity = (t: number) => t;

describe('staggerInterpolators', () => {
  describe('stagger', () => {
    it('既定では半分ずつ重ねてずらす', () => {
      // 1つ分の長さは 0.5、開始は 0 / 0.25 / 0.5
      const i = staggerInterpolators([identity, identity, identity]);
      expect(i(0)).toEqual([0, 0, 0]);
      expect(i(0.25)).toEqual([0.5, 0, 0]);
      expect(i(0.5)).toEqual([1, 0.5, 0]);
      expect(i(0.75)).toEqual([1, 1, 0.5]);
      expect(i(1)).toEqual([1, 1, 1]);
    });

    it('0 のとき同時に再生する', () => {
      const i = staggerInterpolators([identity, identity], { stagger: 0 });
      expect(i(0.3)).toEqual([0.3, 0.3]);
    });

    it('1 のとき重ならずに順番に再生する', () => {
      const i = staggerInterpolators([identity, identity], { stagger: 1 });
      expect(i(0.25)).toEqual([0.5, 0]);
      expect(i(0.75)).toEqual([1, 0.5]);
    });

    it('1 より大きいときは間を空ける', () => {
      // 1つ分の長さは 1/3、開始は 0 / 2/3
      const i = staggerInterpolators([identity, identity], { stagger: 2 });
      expect(i(0.5)).toEqual([1, 0]);
      expect(i(1)).toEqual([1, 1]);
    });

    it('1つだけの場合は 0 〜 1 で再生する', () => {
      expect(staggerInterpolators([identity])(0.3)).toEqual([0.3]);
    });

    it('空の場合は空の配列を返す', () => {
      expect(staggerInterpolators([])(0.5)).toEqual([]);
    });
  });

  describe('ranges', () => {
    it('interpolator ごとの範囲を指定できる', () => {
      const i = staggerInterpolators([identity, identity], {
        ranges: [
          [0, 0.6],
          [0.3, 1],
        ],
      });
      const [first, second] = i(0.6);
      expect(first).toBe(1);
      expect(second).toBeCloseTo(0.3 / 0.7, 10);
    });

    it('stagger より優先する', () => {
      const i = staggerInterpolators([identity], {
        stagger: 0,
        ranges: [[0.5, 1]],
      });
      expect(i(0.75)).toEqual([0.5]);
    });

    it('長さのない範囲は、開始の前は 0、開始以降は 1 にする', () => {
      const i = staggerInterpolators([identity], { ranges: [[0.5, 0.5]] });
      expect(i(0.4)).toEqual([0]);
      expect(i(0.5)).toEqual([1]);
    });
  });

  describe('範囲外の t', () => {
    it('始まる前は 0、終わった後は 1 の状態で止める', () => {
      const i = staggerInterpolators([identity, identity]);
      expect(i(-1)).toEqual([0, 0]);
      expect(i(2)).toEqual([1, 1]);
    });
  });

  describe('ease', () => {
    it('区間内の t に適用する', () => {
      const i = staggerInterpolators([identity, identity], {
        stagger: 0,
        ease: (t) => t * t,
      });
      expect(i(0.5)).toEqual([0.25, 0.25]);
    });

    it('行き過ぎるイージングの値はそのまま渡す', () => {
      const i = staggerInterpolators([identity], { ease: (t) => t * 1.2 });
      expect(i(1)[0]).toBeCloseTo(1.2, 10);
    });
  });

  it('毎回新しい配列を返す', () => {
    const i = staggerInterpolators([identity]);
    expect(i(0.5)).not.toBe(i(0.5));
  });

  describe('不正なオプション', () => {
    it('ranges が足りない分は stagger から求めた区間で補い、余った分は無視する', () => {
      const i = staggerInterpolators([identity, identity], {
        stagger: 1,
        ranges: [[0, 1]],
      });
      // 2つ目は stagger: 1 の区間（0.5 〜 1）
      expect(i(0.75)).toEqual([0.75, 0.5]);
      const j = staggerInterpolators([identity], {
        ranges: [
          [0, 1],
          [0.5, 1],
        ],
      });
      expect(j(0.5)).toEqual([0.5]);
    });

    it('stagger が負の数や有限でない数の場合は既定値（0.5）にする', () => {
      const expected = staggerInterpolators([identity, identity])(0.25);
      for (const stagger of [-1, NaN, Infinity]) {
        expect(
          staggerInterpolators([identity, identity], { stagger })(0.25),
        ).toEqual(expected);
      }
    });
  });

  it('戻り値の型は各 interpolator の戻り値のタプル', () => {
    const i = staggerInterpolators([() => 1, () => 'x']);
    expectTypeOf(i).returns.toEqualTypeOf<[number, string]>();
  });
});

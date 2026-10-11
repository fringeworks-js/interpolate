import interpolatePositionOnRoute from './interpolatePositionOnRoute';

describe('interpolatePositionOnRoute', () => {
  const p0: [number, number] = [0, 0],
    p1: [number, number] = [10, 0],
    p2: [number, number] = [10, 10];
  const i = interpolatePositionOnRoute([p0, p1, p2]);

  it('t に応じた位置と進行方向の角度を返す', () => {
    expect(i(0.25)).toEqual({ point: [5, 0], angle: 0 });
    expect(i(0.75)).toEqual({ point: [10, 5], angle: 90 });
  });

  it('始点と終点', () => {
    expect(i(0)).toEqual({ point: p0, angle: 0 });
    expect(i(0).point).toBe(p0);
    expect(i(1)).toEqual({ point: p2, angle: 90 });
    expect(i(1).point).toBe(p2);
  });

  it('頂点ちょうどの位置では元の点と、これから進む区間の向きを返す', () => {
    const { point, angle } = i(0.5);
    expect(point).toBe(p1);
    expect(angle).toBe(90);
  });

  it('角度は画面座標で x 軸の正の方向から時計回り', () => {
    const j = interpolatePositionOnRoute([
      [0, 0],
      [-10, -10],
    ]);
    expect(j(0.5).angle).toBe(-135);
  });

  it('{ x, y } の点は区間の始点のプロパティを引き継ぐ', () => {
    const j = interpolatePositionOnRoute([
      { x: 0, y: 0, id: 'a' },
      { x: 0, y: 10, id: 'b' },
    ]);
    expect(j(0.5)).toEqual({ point: { x: 0, y: 5, id: 'a' }, angle: 90 });
  });

  describe('範囲外の t', () => {
    it('既定では始点と終点で止める', () => {
      expect(i(-1).point).toBe(p0);
      expect(i(2).point).toBe(p2);
    });

    it('extrapolateStart / extrapolateEnd で延ばす', () => {
      const j = interpolatePositionOnRoute([p0, p1, p2], {
        extrapolateStart: true,
        extrapolateEnd: true,
      });
      expect(j(-0.25)).toEqual({ point: [-5, 0], angle: 0 });
      expect(j(1.5)).toEqual({ point: [10, 20], angle: 90 });
    });
  });

  describe('長さのない区間', () => {
    it('先頭の長さのない区間は飛ばして向きを求める', () => {
      const j = interpolatePositionOnRoute([p0, [0, 0], [0, 10]]);
      expect(j(0).angle).toBe(90);
    });

    it('全体の長さが 0 の場合は角度 0 を返す', () => {
      const q: [number, number] = [0, 0];
      const j = interpolatePositionOnRoute([p0, q]);
      expect(j(0.5)).toEqual({ point: p0, angle: 0 });
      expect(j(1).point).toBe(q);
    });

    it('点が1つの場合はその点を返す', () => {
      expect(interpolatePositionOnRoute([p0])(0.5)).toEqual({
        point: p0,
        angle: 0,
      });
    });

    it('点がない場合はエラーにする', () => {
      expect(() => interpolatePositionOnRoute([])).toThrow(RangeError);
    });
  });

  it('createPoint に区間の情報を渡す', () => {
    const j = interpolatePositionOnRoute([p0, p1], {
      createPoint: (coordinates, { from, to, ratio }) =>
        [...coordinates, from === p0 && to === p1 ? ratio : -1] as never,
    });
    expect(j(0.3).point).toEqual([3, 0, 0.3]);
  });
});

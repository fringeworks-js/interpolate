import interpolatePolyline from './interpolatePolyline';

describe('interpolatePolyline', () => {
  const p0: [number, number] = [0, 0],
    p1: [number, number] = [10, 0],
    p2: [number, number] = [10, 10];
  const i = interpolatePolyline([p0, p1, p2]);

  describe('[x, y] の点', () => {
    it('t=0 のとき先頭の1点を返す', () => {
      expect(i(0)).toEqual([p0]);
    });

    it('t に応じた長さまで引き、末尾の点を補間する', () => {
      expect(i(0.25)).toEqual([p0, [5, 0]]);
      expect(i(0.75)).toEqual([p0, p1, [10, 5]]);
    });

    it('ちょうど頂点に達したときは点を補間しない', () => {
      expect(i(0.5)).toEqual([p0, p1]);
    });

    it('t=1 のとき全体を返す', () => {
      expect(i(1)).toEqual([p0, p1, p2]);
    });

    it('元の点は同じ参照のまま入れる', () => {
      const result = i(0.75);
      expect(result[0]).toBe(p0);
      expect(result[1]).toBe(p1);
    });

    it('毎回新しい配列を返す', () => {
      expect(i(1)).not.toBe(i(1));
    });

    it('3番目以降の要素は区間の始点から引き継ぐ', () => {
      const j = interpolatePolyline([
        [0, 0, 100],
        [10, 0, 200],
      ]);
      expect(j(0.5)[1]).toEqual([5, 0, 100]);
    });
  });

  describe('{ x, y } の点', () => {
    it('補間した点は区間の始点のプロパティを引き継ぐ', () => {
      const j = interpolatePolyline([
        { x: 0, y: 0, id: 'a' },
        { x: 0, y: 10, id: 'b' },
      ]);
      expect(j(0.3)[1]).toEqual({ x: 0, y: 3, id: 'a' });
    });
  });

  describe('snapToVertex', () => {
    const j = interpolatePolyline([p0, p1, p2], { snapToVertex: true });

    it('到達した頂点までを返す', () => {
      expect(j(0.25)).toEqual([p0]);
      expect(j(0.75)).toEqual([p0, p1]);
      expect(j(1)).toEqual([p0, p1, p2]);
    });

    it('外挿しない', () => {
      const k = interpolatePolyline([p0, p1], {
        snapToVertex: true,
        extrapolateStart: true,
        extrapolateEnd: true,
      });
      expect(k(-1)).toEqual([p0]);
      expect(k(2)).toEqual([p0, p1]);
    });
  });

  describe('範囲外の t', () => {
    it('既定では端の状態で止める', () => {
      expect(i(-0.5)).toEqual([p0]);
      expect(i(1.5)).toEqual([p0, p1, p2]);
    });

    it('extrapolateEnd のとき最後の区間の向きに延ばす', () => {
      const j = interpolatePolyline([p0, p1, p2], { extrapolateEnd: true });
      expect(j(1.5)).toEqual([p0, p1, p2, [10, 20]]);
      expect(j(-0.5)).toEqual([p0]);
    });

    it('extrapolateStart のとき最初の区間を逆向きに延ばす', () => {
      const j = interpolatePolyline([p0, p1, p2], { extrapolateStart: true });
      expect(j(-0.25)).toEqual([p0, [-5, 0]]);
      expect(j(1.5)).toEqual([p0, p1, p2]);
    });
  });

  describe('長さのない区間', () => {
    it('同じ位置の点が続いても補間できる', () => {
      const q: [number, number] = [0, 0];
      const j = interpolatePolyline([p0, q, p1], {
        extrapolateStart: true,
        extrapolateEnd: true,
      });
      expect(j(0.5)).toEqual([p0, q, [5, 0]]);
      expect(j(-0.5)).toEqual([p0, [-5, 0]]);
      expect(j(1.5)).toEqual([p0, q, p1, [15, 0]]);
    });

    it('末尾に長さのない区間があっても、長さのある最後の区間の向きに延ばす', () => {
      const q: [number, number] = [10, 0];
      const j = interpolatePolyline([p0, p1, q], { extrapolateEnd: true });
      expect(j(1.5)).toEqual([p0, p1, q, [15, 0]]);
    });

    it('全体の長さが 0 の場合は t < 1 で先頭の1点、t >= 1 で全体を返す', () => {
      const j = interpolatePolyline([p0, [0, 0]]);
      expect(j(0.5)).toEqual([p0]);
      expect(j(1)).toEqual([p0, [0, 0]]);
    });

    it('点が1つ以下の場合', () => {
      expect(interpolatePolyline([p0])(0.5)).toEqual([p0]);
      expect(interpolatePolyline([])(0.5)).toEqual([]);
    });
  });

  describe('getCoordinates / createPoint', () => {
    it('任意の形式の点を扱える', () => {
      type Point = { left: number; top: number; label: string };
      const createPoint = vi.fn(
        ([left, top]: [number, number], { from, to, ratio }): Point => ({
          left,
          top,
          label: `${from.label}-${to.label}:${ratio}`,
        }),
      );
      const j = interpolatePolyline<Point>(
        [
          { left: 0, top: 0, label: 'a' },
          { left: 10, top: 0, label: 'b' },
        ],
        {
          getCoordinates: ({ left, top }) => [left, top],
          createPoint,
        },
      );
      expect(j(0.25)[1]).toEqual({ left: 2.5, top: 0, label: 'a-b:0.25' });
    });

    it('判別できない形式の場合はエラーにする', () => {
      expect(() => interpolatePolyline([{ lat: 0, lng: 0 }])).toThrow(
        TypeError,
      );
    });

    it('createPoint を省略した場合に点を作れない形式はエラーにする', () => {
      const j = interpolatePolyline(['0,0', '10,0'], {
        getCoordinates: (point) =>
          point.split(',').map(Number) as [number, number],
      });
      expect(() => j(0.5)).toThrow(TypeError);
    });
  });
});

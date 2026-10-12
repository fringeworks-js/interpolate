import interpolatePolygon from './interpolatePolygon';

type Point = [number, number];

const square: Point[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe('interpolatePolygon', () => {
  describe('重心から拡大（既定）', () => {
    const i = interpolatePolygon([square]);

    it('t=0 のとき全ての点が重心に集まる', () => {
      expect(i(0)).toEqual([
        [
          [5, 5],
          [5, 5],
          [5, 5],
          [5, 5],
        ],
      ]);
    });

    it('t に応じて拡大する', () => {
      expect(i(0.5)).toEqual([
        [
          [2.5, 2.5],
          [7.5, 2.5],
          [7.5, 7.5],
          [2.5, 7.5],
        ],
      ]);
    });

    it('t=1 のとき元の点を同じ参照のまま返す', () => {
      const result = i(1);
      expect(result).toEqual([square]);
      expect(result[0]!).not.toBe(square);
      expect(result[0]![0]!).toBe(square[0]!);
    });

    it('閉じたリング（最初の点を末尾に繰り返す GeoJSON の形）でも重心は同じ', () => {
      const j = interpolatePolygon([[...square, square[0]!]]);
      expect(j(0)[0]![0]!).toEqual([5, 5]);
    });

    it('回り方が逆でも重心は同じ', () => {
      const j = interpolatePolygon([[...square].reverse()]);
      expect(j(0)[0]![0]!).toEqual([5, 5]);
    });

    it('穴の面積を差し引いた重心にする', () => {
      // 外周（面積 100、重心 (5, 5)）と逆回りの穴（面積 12、重心 (7, 5)）
      const hole: Point[] = [
        [6, 2],
        [6, 8],
        [8, 8],
        [8, 2],
      ];
      const [x, y] = interpolatePolygon([square, hole])(0)[0]![0]!;
      expect(x).toBeCloseTo((100 * 5 - 12 * 7) / 88, 10);
      expect(y).toBeCloseTo(5, 10);
    });

    it('面積がない場合は頂点の平均を基準にする', () => {
      const j = interpolatePolygon([
        [
          [0, 0],
          [4, 0],
          [8, 0],
        ],
      ]);
      expect(j(0)[0]![0]!).toEqual([4, 0]);
    });
  });

  describe('origin', () => {
    it('キーワードは外接矩形から求め、top は y の小さい側とする', () => {
      expect(
        interpolatePolygon([square], { origin: 'top left' })(0)[0]![0]!,
      ).toEqual([0, 0]);
      expect(
        interpolatePolygon([square], { origin: 'right bottom' })(0)[0]![0]!,
      ).toEqual([10, 10]);
      expect(
        interpolatePolygon([square], { origin: 'top' })(0)[0]![0]!,
      ).toEqual([5, 0]);
      expect(
        interpolatePolygon([square], { origin: 'center' })(0)[0]![0]!,
      ).toEqual([5, 5]);
    });

    it('点を指定できる', () => {
      const i = interpolatePolygon([square], { origin: [20, 0] });
      expect(i(0.5)[0]![0]!).toEqual([10, 0]);
    });
  });

  describe('axis', () => {
    it('y のとき y 方向だけ拡大する（底辺から伸ばす）', () => {
      const i = interpolatePolygon([square], { axis: 'y', origin: 'bottom' });
      expect(i(0.5)).toEqual([
        [
          [0, 5],
          [10, 5],
          [10, 10],
          [0, 10],
        ],
      ]);
    });

    it('x のとき x 方向だけ拡大する', () => {
      const i = interpolatePolygon([square], { axis: 'x', origin: 'left' });
      expect(i(0.5)[0]![1]!).toEqual([5, 0]);
    });
  });

  describe('範囲外の t', () => {
    it('既定では端の状態で止める', () => {
      const i = interpolatePolygon([square]);
      expect(i(-1)).toEqual(i(0));
      expect(i(2)).toEqual([square]);
    });

    it('extrapolateEnd のとき 1 倍を超えて拡大する', () => {
      const i = interpolatePolygon([square], { extrapolateEnd: true });
      expect(i(2)[0]![0]!).toEqual([-5, -5]);
    });

    it('extrapolateStart のとき基準点を挟んで裏返る', () => {
      const i = interpolatePolygon([square], { extrapolateStart: true });
      expect(i(-1)[0]![0]!).toEqual([10, 10]);
    });
  });

  describe('点の形式', () => {
    it('{ x, y } の点はプロパティを引き継ぐ', () => {
      const i = interpolatePolygon([
        square.map(([x, y], index) => ({ x, y, index })),
      ]);
      expect(i(0.5)[0]![1]!).toEqual({ x: 7.5, y: 2.5, index: 1 });
    });

    it('getCoordinates / createPoint で任意の形式を扱える', () => {
      type P = { position: Point };
      const i = interpolatePolygon<P>(
        [square.map((position) => ({ position }))],
        {
          getCoordinates: ({ position }) => position,
          createPoint: (position, { source }) => ({ position, source }) as P,
        },
      );
      const point = i(0.5)[0]![0]! as P & { source: P };
      expect(point.position).toEqual([2.5, 2.5]);
      expect(point.source.position).toBe(square[0]!);
    });
  });
});

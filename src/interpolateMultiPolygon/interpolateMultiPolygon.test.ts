import interpolateMultiPolygon from './interpolateMultiPolygon';

type Point = [number, number];

const createSquare = (x: number, y: number, size: number): Point[] => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
];

describe('interpolateMultiPolygon', () => {
  const a = createSquare(0, 0, 2),
    b = createSquare(10, 0, 2);

  it('既定では全体の重心を基準にする', () => {
    const i = interpolateMultiPolygon([[a], [b]]);
    const result = i(0);
    expect(result[0][0][0]).toEqual([6, 1]);
    expect(result[1][0][0]).toEqual([6, 1]);
  });

  it('全体の重心は面積で重み付けする', () => {
    // 面積 4（重心 (1, 1)）と面積 16（重心 (12, 2)）
    const i = interpolateMultiPolygon([[a], [createSquare(10, 0, 4)]]);
    const [x, y] = i(0)[0][0][0];
    expect(x).toBeCloseTo((4 * 1 + 16 * 12) / 20, 10);
    expect(y).toBeCloseTo((4 * 1 + 16 * 2) / 20, 10);
  });

  it('ポリゴンごとに回り方が違っても面積を正しく合計する', () => {
    const i = interpolateMultiPolygon([[a], [[...b].reverse()]]);
    expect(i(0)[0][0][0]).toEqual([6, 1]);
  });

  it('originPerPolygon のときポリゴンごとの重心を基準にする', () => {
    const i = interpolateMultiPolygon([[a], [b]], { originPerPolygon: true });
    const result = i(0);
    expect(result[0][0][0]).toEqual([1, 1]);
    expect(result[1][0][0]).toEqual([11, 1]);
  });

  it('originPerPolygon とキーワードを組み合わせる', () => {
    const i = interpolateMultiPolygon([[a], [b]], {
      originPerPolygon: true,
      origin: 'bottom left',
      axis: 'y',
    });
    const result = i(0.5);
    expect(result[0][0]).toEqual([
      [0, 1],
      [2, 1],
      [2, 2],
      [0, 2],
    ]);
    expect(result[1][0][0]).toEqual([10, 1]);
  });

  it('t=1 のとき元の点を同じ参照のまま返す', () => {
    const result = interpolateMultiPolygon([[a], [b]])(1);
    expect(result).toEqual([[a], [b]]);
    expect(result[1][0][0]).toBe(b[0]);
  });

  it('空の場合は空の配列を返す', () => {
    expect(interpolateMultiPolygon([])(0.5)).toEqual([]);
    expect(interpolateMultiPolygon([], { origin: 'center' })(0.5)).toEqual([]);
    expect(
      interpolateMultiPolygon([[a]], { origin: 'center' })(0)[0][0][0],
    ).toEqual([1, 1]);
  });
});

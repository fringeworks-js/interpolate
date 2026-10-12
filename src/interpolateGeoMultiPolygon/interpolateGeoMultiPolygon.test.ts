import interpolateGeoMultiPolygon from './interpolateGeoMultiPolygon';

type Point = [number, number];

const createSquare = (lng: number, lat: number, size: number): Point[] => [
  [lng, lat],
  [lng + size, lat],
  [lng + size, lat + size],
  [lng, lat + size],
];

describe('interpolateGeoMultiPolygon', () => {
  it('既定では全体の重心を基準にする', () => {
    const i = interpolateGeoMultiPolygon([
      [createSquare(-2, -1, 2)],
      [createSquare(10, -1, 2)],
    ]);
    const result = i(0);
    const [lng0, lat0] = result[0]![0]![0]!;
    const [lng1, lat1] = result[1]![0]![0]!;
    expect(lng0).toBeCloseTo(5, 6);
    expect(lng1).toBeCloseTo(5, 6);
    expect(lat0).toBeCloseTo(0, 6);
    expect(lat1).toBeCloseTo(0, 6);
  });

  it('originPerPolygon のときポリゴンごとの重心を基準にする', () => {
    const i = interpolateGeoMultiPolygon(
      [[createSquare(-2, -1, 2)], [createSquare(10, -1, 2)]],
      { originPerPolygon: true },
    );
    const result = i(0);
    const [lng0] = result[0]![0]![0]!;
    const [lng1] = result[1]![0]![0]!;
    expect(lng0).toBeCloseTo(-1, 6);
    expect(lng1).toBeCloseTo(11, 6);
  });

  it('ポリゴンが経度 ±180° の両側にあっても近い方向に取る', () => {
    // 経度 178 〜 179 と -179 〜 -178 の2つの正方形。全体の重心は経度 180
    const i = interpolateGeoMultiPolygon([
      [createSquare(178, -0.5, 1)],
      [createSquare(-179, -0.5, 1)],
    ]);
    const result = i(0);
    const [lng0] = result[0]![0]![0]!;
    const [lng1] = result[1]![0]![0]!;
    expect(lng0).toBeCloseTo(180, 6);
    expect(lng1).toBeCloseTo(-180, 6);
  });
});

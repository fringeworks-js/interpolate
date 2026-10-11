import interpolateGeoPolygon from './interpolateGeoPolygon';

type LatLng = { lat: number; lng: number };

const expectLatLng = (actual: LatLng, expected: LatLng) => {
  expect(actual.lat).toBeCloseTo(expected.lat, 6);
  expect(actual.lng).toBeCloseTo(expected.lng, 6);
};

describe('interpolateGeoPolygon', () => {
  it('赤道を中心とする正方形は、中心に向かって縮む', () => {
    const i = interpolateGeoPolygon([
      [
        { lat: -1, lng: -1 },
        { lat: -1, lng: 1 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: -1 },
      ],
    ]);
    i(0)[0].forEach((point) => expectLatLng(point, { lat: 0, lng: 0 }));
    const half = i(0.5)[0][2];
    expect(half.lng).toBeCloseTo(0.5, 10);
    // 赤道付近ではメルカトル座標の y はほぼ緯度に比例する
    expect(half.lat).toBeCloseTo(0.5, 3);
  });

  it('メルカトル座標で拡大・縮小する（緯度は線形に補間しない）', () => {
    const i = interpolateGeoPolygon(
      [
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 1 },
          { lat: 60, lng: 1 },
          { lat: 60, lng: 0 },
        ],
      ],
      { origin: 'bottom', axis: 'y' },
    );
    expect(i(0.5)[0][2].lat).toBeCloseTo(35.26438968, 6);
  });

  it('top は北側とする', () => {
    const i = interpolateGeoPolygon(
      [
        [
          { lat: 10, lng: 0 },
          { lat: 10, lng: 1 },
          { lat: 20, lng: 1 },
          { lat: 20, lng: 0 },
        ],
      ],
      { origin: 'top', axis: 'y' },
    );
    i(0)[0].forEach((point) => expect(point.lat).toBeCloseTo(20, 10));
  });

  it('[lng, lat] の点を扱える', () => {
    const i = interpolateGeoPolygon([
      [
        [-1, 0],
        [1, 0],
        [1, 0.000001],
        [-1, 0.000001],
      ],
    ]);
    expect(i(0.5)[0][0][0]).toBeCloseTo(-0.5, 10);
  });

  it('{ lat, lng } の点はプロパティを引き継ぐ', () => {
    const i = interpolateGeoPolygon([
      [
        { lat: 0, lng: 0, id: 'a' },
        { lat: 0, lng: 1, id: 'b' },
        { lat: 1, lng: 1, id: 'c' },
      ],
    ]);
    expect(i(0.5)[0].map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });

  describe('経度 ±180° をまたぐポリゴン', () => {
    const polygon = [
      [
        { lat: -1, lng: 179 },
        { lat: -1, lng: -179 },
        { lat: 1, lng: -179 },
        { lat: 1, lng: 179 },
      ],
    ];

    it('近い方向に取った形の重心を基準にする', () => {
      const i = interpolateGeoPolygon(polygon);
      expectLatLng(i(0)[0][0], { lat: 0, lng: 180 });
    });

    it('元の点の経度から連続した経度で返す', () => {
      const i = interpolateGeoPolygon(polygon);
      const [p0, p1] = i(0.5)[0];
      expect(p0.lng).toBeCloseTo(179.5, 10);
      expect(p1.lng).toBeCloseTo(-179.5, 10);
    });

    it('穴が別の側の経度で書かれていても同じ形として扱う', () => {
      const i = interpolateGeoPolygon([
        polygon[0],
        [
          { lat: -0.5, lng: -179.5 },
          { lat: 0.5, lng: -179.5 },
          { lat: 0.5, lng: 179.5 },
          { lat: -0.5, lng: 179.5 },
        ],
      ]);
      const hole = i(0.5)[1];
      expect(hole[0].lng).toBeCloseTo(-179.75, 6);
      expect(hole[2].lng).toBeCloseTo(179.75, 6);
    });

    it('origin に指定した点も近い方向に取る', () => {
      const i = interpolateGeoPolygon(polygon, {
        origin: { lat: 0, lng: -180 },
      });
      expectLatLng(i(0)[0][0], { lat: 0, lng: 180 });
    });
  });
});

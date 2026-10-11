import interpolateGeoPolyline from './interpolateGeoPolyline';

type LatLng = { lat: number; lng: number };

const expectLatLng = (actual: LatLng, expected: LatLng) => {
  expect(actual.lat).toBeCloseTo(expected.lat, 6);
  expect(actual.lng).toBeCloseTo(expected.lng, 6);
};

describe('interpolateGeoPolyline', () => {
  describe('メルカトル座標（既定）', () => {
    it('経線に沿った線はメルカトル座標の y で補間する', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 0 },
        { lat: 60, lng: 0 },
      ]);
      expectLatLng(i(0.5)[1], { lat: 35.26438968, lng: 0 });
    });

    it('赤道に沿った線は経度で線形に補間する', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 10 },
        { lat: 0, lng: 50 },
      ]);
      expectLatLng(i(0.25)[1], { lat: 0, lng: 20 });
    });

    it('[lng, lat] の点を扱える', () => {
      const i = interpolateGeoPolyline([
        [10, 0],
        [50, 0, 100],
      ]);
      const [lng, lat, ...rest] = i(0.25)[1];
      expect(lng).toBeCloseTo(20, 6);
      expect(lat).toBeCloseTo(0, 6);
      expect(rest).toEqual([]);
    });

    it('補間した点は区間の始点のプロパティを引き継ぐ', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 0, id: 'a' },
        { lat: 0, lng: 10, id: 'b' },
      ]);
      expect(i(0.5)[1].id).toBe('a');
    });

    it('極に近い点があっても計算できる', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 0 },
        { lat: 90, lng: 0 },
      ]);
      const { lat } = i(0.5)[1];
      expect(Number.isFinite(lat)).toBe(true);
      expect(lat).toBeGreaterThan(0);
      expect(lat).toBeLessThan(90);
    });
  });

  describe('経度 ±180° をまたぐ線', () => {
    it('近い方向に補間し、直前の頂点から連続した経度にする', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 179 },
        { lat: 0, lng: -179 },
      ]);
      expectLatLng(i(0.5)[1], { lat: 0, lng: 180 });
      expectLatLng(i(0.75)[1], { lat: 0, lng: 180.5 });
    });

    it('西向きにまたぐ', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: -179 },
        { lat: 0, lng: 179 },
      ]);
      expectLatLng(i(0.75)[1], { lat: 0, lng: -180.5 });
    });

    it('連続した経度（Leaflet の形式）の入力も扱える', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 179 },
        { lat: 0, lng: 181 },
      ]);
      expectLatLng(i(0.5)[1], { lat: 0, lng: 180 });
    });

    it('長さは近い方向で測る', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 179 },
        { lat: 0, lng: -179 },
        { lat: 0, lng: -177 },
      ]);
      // 2° + 2° の折れ線の半分
      expect(i(0.5)).toHaveLength(2);
      expectLatLng(i(0.75)[2], { lat: 0, lng: -178 });
    });

    it('複数回またいでも直前の頂点から連続した経度にする', () => {
      const i = interpolateGeoPolyline([
        { lat: 0, lng: 170 },
        { lat: 0, lng: -170 },
        { lat: 0, lng: 170 },
      ]);
      expectLatLng(i(0.75)[2], { lat: 0, lng: -180 });
    });
  });

  describe('geodesic', () => {
    it('赤道に沿った大円', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 90 },
        ],
        { geodesic: true },
      );
      expectLatLng(i(0.5)[1], { lat: 0, lng: 45 });
    });

    it('経線に沿った大円は緯度で線形に補間する', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 0, lng: 0 },
          { lat: 60, lng: 0 },
        ],
        { geodesic: true },
      );
      expectLatLng(i(0.5)[1], { lat: 30, lng: 0 });
    });

    it('経度 ±180° をまたぐ大円', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 60, lng: -170 },
          { lat: 60, lng: 170 },
        ],
        { geodesic: true },
      );
      expectLatLng(i(0.5)[1], { lat: 60.3783481248, lng: -180 });
    });

    it('extrapolateEnd のとき大円に沿って延ばす', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 90 },
        ],
        { geodesic: true, extrapolateEnd: true },
      );
      expectLatLng(i(1.5)[2], { lat: 0, lng: 135 });
    });

    it('対蹠点どうしの区間は緯度経度の直線で補間する', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 180 },
        ],
        { geodesic: true },
      );
      // 経度の差がちょうど 180° のため、向きは定まらない
      const { lat, lng } = i(0.5)[1];
      expect(lat).toBeCloseTo(0, 6);
      expect(Math.abs(lng)).toBeCloseTo(90, 6);
    });
  });

  describe('範囲外の t', () => {
    it('extrapolateStart / extrapolateEnd で延ばす', () => {
      const i = interpolateGeoPolyline(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 10 },
        ],
        { extrapolateStart: true, extrapolateEnd: true },
      );
      expectLatLng(i(-0.5)[1], { lat: 0, lng: -5 });
      expectLatLng(i(1.5)[2], { lat: 0, lng: 15 });
    });
  });

  it('判別できない形式の場合はエラーにする', () => {
    expect(() => interpolateGeoPolyline([{ x: 0, y: 0 }])).toThrow(TypeError);
  });

  it('createPoint を省略した場合に点を作れない形式はエラーにする', () => {
    const i = interpolateGeoPolyline(['0,0', '10,0'], {
      getCoordinates: (point) =>
        point.split(',').map(Number) as [number, number],
    });
    expect(() => i(0.5)).toThrow(TypeError);
  });
});

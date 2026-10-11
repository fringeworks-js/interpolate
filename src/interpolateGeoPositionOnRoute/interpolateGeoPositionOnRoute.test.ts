import interpolateGeoPositionOnRoute from './interpolateGeoPositionOnRoute';

describe('interpolateGeoPositionOnRoute', () => {
  describe('メルカトル座標（既定）', () => {
    it('北向きは 0、東向きは 90、南向きは 180、西向きは -90', () => {
      const north = interpolateGeoPositionOnRoute([
        { lat: 0, lng: 0 },
        { lat: 10, lng: 0 },
      ]);
      const east = interpolateGeoPositionOnRoute([
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
      ]);
      const south = interpolateGeoPositionOnRoute([
        { lat: 10, lng: 0 },
        { lat: 0, lng: 0 },
      ]);
      const west = interpolateGeoPositionOnRoute([
        { lat: 0, lng: 10 },
        { lat: 0, lng: 0 },
      ]);
      expect(north(0.5).heading).toBeCloseTo(0, 10);
      expect(east(0.5).heading).toBeCloseTo(90, 10);
      expect(south(0.5).heading).toBeCloseTo(180, 10);
      expect(west(0.5).heading).toBeCloseTo(-90, 10);
    });

    it('方位は画面上（メルカトル座標）の向き', () => {
      const i = interpolateGeoPositionOnRoute([
        [0, 0],
        [10, 10],
      ]);
      expect(i(0.5).heading).toBeCloseTo(44.85381264, 6);
    });

    it('位置は interpolateGeoPolyline と同じく求める', () => {
      const i = interpolateGeoPositionOnRoute([
        { lat: 0, lng: 0, id: 'a' },
        { lat: 60, lng: 0, id: 'b' },
      ]);
      const { point } = i(0.5);
      expect(point.lat).toBeCloseTo(35.26438968, 6);
      expect(point.id).toBe('a');
    });

    it('経度 ±180° をまたぐルート', () => {
      const i = interpolateGeoPositionOnRoute([
        { lat: 0, lng: 179 },
        { lat: 0, lng: -179 },
      ]);
      const { point, heading } = i(0.5);
      expect(point.lng).toBeCloseTo(180, 10);
      expect(heading).toBeCloseTo(90, 10);
    });
  });

  describe('geodesic', () => {
    const i = interpolateGeoPositionOnRoute(
      [
        { lat: 60, lng: -170 },
        { lat: 60, lng: 170 },
      ],
      { geodesic: true },
    );

    it('始点での方位は大円の初期方位', () => {
      expect(i(0).heading).toBeCloseTo(-81.3177961, 6);
    });

    it('大円の頂点では真西を向く', () => {
      const { point, heading } = i(0.5);
      expect(point.lng).toBeCloseTo(-180, 6);
      expect(heading).toBeCloseTo(-90, 6);
    });

    it('終点での方位は始点と対称になる', () => {
      expect(i(1).heading).toBeCloseTo(-180 + 81.3177961, 6);
    });

    it('extrapolateEnd のとき大円に沿って延ばす', () => {
      const j = interpolateGeoPositionOnRoute(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 90 },
        ],
        { geodesic: true, extrapolateEnd: true },
      );
      const { point, heading } = j(1.5);
      expect(point.lng).toBeCloseTo(135, 10);
      expect(heading).toBeCloseTo(90, 10);
    });

    it('対蹠点どうしの区間は緯度経度の向きで代用する', () => {
      const j = interpolateGeoPositionOnRoute(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 180 },
        ],
        { geodesic: true },
      );
      expect(Math.abs(j(0.5).heading)).toBeCloseTo(90, 10);
    });
  });
});

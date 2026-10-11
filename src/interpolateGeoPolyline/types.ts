import type { PolylineOptions } from '../_internal/_types';

export type { Coordinates, PolylinePointContext } from '../_internal/_types';

/**
 * `interpolateGeoPolyline` のオプション
 */
export type InterpolateGeoPolylineOptions<P> = PolylineOptions<P> & {
  /**
   * 大円に沿って補間する（Google Maps の Polyline の `geodesic` と同じ）
   */
  geodesic?: boolean;
};

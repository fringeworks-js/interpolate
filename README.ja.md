# @fringeworks/interpolate

`@fringeworks/interpolate` は、タイピング演出や地図上の線・ポリゴンのアニメーションなど [d3-interpolate](https://d3js.org/d3-interpolate) にない補間関数を集めた、誰かにとっては便利なライブラリです。

**[English README is available here](./README.md)**

## インストール

```bash
npm install @fringeworks/interpolate
# または
pnpm add @fringeworks/interpolate
```

## 使い方

関数・型・定数は、ルートと関数単位のパスのどちらからでも同じ名前で import できます。関数単位のパスでは、その関数を default import することもできます。

```ts
import { interpolateTyping } from '@fringeworks/interpolate';
import interpolateTyping from '@fringeworks/interpolate/interpolateTyping';
```

各関数は d3-interpolate と同じく、値を受け取り、`t`（0 〜 1）に応じた値を返す関数を返します。d3-transition の `tween` などにそのまま渡せます。

```ts
const i = interpolateTyping('', 'Hello');
i(0); // ''
i(0.6); // 'Hel'
i(1); // 'Hello'
```

### 範囲外の `t`

`t` が 0 〜 1 の範囲外の場合は、端の状態で止めます。polyline・ルート・モーフィング・polygon 系の関数では、`extrapolateStart`（t < 0）/ `extrapolateEnd`（t > 1）を指定すると、範囲外でも計算します。`backOut` や `elasticOut` のように行き過ぎるイージングと組み合わせる場合に使います。

### 点の形

点を扱う関数は、次の形の点を自動で判別します。それ以外の形式は、`getCoordinates` と `createPoint` のオプションで変換します。

| 関数                          | 点の形                                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| `interpolatePolyline` など    | `[x, y]` / `{ x, y }`                                                |
| `interpolateGeoPolyline` など | `[lng, lat]`（GeoJSON の順）/ `{ lat, lng }`（Google Maps、Leaflet） |

新しく作る点は、元の点のプロパティ（配列の場合は 3 番目以降の要素）を引き継ぎます。

```ts
// { latitude, longitude } の点
interpolateGeoPolyline(points, {
  getCoordinates: ({ latitude, longitude }) => [longitude, latitude],
  createPoint: ([longitude, latitude], { from }) => ({
    ...from,
    latitude,
    longitude,
  }),
});
```

### 地図上の計算

地図用の関数（名前に `Geo` を含むもの）は、Google Maps や Leaflet の通常の描画に合わせて、メルカトル座標で計算します。特定の地図ライブラリには依存しません。

- 経度 ±180° をまたぐ区間は、近い方向に取ります（179° → -179° は 2° の移動）
- 新しく作る点の経度は -180 〜 180 に正規化せず、元の点の経度から連続した値にします（例: 179° の次は 181°）。Google Maps は経度を自動で正規化し、Leaflet は連続した経度で正しく描けます
- 投影する緯度は、Web メルカトルの範囲（±85.0511°）に制限します

### 合成

`chainInterpolators` と `staggerInterpolators` は、interpolator を組み合わせて1つの interpolator にします。どちらも時間を持たず、`t` から値を求めるだけなので、任意の時点の値を求めたり、スクロールやスライダーに連動させたりできます。d3-transition を使えない DOM 以外の対象（地図や Canvas）でも、`requestAnimationFrame` などで `t` を進めるだけで動かせます。合成した interpolator をさらに合成することもできます。`reverseInterpolator` と `repeatInterpolator` で、逆再生や繰り返しもできます。

---

## API

| 関数                                                | 説明                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `interpolateTyping(a, b, options?)`                 | 文字列をタイピングで打ち替えるように補間する関数を返す                               |
| `interpolateFormattedNumber(a, b, options?)`        | 数値を補間し、書式化した文字列を返す関数を返す                                       |
| `interpolateDurationText(a, b, options?)`           | 時間の文字列（`mm:ss` など）を補間する関数を返す                                     |
| `interpolateScramble(a, b, options?)`               | 文字列を、ランダムな文字を経て別の文字列に変える関数を返す                           |
| `interpolatePolyline(points, options?)`             | 折れ線を、先頭から t の割合の長さまで引いた折れ線を返す関数を返す                    |
| `interpolateGeoPolyline(points, options?)`          | `interpolatePolyline` の地図用                                                       |
| `interpolatePolylineMorph(a, b, options?)`          | 折れ線を別の折れ線へ変形させる関数を返す                                             |
| `interpolateGeoPolylineMorph(a, b, options?)`       | `interpolatePolylineMorph` の地図用                                                  |
| `interpolatePositionOnRoute(route, options?)`       | 折れ線をルートとして、t の割合の位置と進行方向を返す関数を返す                       |
| `interpolateGeoPositionOnRoute(route, options?)`    | `interpolatePositionOnRoute` の地図用                                                |
| `createArc(from, to, options?)`                     | 2点を結ぶ弧を、折れ線の頂点の配列として作る                                          |
| `createGeoArc(from, to, options?)`                  | `createArc` の地図用                                                                 |
| `interpolatePolygon(polygon, options?)`             | ポリゴンを基準点から拡大し、面積 0 から元の形まで変化させる関数を返す                |
| `interpolateGeoPolygon(polygon, options?)`          | `interpolatePolygon` の地図用                                                        |
| `interpolateMultiPolygon(polygons, options?)`       | `interpolatePolygon` の複数のポリゴン用                                              |
| `interpolateGeoMultiPolygon(polygons, options?)`    | `interpolateMultiPolygon` の地図用                                                   |
| `interpolateGeoCamera(a, b, options?)`              | 地図のカメラを、遠い場所へは一度ズームアウトしてから移動するように補間する関数を返す |
| `chainInterpolators(interpolators, options?)`       | 複数の interpolator を順番に再生する interpolator を返す                             |
| `staggerInterpolators(interpolators, options?)`     | 複数の interpolator を少しずつずらして同時に再生する interpolator を返す             |
| `reverseInterpolator(interpolator)`                 | interpolator を逆向きに再生する interpolator を返す                                  |
| `repeatInterpolator(interpolator, count, options?)` | interpolator を指定した回数だけ繰り返す interpolator を返す                          |

### `interpolateTyping`

```ts
interpolateTyping(a: string, b: string, options?: InterpolateTypingOptions): (t: number) => string
```

文字列をタイピングで打ち替えるように補間する関数を返します。

- `a` が空の場合は、`b` を先頭から打ちます
- `b` が空の場合は、`a` を末尾から消します
- どちらもある場合は、`eraseRatio` の割合の時間（デフォルトは前半の 0 〜 0.5）で `a` を末尾から消し、残りの時間で `b` を打ちます
- `keepCommonPrefix` を指定した場合は、共通する先頭部分を残し、違う部分だけを消して打ちます。消す部分か打つ部分がない場合は、残った方が全体の時間を使います

文字は書記素（見た目の1文字）単位で扱い、絵文字や結合文字を途中で分割しません。`Intl.Segmenter` に対応していない環境では、コードポイント単位で扱います。\
`t` が 0 以下の場合は `a`、1 以上の場合は `b` を返します。

```ts
interpolateTyping('', 'Hello')(0.6); // 'Hel'
interpolateTyping('Hello', '')(0.4); // 'Hel'
interpolateTyping('Hello', 'World')(0.25); // 'He'
interpolateTyping('Hello', 'World')(0.75); // 'Wo'
interpolateTyping('Hello', 'World', { eraseRatio: 0.2 })(0.6); // 'Wo'
```

| 引数       | 型                         | 説明                                 |
| ---------- | -------------------------- | ------------------------------------ |
| `a`        | `string`                   | 補間前の文字列（`t` = 0 のときの値） |
| `b`        | `string`                   | 補間後の文字列（`t` = 1 のときの値） |
| `options?` | `InterpolateTypingOptions` | 下記のオプション                     |

| オプション          | 型        | 説明                                                                                                                        |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `eraseRatio?`       | `number`  | 消してから打つ場合に、全体のうち消す時間の割合（0 〜 1）。範囲外は 0 〜 1 に収め、`NaN` は `0.5` にする。デフォルトは `0.5` |
| `keepCommonPrefix?` | `boolean` | 共通する先頭部分（書記素単位）を残し、違う部分だけを消して打つ                                                              |

### `interpolateFormattedNumber`

```ts
interpolateFormattedNumber(a: number, b: number, options?: InterpolateFormattedNumberOptions): (t: number) => string
```

数値を補間し、書式化した文字列を返す関数を返します。カウントアップの表示などに使います。

- 途中の値は、既定では `a` と `b` の小数の桁数の多い方に丸めてから書式化します。整数どうしなら途中も整数になり、`1,234.567` のような表示が出ません
- `t` が 0 以下の場合は `a`、1 以上の場合は `b` を書式化します

```ts
const i = interpolateFormattedNumber(1200, 12000, {
  formatter: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }),
});
i(0.5); // '￥6,600'

interpolateFormattedNumber(0, 100, { formatter: (value) => `${value}%` })(0.25); // '25%'
```

| オプション        | 型                | 説明                                                                                                                                     |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `formatter?`      | `NumberFormatter` | 数値を文字列にする関数、または `Intl.NumberFormat`。デフォルトは `new Intl.NumberFormat()`（実行環境のロケール）                         |
| `fractionDigits?` | `number`          | 途中の値を丸める小数の桁数。小数は四捨五入し、負の数・有限でない数の場合はデフォルトにする。デフォルトは `a` と `b` の小数の桁数の多い方 |
| `rounding?`       | `Rounding`        | 丸め方（`'round'` / `'floor'` / `'ceil'`）。カウントダウンで `'ceil'` にすると、0 になる直前まで 1 を表示する。デフォルトは `'round'`    |

### `interpolateDurationText`

```ts
interpolateDurationText(a: string, b: string, options?: InterpolateDurationTextOptions): (t: number) => string
```

時間の文字列を補間する関数を返します。タイマーやカウントダウンの表示などに使います。

- `h:mm:ss` / `mm:ss` / `ss` の形式を読み取り、秒は小数も指定できます（`00:09.58`）。読み取れない文字列の場合は `TypeError` を投げます
- 全体を秒数に直してから補間するので、`00:59` → `01:00` のような繰り上がりも自然につながります
- 途中の文字列は `b` の形式（区切りの数・ゼロ埋めの桁数・小数の桁数）に合わせ、`b` の最小の単位に丸めます。最初の部分のゼロ埋めは、区切りの数が同じなら `a` と `b` の少ない方の桁数にします
- 最初の部分は 60 や 24 を超えてもそのまま表示します（`90:00`、`30:00:00`）。日付をまたがない時刻（`09:00` → `17:30`）も扱えます
- `t` が 0 以下の場合は `a`、1 以上の場合は `b` をそのまま返します

```ts
interpolateDurationText('05:00', '00:00')(0.5); // '02:30'
interpolateDurationText('0:00:00', '1:30:00')(0.5); // '0:45:00'
interpolateDurationText('00:00.00', '00:09.58')(0.5); // '00:04.79'
```

| オプション  | 型         | 説明                                                                                                |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `rounding?` | `Rounding` | 途中の値を `b` の最小の単位に丸める方法（`'round'` / `'floor'` / `'ceil'`）。デフォルトは `'round'` |

### `interpolateScramble`

```ts
interpolateScramble(a: string, b: string, options?: InterpolateScrambleOptions): (t: number) => string
```

文字列を、ランダムな文字を経て別の文字列に変える関数を返します。

- 文字ごとに区間をずらし、区間の前は `a` の文字、区間の中はランダムな文字、区間の後は `b` の文字にします。左から順に確定していきます
- 長さが違う場合は長い方に合わせます。`b` にない位置は確定すると消え、`a` にない位置は区間が始まるまで表示しません
- 空白はランダムな文字にしません。文字は書記素（見た目の1文字）単位で扱います
- 同じ `t` には必ず同じ文字列を返します。ランダムな文字は、位置と `t` から求めた疑似乱数で決めます
- `t` が 0 以下の場合は `a`、1 以上の場合は `b` をそのまま返します

```ts
const i = interpolateScramble('', 'ACCESS GRANTED');
i(0.3); // 'Amxypi'
i(0.5); // 'ACCES1 7D'（左から確定し、残りはランダムな文字）
i(0.7); // 'ACCESS GxeSnC'
```

| オプション     | 型       | 説明                                                                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `stagger?`     | `number` | 次の文字の開始までの間隔を、1文字分の長さに対する割合で表す。0 は全ての文字が同時、1 は1文字ずつ順番になる。デフォルトは `0.2` |
| `characters?`  | `string` | ランダムに使う文字。デフォルトは英大文字・小文字・数字                                                                         |
| `changeCount?` | `number` | `t` が 0 から 1 まで進む間に、ランダムな文字が入れ替わる回数。デフォルトは `60`                                                |
| `seed?`        | `number` | ランダムな文字の並びを決める値。デフォルトは `0`                                                                               |

`characters` が空の場合や、`stagger` / `changeCount` が負の数・有限でない数の場合は、デフォルトの値を使います。

### `interpolatePolyline`

```ts
interpolatePolyline<P>(points: readonly P[], options?: InterpolatePolylineOptions<P>): (t: number) => P[]
```

折れ線を、先頭から全体の長さの `t` の割合まで引いた折れ線を返す関数を返します。線を引いていくアニメーションに使います。

- 末尾には、`t` に当たる位置の点を区間の途中で補間して加えます
- `t` が 0 以下の場合は先頭の1点、1 以上の場合は全体を返します
- 返す配列は毎回新しく作ります。元の点は同じ参照のまま入れ、新しく作るのは補間した点だけです

```ts
const i = interpolatePolyline([
  [0, 0],
  [10, 0],
  [10, 10],
]);
i(0.25); // [[0, 0], [5, 0]]
i(0.75); // [[0, 0], [10, 0], [10, 5]]
```

| オプション          | 型                                                                  | 説明                                                                                          |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `snapToVertex?`     | `boolean`                                                           | 補間した点を加えず、到達した頂点までにする。このとき外挿はしない                              |
| `extrapolateStart?` | `boolean`                                                           | t < 0 でも計算し、最初の区間を逆向きに延ばす                                                  |
| `extrapolateEnd?`   | `boolean`                                                           | t > 1 でも計算し、最後の区間の向きに延ばす                                                    |
| `getCoordinates?`   | `(point: P) => Coordinates`                                         | 点から座標を取り出す関数                                                                      |
| `createPoint?`      | `(coordinates: Coordinates, context: PolylinePointContext<P>) => P` | 座標から点を作る関数。`context` には区間の始点 `from`・終点 `to`・区間内の割合 `ratio` が入る |

### `interpolateGeoPolyline`

```ts
interpolateGeoPolyline<P>(points: readonly P[], options?: InterpolateGeoPolylineOptions<P>): (t: number) => P[]
```

`interpolatePolyline` の地図用です。既定では、メルカトル座標の直線（Google Maps / Leaflet の通常の描画）として補間し、長さも投影した座標で測ります。そのため、画面上で一定の速さで線が伸びます。

```ts
const i = interpolateGeoPolyline([
  { lat: 35.68, lng: 139.77 },
  { lat: 21.31, lng: -157.86 }, // 経度 ±180° をまたぐ
]);
polyline.setPath(i(0.5));
```

`interpolatePolyline` のオプションに加えて、次のオプションがあります。

| オプション  | 型        | 説明                                                                       |
| ----------- | --------- | -------------------------------------------------------------------------- |
| `geodesic?` | `boolean` | 大円に沿って補間する。Google Maps の Polyline の `geodesic` と合わせて使う |

### `interpolatePolylineMorph`

```ts
interpolatePolylineMorph<P>(a: readonly P[], b: readonly P[], options?: InterpolatePolylineMorphOptions<P>): (t: number) => P[]
```

折れ線を別の折れ線へ変形させる関数を返します。

- 両方の頂点の位置（全体の長さに対する割合）を合わせた点で両方を打ち直し、対応する点どうしを線形に補間します。点の数が違っても対応づけられ、どちらの角も途中で丸まりません
- `t` が 0 以下の場合は `a`、1 以上の場合は `b` の点を、新しい配列で返します
- 新しく作る点は、`t` が 0.5 未満なら `a` 側、それ以外は `b` 側の直前の頂点のプロパティを引き継ぎます
- 向きが逆の折れ線どうしは、線が裏返るように動きます。必要なら、あらかじめ向きをそろえてください
- どちらかの折れ線に点がない場合は、点のある側の `origin`（デフォルトは始点）から広がる、またはそこへ縮みます。線の形を保ったまま基準点に向かって変化するので、線を巻き取るように消したい場合は `reverseInterpolator(interpolatePolyline(route))` を使います。両方とも点がない場合は、常に空の配列を返します

```ts
const i = interpolatePolylineMorph(
  [
    [0, 0],
    [5, 0],
    [10, 0],
  ],
  [
    [0, 10],
    [10, 20],
  ],
);
i(0.5); // [[0, 5], [5, 7.5], [10, 10]]
```

| オプション          | 型                                                                       | 説明                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `origin?`           | `'start' \| 'end' \| 'center' \| P`                                      | どちらかの折れ線に点がない場合に、広がる・縮む基準点。点のある側の始点・終点・全体の長さの半分の位置、または点を指定する。デフォルトは `'start'` |
| `extrapolateStart?` | `boolean`                                                                | t < 0 でも計算する                                                                                                                               |
| `extrapolateEnd?`   | `boolean`                                                                | t > 1 でも計算する                                                                                                                               |
| `getCoordinates?`   | `(point: P) => Coordinates`                                              | 点から座標を取り出す関数                                                                                                                         |
| `createPoint?`      | `(coordinates: Coordinates, context: PolylineMorphPointContext<P>) => P` | 座標から点を作る関数。`context` には `a` 側の直前の頂点 `from`・`b` 側の直前の頂点 `to`・`t` の値 `ratio` が入る                                 |

### `interpolateGeoPolylineMorph`

```ts
interpolateGeoPolylineMorph<P>(a: readonly P[], b: readonly P[], options?: InterpolateGeoPolylineMorphOptions<P>): (t: number) => P[]
```

`interpolatePolylineMorph` の地図用です。メルカトル座標に投影してから補間します。オプションは `interpolatePolylineMorph` と同じです。

### `interpolatePositionOnRoute`

```ts
interpolatePositionOnRoute<P>(route: readonly P[], options?: InterpolatePositionOnRouteOptions<P>): (t: number) => RoutePosition<P>
```

折れ線をルートとして、先頭から全体の長さの `t` の割合の位置 `point` と、進行方向の角度 `angle` を返す関数を返します。アイコンを回転させながらルートに沿って動かす場合などに使います。

- `angle` は画面座標で x 軸の正の方向から時計回りの角度（度、-180 〜 180）です。CSS の `rotate()` にそのまま渡せます
- 頂点ちょうどの位置では元の点を同じ参照のまま返し、向きはこれから進む区間の向き（終点では最後の区間の向き）にします
- 全体の長さが 0 の場合、`angle` は 0 です。点がない場合は `RangeError` を投げます

```ts
const i = interpolatePositionOnRoute([
  [0, 0],
  [10, 0],
  [10, 10],
]);
i(0.25); // { point: [5, 0], angle: 0 }
i(0.75); // { point: [10, 5], angle: 90 }
```

オプションは、`snapToVertex` を除いて `interpolatePolyline` と同じです（`extrapolateStart` / `extrapolateEnd` / `getCoordinates` / `createPoint`）。

### `interpolateGeoPositionOnRoute`

```ts
interpolateGeoPositionOnRoute<P>(route: readonly P[], options?: InterpolateGeoPositionOnRouteOptions<P>): (t: number) => GeoRoutePosition<P>
```

`interpolatePositionOnRoute` の地図用です。位置 `point` と、進行方向の方位 `heading` を返します。

- `heading` は北から時計回りの方位（度、-180 〜 180）で、Google Maps の `computeHeading` と同じ向きです
- 既定ではメルカトル座標の直線として扱い、`heading` も画面上の向きになります。`geodesic` を指定した場合は大円に沿って動き、`heading` もその位置での大円の向きになります

```ts
const i = interpolateGeoPositionOnRoute(route);
const { point, heading } = i(t);
marker.setPosition(point);
marker.setIcon({ ...icon, rotation: heading });
```

オプションは、`snapToVertex` を除いて `interpolateGeoPolyline` と同じです（`geodesic` / `extrapolateStart` / `extrapolateEnd` / `getCoordinates` / `createPoint`）。

### `createArc`

```ts
createArc<P>(from: P, to: P, options?: CreateArcOptions<P>): P[]
```

2点を結ぶ弧（2次ベジェ曲線）を、折れ線の頂点の配列として作ります。`interpolatePolyline` で弧を引いていったり、`interpolatePositionOnRoute` で弧に沿って動かしたりするのに使います。

- 座標は画面座標（y が下向き）として扱います
- 両端は渡した点をそのまま入れ、途中の点は `from` のプロパティを引き継ぎます

```ts
const arc = createArc([0, 0], [10, 0]);
arc[32]; // [5, -2]（距離の 0.2 倍の高さで、進行方向の左に膨らむ）
interpolatePolyline(arc);
```

| オプション        | 型                                                                  | 説明                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curvature?`      | `number`                                                            | 弧の高さを2点間の距離に対する割合で表す。正の値は進行方向の左、負の値は右に膨らみ、0 は直線になる。有限でない数の場合はデフォルトにする。デフォルトは `0.2` |
| `segmentCount?`   | `number`                                                            | 弧を何本の線分で表すか。小数は四捨五入し、1 未満・有限でない数の場合はデフォルトにする。デフォルトは `64`                                                   |
| `getCoordinates?` | `(point: P) => Coordinates`                                         | 点から座標を取り出す関数                                                                                                                                    |
| `createPoint?`    | `(coordinates: Coordinates, context: PolylinePointContext<P>) => P` | 座標から点を作る関数。`context` には始点 `from`・終点 `to`・曲線上の位置 `ratio`（0 〜 1）が入る                                                            |

### `createGeoArc`

```ts
createGeoArc<P>(from: P, to: P, options?: CreateGeoArcOptions<P>): P[]
```

`createArc` の地図用です。メルカトル座標で計算するので、画面上できれいな弧になります。経度 ±180° をまたぐ場合は近い方向に取り、途中の点の経度は始点の経度から連続した値にします。オプションは `createArc` と同じです。

```ts
const arc = createGeoArc(
  { lat: 35.55, lng: 139.78 },
  { lat: 21.32, lng: -157.92 },
);
interpolateGeoPolyline(arc); // 弧を引いていく
interpolateGeoPositionOnRoute(arc); // 弧に沿って飛行機のアイコンを動かす
```

### `interpolatePolygon`

```ts
interpolatePolygon<P>(polygon: readonly (readonly P[])[], options?: InterpolatePolygonOptions<P>): (t: number) => P[][]
```

ポリゴンを基準点を中心に拡大・縮小し、面積 0（`t` = 0）から元の形（`t` = 1）まで変化させる関数を返します。

- `polygon` は GeoJSON の Polygon と同じく、リングの配列です（1つ目が外周、2つ目以降が穴）。最初の点を末尾に繰り返した閉じたリングでも、繰り返さないリングでも扱えます
- 座標は画面座標（y が下向き）として扱います。`origin` の `top` は y の小さい側です
- `t` が 1 以上の場合は、元の点を同じ参照のまま返します

```ts
const square = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
];
interpolatePolygon(square)(0.5); // [[[2.5, 2.5], [7.5, 2.5], [7.5, 7.5], [2.5, 7.5]]]
interpolatePolygon(square, { origin: 'bottom', axis: 'y' })(0.5); // [[[0, 5], [10, 5], [10, 10], [0, 10]]]
```

| オプション          | 型                                                                 | 説明                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin?`           | `'centroid' \| OriginKeyword \| P`                                 | 拡大・縮小の基準点。`'centroid'` は面積の重心（外周と逆回りのリングは穴として差し引く）。キーワードは外接矩形から求める。デフォルトは `'centroid'` |
| `axis?`             | `ScaleAxis`                                                        | 拡大・縮小する軸。`'x'` / `'y'` の場合は、辺から伸ばすように変化する。デフォルトは `'both'`                                                        |
| `extrapolateStart?` | `boolean`                                                          | t < 0 でも計算し、基準点を挟んで裏返す                                                                                                             |
| `extrapolateEnd?`   | `boolean`                                                          | t > 1 でも計算し、1 倍を超えて拡大する                                                                                                             |
| `getCoordinates?`   | `(point: P) => Coordinates`                                        | 点から座標を取り出す関数                                                                                                                           |
| `createPoint?`      | `(coordinates: Coordinates, context: PolygonPointContext<P>) => P` | 座標から点を作る関数。`context` には元の点 `source` が入る                                                                                         |

### `interpolateGeoPolygon`

```ts
interpolateGeoPolygon<P>(polygon: readonly (readonly P[])[], options?: InterpolateGeoPolygonOptions<P>): (t: number) => P[][]
```

`interpolatePolygon` の地図用です。メルカトル座標に投影してから拡大・縮小するので、高緯度でも画面上で形が歪みません。`origin` の `top` は北側です。オプションは `interpolatePolygon` と同じです。

### `interpolateMultiPolygon`

```ts
interpolateMultiPolygon<P>(polygons: readonly (readonly (readonly P[])[])[], options?: InterpolateMultiPolygonOptions<P>): (t: number) => P[][][]
```

`interpolatePolygon` の複数のポリゴン用です。`polygons` は GeoJSON の MultiPolygon と同じく、ポリゴンの配列です。既定では、全体で1つの基準点を使います。

`interpolatePolygon` のオプションに加えて、次のオプションがあります。

| オプション          | 型        | 説明                                                 |
| ------------------- | --------- | ---------------------------------------------------- |
| `originPerPolygon?` | `boolean` | 基準点をポリゴンごとに求め、それぞれの位置で拡大する |

### `interpolateGeoMultiPolygon`

```ts
interpolateGeoMultiPolygon<P>(polygons: readonly (readonly (readonly P[])[])[], options?: InterpolateGeoMultiPolygonOptions<P>): (t: number) => P[][][]
```

`interpolateMultiPolygon` の地図用です。オプションは `interpolateMultiPolygon` と同じです。

### `interpolateGeoCamera`

```ts
interpolateGeoCamera<P>(a: GeoCamera<P>, b: GeoCamera<P>, options?: InterpolateGeoCameraOptions<P>): GeoCameraInterpolator<P>
```

地図のカメラ（`{ center, zoom }`）を、遠い場所へは一度ズームアウトしてから移動し、ズームインするように補間する関数を返します。d3 の `interpolateZoom` と同じ van Wijk と Nuij の方法を、Web メルカトルの座標とズームレベルに当てはめています。

- 経度は近い方向に移動し、返す経度は `a` の経度から連続した値にします
- `heading` は近い方向に回り、`tilt` は線形に補間します（どちらも `a` と `b` の両方にある場合だけ）
- 返す関数の `duration` に、移動量に見合った時間（ミリ秒）が入ります。近い移動は短く、遠い移動は長くなります
- `t` が 0 以下の場合は `a`、1 以上の場合は `b` と同じ値を、新しいオブジェクトで返します

```ts
const i = interpolateGeoCamera(
  { center: { lat: 35.68, lng: 139.77 }, zoom: 12 },
  { center: { lat: 40.71, lng: -74.0 }, zoom: 12 },
  { viewportWidth: map.getDiv().offsetWidth },
);
// i.duration ミリ秒かけて t を 0 から 1 に進める
map.moveCamera(i(t));
```

| オプション        | 型                                                                | 説明                                                                                                         |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `viewportWidth?`  | `number`                                                          | 地図の幅（px）。移動距離と画面の幅の比で、どれだけズームアウトするかが決まる。デフォルトは `1000`            |
| `curve?`          | `number`                                                          | 曲がり具合（d3 の `rho`、Mapbox の `flyTo` の `curve`）。大きいほど大きくズームアウトする。デフォルトは `√2` |
| `getCoordinates?` | `(point: P) => Coordinates`                                       | 中心の点から座標（`[lng, lat]`）を取り出す関数                                                               |
| `createPoint?`    | `(coordinates: Coordinates, context: CameraPointContext<P>) => P` | 座標から中心の点を作る関数。`context` には `a` の中心の点 `source` が入る                                    |

`viewportWidth` / `curve` が 0 以下や有限でない数の場合は、デフォルトの値を使います。

### `chainInterpolators`

```ts
chainInterpolators<I extends readonly (Interpolator<unknown> | null)[]>(interpolators: I, options?: ChainInterpolatorsOptions): Interpolator<ChainedValue<I>>
```

複数の interpolator を順番に再生する interpolator を返します。

- 0 〜 1 を `weights` の比で区間に分け、`t` が入っている区間の interpolator に、区間内に直した `t`（0 〜 1）を渡した値を返します。区間の境目ちょうどの `t` は後ろの区間に入れます
- `null` は待機の区間です。直前の interpolator の終わりの値（先頭の場合は次の interpolator の始まりの値）を返します
- 範囲外の `t` は、最初または最後の interpolator にそのまま延長した `t` を渡します。外挿するかどうかは、それぞれの interpolator のオプションで決まります

```ts
const i = chainInterpolators(
  [interpolateTyping('Hello', ''), null, interpolateTyping('', 'World')],
  { weights: [2, 1, 2] },
);
i(0.2); // 'He'
i(0.5); // ''（待機）
i(0.8); // 'Wo'
```

| オプション | 型                  | 説明                                                            |
| ---------- | ------------------- | --------------------------------------------------------------- |
| `weights?` | `readonly number[]` | 区間の長さの比。0 の区間は飛ばす。デフォルトは均等              |
| `ease?`    | `Easing`            | 区間内の `t` に適用するイージング関数。待機の区間には適用しない |

`weights` が足りない分や、負の数・有限でない数の重みは 1 にし、余った分は無視します。重みの合計が 0 の場合は均等に分けます。interpolator がない場合（空の配列や、全てが待機の区間の場合）は `RangeError` を投げます。

### `staggerInterpolators`

```ts
staggerInterpolators<I extends readonly Interpolator<unknown>[]>(interpolators: I, options?: StaggerInterpolatorsOptions): Interpolator<StaggeredValues<I>>
```

複数の interpolator を少しずつずらして同時に再生し、全ての値を配列で返す interpolator を返します。

- 各 interpolator には、それぞれの範囲内に直した `t` を 0 〜 1 に制限して渡します。始まる前は 0 の状態、終わった後は 1 の状態で止まります
- 行き過ぎるイージングを使う場合は `ease` で指定します。それぞれの interpolator のオプションで外挿できます
- 返す配列は毎回新しく作ります

```ts
const i = staggerInterpolators([drawRouteA, drawRouteB, drawRouteC]);
// 1つ分の長さは 0.5、開始は 0 / 0.25 / 0.5
const [a, b, c] = i(0.5); // drawRouteA(1), drawRouteB(0.5), drawRouteC(0)
```

| オプション | 型                                       | 説明                                                                                                        |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `stagger?` | `number`                                 | 次の開始までの間隔を、1つ分の長さに対する割合で表す。0 は同時、1 は重ならずに順番になる。デフォルトは `0.5` |
| `ranges?`  | `readonly (readonly [number, number])[]` | interpolator ごとの範囲 `[start, end]`。指定した場合は `stagger` より優先する                               |
| `ease?`    | `Easing`                                 | 区間内の `t` に適用するイージング関数                                                                       |

全体が 0 〜 1 に収まるように1つ分の長さを決めるので、`stagger` がどんな値でも範囲からはみ出しません。`ranges` が足りない分は `stagger` から求めた区間で補い、余った分は無視します。`stagger` が負の数・有限でない数の場合はデフォルトの値を使います。

### `reverseInterpolator`

```ts
reverseInterpolator<T>(interpolator: Interpolator<T>): Interpolator<T>
```

interpolator を逆向きに再生する interpolator（`t => interpolator(1 - t)`）を返します。

```ts
const i = reverseInterpolator(interpolateTyping('', 'Hello'));
i(0.4); // 'Hel'
```

### `repeatInterpolator`

```ts
repeatInterpolator<T>(interpolator: Interpolator<T>, count: number, options?: RepeatInterpolatorOptions): Interpolator<T>
```

interpolator を `count` 回繰り返す interpolator を返します。

- `count` は小数も指定できます（2.5 なら3回目の途中で終わります）。0 以下や有限でない数の場合は 1 回にします
- 回の境目ちょうどの `t` は、前の回の終わりにします
- 範囲外の `t` は、最初または最後の回にそのまま延長して渡します

```ts
const blink = repeatInterpolator(fade, 2, { direction: 'alternate' }); // 行って戻る
```

| オプション   | 型                | 説明                                                                                                                                                 |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction?` | `RepeatDirection` | 繰り返すときの向き。CSS の `animation-direction` と同じく、`'normal'` / `'reverse'` / `'alternate'` / `'alternate-reverse'`。デフォルトは `'normal'` |

### 型

| 型                                        | 説明                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `InterpolateTypingOptions`                | `interpolateTyping` のオプション                                                                  |
| `NumberFormatter`                         | 数値を文字列にする関数、または `Intl.NumberFormat`                                                |
| `Rounding`                                | 丸め方。`'round'` / `'floor'` / `'ceil'`                                                          |
| `InterpolateFormattedNumberOptions`       | `interpolateFormattedNumber` のオプション                                                         |
| `InterpolateDurationTextOptions`          | `interpolateDurationText` のオプション                                                            |
| `InterpolateScrambleOptions`              | `interpolateScramble` のオプション                                                                |
| `Coordinates`                             | 座標。平面は `[x, y]`、地図は `[lng, lat]`                                                        |
| `OriginKeyword`                           | 基準点のキーワード。CSS の `transform-origin` と同じ（`'center'`、`'top'`、`'bottom left'` など） |
| `ScaleAxis`                               | 拡大・縮小する軸。`'both'` / `'x'` / `'y'`                                                        |
| `PolylinePointContext<P>`                 | polyline 系の `createPoint` に渡す情報                                                            |
| `PolygonPointContext<P>`                  | polygon 系の `createPoint` に渡す情報                                                             |
| `InterpolatePolylineOptions<P>`           | `interpolatePolyline` のオプション                                                                |
| `InterpolateGeoPolylineOptions<P>`        | `interpolateGeoPolyline` のオプション                                                             |
| `InterpolatePositionOnRouteOptions<P>`    | `interpolatePositionOnRoute` のオプション                                                         |
| `RoutePosition<P>`                        | `interpolatePositionOnRoute` が返す値（`{ point, angle }`）                                       |
| `InterpolateGeoPositionOnRouteOptions<P>` | `interpolateGeoPositionOnRoute` のオプション                                                      |
| `GeoRoutePosition<P>`                     | `interpolateGeoPositionOnRoute` が返す値（`{ point, heading }`）                                  |
| `InterpolatePolylineMorphOptions<P>`      | `interpolatePolylineMorph` のオプション                                                           |
| `InterpolateGeoPolylineMorphOptions<P>`   | `interpolateGeoPolylineMorph` のオプション                                                        |
| `PolylineMorphPointContext<P>`            | モーフィングの `createPoint` に渡す情報                                                           |
| `CreateArcOptions<P>`                     | `createArc` のオプション                                                                          |
| `CreateGeoArcOptions<P>`                  | `createGeoArc` のオプション                                                                       |
| `InterpolatePolygonOptions<P>`            | `interpolatePolygon` のオプション                                                                 |
| `InterpolateGeoPolygonOptions<P>`         | `interpolateGeoPolygon` のオプション                                                              |
| `InterpolateMultiPolygonOptions<P>`       | `interpolateMultiPolygon` のオプション                                                            |
| `InterpolateGeoMultiPolygonOptions<P>`    | `interpolateGeoMultiPolygon` のオプション                                                         |
| `GeoCamera<P>`                            | 地図のカメラ（`{ center, zoom, heading?, tilt? }`）                                               |
| `CameraPointContext<P>`                   | `interpolateGeoCamera` の `createPoint` に渡す情報                                                |
| `InterpolateGeoCameraOptions<P>`          | `interpolateGeoCamera` のオプション                                                               |
| `GeoCameraInterpolator<P>`                | `interpolateGeoCamera` が返す関数（`duration` を持つ）                                            |
| `Interpolator<T>`                         | `t` に応じた値を返す関数 `(t: number) => T`                                                       |
| `Easing`                                  | イージング関数 `(t: number) => number`                                                            |
| `ChainInterpolatorsOptions`               | `chainInterpolators` のオプション                                                                 |
| `ChainedValue<I>`                         | `chainInterpolators` が返す値の型（各 interpolator の戻り値の union）                             |
| `StaggerInterpolatorsOptions`             | `staggerInterpolators` のオプション                                                               |
| `StaggeredValues<I>`                      | `staggerInterpolators` が返す値の型（各 interpolator の戻り値のタプル）                           |
| `RepeatDirection`                         | 繰り返すときの向き                                                                                |
| `RepeatInterpolatorOptions`               | `repeatInterpolator` のオプション                                                                 |

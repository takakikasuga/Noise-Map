import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'データについて',
  description:
    'ヒッコシノイズで使用しているデータソース、偏差値の算出方法、犯罪種別の定義、カバレッジについて説明します。',
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800"
    >
      {children}
    </a>
  );
}

export default function MethodologyPage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold tracking-tight">データについて</h1>
        <p className="mt-3 text-gray-600">
          ヒッコシノイズで使用しているデータの出典・算出方法・定義をまとめています。
        </p>
      </section>

      {/* 1. データソース */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">データソース</h2>
        <p className="text-sm text-gray-600">
          本サイトのデータは、すべて公的機関が公開するオープンデータに基づいています。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-semibold">レイヤー</th>
                <th className="py-2 pr-4 font-semibold">データソース</th>
                <th className="py-2 pr-4 font-semibold">提供元</th>
                <th className="py-2 font-semibold">更新頻度</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4 font-medium">治安（Safety）</td>
                <td className="py-3 pr-4">
                  <ExtLink href="https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html">
                    区市町村の町丁別、罪種別及び手口別認知件数
                  </ExtLink>
                </td>
                <td className="py-3 pr-4">警視庁</td>
                <td className="py-3">年次（月次累計あり）</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">駅マスタ</td>
                <td className="py-3 pr-4">
                  <ExtLink href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html">
                    鉄道データ（N02）
                  </ExtLink>
                </td>
                <td className="py-3 pr-4">国土数値情報（国土交通省）</td>
                <td className="py-3">年次</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">町丁目境界</td>
                <td className="py-3 pr-4">
                  <ExtLink href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html">
                    小地域境界データ（Shapefile）
                  </ExtLink>
                </td>
                <td className="py-3 pr-4">国土数値情報（国土交通省）</td>
                <td className="py-3">年次</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">人口統計</td>
                <td className="py-3 pr-4">
                  <ExtLink href="https://www.e-stat.go.jp/api/">
                    国勢調査データ（API経由）
                  </ExtLink>
                </td>
                <td className="py-3 pr-4">e-Stat（総務省統計局）</td>
                <td className="py-3">5年ごと</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">施設情報</td>
                <td className="py-3 pr-4">
                  <ExtLink href="https://wiki.openstreetmap.org/wiki/Overpass_API">
                    Overpass API
                  </ExtLink>
                  （駅半径1km内の飲食店・コンビニ・公園・学校・病院）
                </td>
                <td className="py-3 pr-4">OpenStreetMap</td>
                <td className="py-3">リアルタイム</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 偏差値の定義 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">偏差値（治安スコア）の算出方法</h2>

        <div className="rounded-md bg-gray-50 p-4 font-mono text-sm">
          偏差値 = 50 + 10 &times; (x &minus; &mu;) / &sigma;
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <span className="font-semibold">x</span> = 対象の反転犯罪件数（max &minus; 実犯罪件数）
          </div>
          <div>
            <span className="font-semibold">&mu;</span> = 全データの平均値
          </div>
          <div>
            <span className="font-semibold">&sigma;</span> = 全データの標準偏差
          </div>
        </div>

        <h3 className="text-base font-semibold mt-4">計算の流れ</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            警視庁CSVから犯罪認知件数（刑法犯合計）を取得
          </li>
          <li>
            <strong>反転処理</strong>: 犯罪が少ないほど高得点になるよう、全データの最大値から各値を引く
            <div className="mt-1 rounded bg-gray-50 px-3 py-1.5 font-mono text-xs">
              反転値 = max(全犯罪件数) &minus; 対象の犯罪件数
            </div>
          </li>
          <li>
            反転値に対して偏差値の公式を適用（平均50、標準偏差10の分布に変換）
          </li>
          <li>
            結果を 0〜100 の範囲にクリップ
          </li>
          <li>
            偏差値の降順でランキングを付与（1位 = 最も安全）
          </li>
        </ol>

        <h3 className="text-base font-semibold mt-4">駅スコアとエリアスコアの違い</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-semibold">種別</th>
                <th className="py-2 pr-4 font-semibold">集計単位</th>
                <th className="py-2 font-semibold">説明</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4 font-medium">駅スコア</td>
                <td className="py-3 pr-4">市区町村</td>
                <td className="py-3">駅が属する市区町村全体の犯罪件数合計を使用。約659駅を対象に偏差値化。</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">エリアスコア</td>
                <td className="py-3 pr-4">町丁目</td>
                <td className="py-3">警視庁CSVの町丁目レベルの犯罪件数をそのまま使用。約5,250エリアを対象に偏差値化。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
          偏差値は年度ごとに全データで再計算される<strong>相対評価</strong>です。ある年に犯罪件数が全体的に増減した場合、個別のスコアも変動します。
        </div>
      </section>

      {/* 3. 犯罪種別の定義 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">犯罪種別の定義</h2>
        <p className="text-sm text-gray-600">
          <ExtLink href="https://www.npa.go.jp/hakusyo/h23/honbun/html/0-2_hanrei.html">
            警察庁の「包括罪種」分類
          </ExtLink>
          に準拠しています。被害法益と犯罪形態に基づき、刑法犯を以下の6カテゴリに分類しています。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-semibold">種別</th>
                <th className="py-2 font-semibold">内訳</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4 font-medium">凶悪犯</td>
                <td className="py-3">殺人・強盗・放火・強制性交等</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">粗暴犯</td>
                <td className="py-3">凶器準備集合・暴行・傷害・脅迫・恐喝</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">窃盗犯</td>
                <td className="py-3">空き巣・ひったくり・万引き・自転車盗・車上ねらい等（侵入盗＋非侵入盗）</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">知能犯</td>
                <td className="py-3">詐欺・横領・偽造・汚職・背任等</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">風俗犯</td>
                <td className="py-3">賭博・わいせつ</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">その他の刑法犯</td>
                <td className="py-3">器物損壊・占有離脱物横領等、上記に含まれない犯罪</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          ※ 本サイトでは「風俗犯」と「その他の刑法犯」を合算して「その他」として表示しています。
        </p>
      </section>

      {/* 4. カラースケール */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">カラースケール</h2>
        <p className="text-sm text-gray-600">
          地図やバッジの色は、偏差値を HSL カラーに線形変換して表示しています。
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-red-700">0（危険）</span>
          <div className="h-6 flex-1 rounded-md" style={{ background: 'linear-gradient(to right, hsl(0,70%,45%), hsl(60,70%,45%), hsl(120,70%,45%))' }} />
          <span className="text-sm font-medium text-green-700">55（安全）</span>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p>偏差値 0 → 赤（hsl(0, 70%, 45%)）</p>
          <p>偏差値 27.5 → 黄（hsl(60, 70%, 45%)）</p>
          <p>偏差値 55 → 緑（hsl(120, 70%, 45%)）</p>
        </div>
      </section>

      {/* 5. カバレッジ・制限事項 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">カバレッジと制限事項</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">&#10003;</span>
            東京都全域を対象: 約659駅 + 約5,250エリア
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">&#10003;</span>
            23区は町丁目（丁目）レベルの犯罪データを使用
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">&#10003;</span>
            対応年度: 2023年（令和5年）・2024年（令和6年）・2025年（令和7年）
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">&#9888;</span>
            多摩地域は市町村レベルの集計（町丁目データが公開されていないため）
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">&#9888;</span>
            駅スコアは「駅が属する市区町村全体」の犯罪データに基づきます（駅の直近エリアに限定されません）
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">&#9888;</span>
            「認知件数」は警察に届け出された件数です。実際の発生件数とは異なる場合があります
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400 font-bold">&#9675;</span>
            災害リスク（Hazard）データは今後追加予定
          </li>
        </ul>
      </section>

      {/* 6. 更新履歴 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">更新履歴</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="shrink-0 text-gray-400">2025年2月</span>
            <span>サイト公開。治安（Safety）・雰囲気（Vibe）レイヤー対応。659駅 + 5,250エリアの偏差値を掲載。</span>
          </li>
        </ul>
      </section>

      <div className="text-center py-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}

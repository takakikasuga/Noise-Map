import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '利用規約',
  description:
    'ヒッコシマップの利用規約です。本サービスのご利用にあたっての条件をご確認ください。',
  alternates: {
    canonical: '/about/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold tracking-tight">利用規約</h1>
        <p className="mt-3 text-gray-600">
          最終更新日: 2025年2月1日
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第1条（適用）</h2>
        <p className="text-sm text-gray-700">
          本規約は、ヒッコシマップ（以下「本サービス」といいます）の利用に関する条件を定めるものです。利用者は本規約に同意のうえ、本サービスを利用するものとします。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第2条（サービスの内容）</h2>
        <p className="text-sm text-gray-700">
          本サービスは、東京都内の駅周辺における治安・災害リスク・街の雰囲気などの住環境情報を、公的機関が公開するオープンデータに基づき提供する情報サービスです。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第3条（免責事項）</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            本サービスが提供する情報は、公的機関のオープンデータを統計処理したものであり、情報の正確性・完全性・最新性を保証するものではありません。
          </p>
          <p>
            本サービスの情報に基づく判断や行動によって生じたいかなる損害についても、運営者は一切の責任を負いません。引越し先の決定にあたっては、実際に現地を確認するなど、ご自身で十分に調査されることを推奨します。
          </p>
          <p>
            偏差値・ランキングは統計的な相対評価であり、絶対的な安全性や危険性を示すものではありません。
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第4条（データの出典）</h2>
        <p className="text-sm text-gray-700">
          本サービスで使用するデータの出典については、
          <Link href="/about/methodology" className="text-blue-600 underline hover:text-blue-800">
            データについて
          </Link>
          ページをご参照ください。各データの著作権・利用条件は、それぞれの提供元の規約に準じます。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第5条（禁止事項）</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>本サービスの情報を不正確に引用し、特定の地域や住民を誹謗中傷する行為</li>
          <li>本サービスへの不正アクセスまたはサーバーに過度な負荷をかける行為</li>
          <li>本サービスの情報を商業目的で無断転載・再配布する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第6条（サービスの変更・停止）</h2>
        <p className="text-sm text-gray-700">
          運営者は、事前の通知なくサービスの内容変更・一時停止・終了を行うことがあります。これにより利用者に生じた損害について、運営者は一切の責任を負いません。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第7条（規約の変更）</h2>
        <p className="text-sm text-gray-700">
          運営者は、必要に応じて本規約を変更することがあります。変更後の規約は、本ページに掲載した時点から効力を生じるものとします。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第8条（準拠法・管轄）</h2>
        <p className="text-sm text-gray-700">
          本規約は日本法に準拠し、本サービスに関する紛争については東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>

      <div className="text-center py-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; トップに戻る
        </Link>
      </div>
    </div>
  );
}

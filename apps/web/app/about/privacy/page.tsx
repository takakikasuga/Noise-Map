import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description:
    'ヒッコシマップのプライバシーポリシーです。個人情報の取り扱いについてご確認ください。',
  alternates: {
    canonical: '/about/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold tracking-tight">プライバシーポリシー</h1>
        <p className="mt-3 text-gray-600">
          最終更新日: 2025年2月1日
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">はじめに</h2>
        <p className="text-sm text-gray-700">
          ヒッコシマップ（以下「本サービス」といいます）は、利用者のプライバシーを尊重し、個人情報の保護に努めます。本ポリシーでは、本サービスにおける情報の取り扱いについて説明します。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">収集する情報</h2>
        <p className="text-sm text-gray-700">
          本サービスでは、現在アカウント登録機能を提供しておらず、氏名・メールアドレス等の個人情報を直接収集していません。ただし、以下の情報を自動的に取得する場合があります。
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>アクセスログ（IPアドレス、ブラウザ種類、参照元URL、アクセス日時）</li>
          <li>Cookie およびローカルストレージに保存される設定情報</li>
          <li>ページ閲覧履歴やクリック操作などの利用状況データ</li>
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">アクセス解析ツール</h2>
        <p className="text-sm text-gray-700">
          本サービスでは、サービス改善のために以下のアクセス解析ツールを使用しています。
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>
            <strong>Vercel Analytics</strong>: ページの閲覧状況を匿名で集計します。個人を特定する情報は収集しません。
          </li>
          <li>
            <strong>Vercel Speed Insights</strong>: ページの表示速度を計測し、パフォーマンス改善に活用します。
          </li>
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">情報の利用目的</h2>
        <p className="text-sm text-gray-700">
          取得した情報は、以下の目的で利用します。
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>本サービスの提供・運営・改善</li>
          <li>利用状況の統計的な分析</li>
          <li>不正アクセスの検知・防止</li>
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">第三者への提供</h2>
        <p className="text-sm text-gray-700">
          取得した情報は、法令に基づく場合を除き、利用者の同意なく第三者に提供することはありません。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">Cookie の使用</h2>
        <p className="text-sm text-gray-700">
          本サービスでは、利用者の設定保存やアクセス解析のために Cookie を使用する場合があります。ブラウザの設定により Cookie を無効にすることができますが、一部の機能が正常に動作しない可能性があります。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">セキュリティ</h2>
        <p className="text-sm text-gray-700">
          本サービスでは、情報の漏洩・滅失・毀損の防止のために、適切なセキュリティ対策を実施しています。ただし、インターネット上の通信において完全なセキュリティを保証するものではありません。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">ポリシーの変更</h2>
        <p className="text-sm text-gray-700">
          本ポリシーは、必要に応じて変更することがあります。変更後のポリシーは、本ページに掲載した時点から効力を生じるものとします。
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">お問い合わせ</h2>
        <p className="text-sm text-gray-700">
          本ポリシーに関するお問い合わせは、本サービスのお問い合わせ機能よりご連絡ください。
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

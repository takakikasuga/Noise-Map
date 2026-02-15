/**
 * ヘッダーコンポーネント
 * ロゴ + ナビゲーション
 */
export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="/" className="text-xl font-bold">
          ヒッコシマップ
        </a>
        <nav className="flex gap-4 text-sm">
          <a href="/" className="hover:text-blue-600">トップ</a>
          <a href="/compare" className="hover:text-blue-600">比較</a>
        </nav>
      </div>
    </header>
  );
}

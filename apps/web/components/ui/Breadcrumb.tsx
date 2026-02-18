import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">&gt;</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

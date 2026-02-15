import Link from 'next/link';

interface NearbyStation {
  name: string;
  nameEn: string;
  municipalityName: string;
}

interface NearbyStationsSectionProps {
  stations: NearbyStation[];
}

export function NearbyStationsSection({ stations }: NearbyStationsSectionProps) {
  if (stations.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">近くの駅</h2>
      <p className="mt-1 mb-4 text-sm text-gray-500">このエリアから近い駅（治安・災害・雰囲気の詳細データはこちら）</p>
      <div className="flex flex-wrap gap-2">
        {stations.map((station) => (
          <Link
            key={station.nameEn}
            href={`/station/${station.nameEn}`}
            className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            {station.name}駅
          </Link>
        ))}
      </div>
    </div>
  );
}

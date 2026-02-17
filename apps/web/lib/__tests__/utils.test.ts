import { describe, it, expect } from 'vitest';

/**
 * snakeToCamel / snakeToCamelArray are private helpers in db.ts.
 * We replicate the exact same logic here to unit-test the algorithm
 * independently from the DB layer.
 */
function snakeToCamel<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function snakeToCamelArray<T extends Record<string, unknown>>(
  arr: T[],
): Record<string, unknown>[] {
  return arr.map(snakeToCamel);
}

// ---------------------------------------------------------------------------
// snakeToCamel
// ---------------------------------------------------------------------------
describe('snakeToCamel', () => {
  it('converts a single snake_case key', () => {
    expect(snakeToCamel({ created_at: '2024-01-01' })).toEqual({
      createdAt: '2024-01-01',
    });
  });

  it('converts multiple snake_case keys', () => {
    const input = { station_id: '1', total_crimes: 42, area_name: 'shinjuku' };
    expect(snakeToCamel(input)).toEqual({
      stationId: '1',
      totalCrimes: 42,
      areaName: 'shinjuku',
    });
  });

  it('leaves camelCase keys unchanged', () => {
    expect(snakeToCamel({ alreadyCamel: true })).toEqual({
      alreadyCamel: true,
    });
  });

  it('leaves single-word keys unchanged', () => {
    expect(snakeToCamel({ name: 'Tokyo' })).toEqual({ name: 'Tokyo' });
  });

  it('handles keys with multiple underscores', () => {
    expect(snakeToCamel({ crimes_violent_count: 5 })).toEqual({
      crimesViolentCount: 5,
    });
  });

  it('preserves value types (number, boolean, null)', () => {
    const input = { is_active: true, score: 85, rank: null };
    const result = snakeToCamel(input);
    expect(result.isActive).toBe(true);
    expect(result.score).toBe(85);
    expect(result.rank).toBeNull();
  });

  it('returns an empty object for empty input', () => {
    expect(snakeToCamel({})).toEqual({});
  });

  it('does not deeply convert nested objects', () => {
    const input = { outer_key: { inner_key: 'value' } };
    const result = snakeToCamel(input);
    expect(result).toEqual({ outerKey: { inner_key: 'value' } });
  });

  it('preserves array values without converting their contents', () => {
    const input = { line_names: ['JR', 'Metro'] };
    const result = snakeToCamel(input);
    expect(result.lineNames).toEqual(['JR', 'Metro']);
  });

  it('handles undefined values', () => {
    const input = { some_key: undefined };
    const result = snakeToCamel(input);
    expect(result.someKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// snakeToCamelArray
// ---------------------------------------------------------------------------
describe('snakeToCamelArray', () => {
  it('converts an array of objects', () => {
    const input = [
      { station_id: '1', name: 'A' },
      { station_id: '2', name: 'B' },
    ];
    expect(snakeToCamelArray(input)).toEqual([
      { stationId: '1', name: 'A' },
      { stationId: '2', name: 'B' },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(snakeToCamelArray([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(snakeToCamelArray([{ area_name: 'test' }])).toEqual([
      { areaName: 'test' },
    ]);
  });

  it('preserves heterogeneous value types across elements', () => {
    const input = [
      { total_crimes: 0, is_safe: true },
      { total_crimes: 100, is_safe: false },
    ];
    const result = snakeToCamelArray(input);
    expect(result[0]).toEqual({ totalCrimes: 0, isSafe: true });
    expect(result[1]).toEqual({ totalCrimes: 100, isSafe: false });
  });

  it('does not mutate the original array', () => {
    const original = [{ my_key: 1 }];
    const copy = [...original];
    snakeToCamelArray(original);
    expect(original).toEqual(copy);
  });
});

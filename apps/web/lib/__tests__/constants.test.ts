import { describe, it, expect } from 'vitest';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_COMPARE_AREAS,
  SCORE_MAX,
} from '../constants';

describe('constants', () => {
  // SCORE_MAX
  it('SCORE_MAX is 100', () => {
    expect(SCORE_MAX).toBe(100);
  });

  it('SCORE_MAX is a positive integer', () => {
    expect(Number.isInteger(SCORE_MAX)).toBe(true);
    expect(SCORE_MAX).toBeGreaterThan(0);
  });

  // DEFAULT_MAP_CENTER
  it('DEFAULT_MAP_CENTER has lat and lng properties', () => {
    expect(DEFAULT_MAP_CENTER).toHaveProperty('lat');
    expect(DEFAULT_MAP_CENTER).toHaveProperty('lng');
  });

  it('DEFAULT_MAP_CENTER lat is within Tokyo latitude range (35.5-35.9)', () => {
    expect(DEFAULT_MAP_CENTER.lat).toBeGreaterThanOrEqual(35.5);
    expect(DEFAULT_MAP_CENTER.lat).toBeLessThanOrEqual(35.9);
  });

  it('DEFAULT_MAP_CENTER lng is within Tokyo longitude range (139.5-140.0)', () => {
    expect(DEFAULT_MAP_CENTER.lng).toBeGreaterThanOrEqual(139.5);
    expect(DEFAULT_MAP_CENTER.lng).toBeLessThanOrEqual(140.0);
  });

  // MAX_COMPARE_AREAS
  it('MAX_COMPARE_AREAS is a positive integer', () => {
    expect(Number.isInteger(MAX_COMPARE_AREAS)).toBe(true);
    expect(MAX_COMPARE_AREAS).toBeGreaterThan(0);
  });

  it('MAX_COMPARE_AREAS is at least 2 (comparison needs 2+ items)', () => {
    expect(MAX_COMPARE_AREAS).toBeGreaterThanOrEqual(2);
  });

  // DEFAULT_MAP_ZOOM
  it('DEFAULT_MAP_ZOOM is a positive number', () => {
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThan(0);
  });

  it('DEFAULT_MAP_ZOOM is a reasonable Leaflet zoom level (1-18)', () => {
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_MAP_ZOOM).toBeLessThanOrEqual(18);
  });

  // SITE_NAME
  it('SITE_NAME is a non-empty string', () => {
    expect(typeof SITE_NAME).toBe('string');
    expect(SITE_NAME.length).toBeGreaterThan(0);
  });

  // SITE_DESCRIPTION
  it('SITE_DESCRIPTION is a non-empty string', () => {
    expect(typeof SITE_DESCRIPTION).toBe('string');
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });
});

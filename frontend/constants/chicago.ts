export const CHICAGO_CENTER = {
  latitude: 41.8781,
  longitude: -87.6298,
};

export const CHICAGO_BOUNDS = {
  north: 42.023,
  south: 41.644,
  east: -87.524,
  west: -87.94,
};

export const CHICAGO_NEIGHBORHOODS = [
  "Loop",
  "River North",
  "Lincoln Park",
  "Wicker Park",
  "Hyde Park",
  "Gold Coast",
  "West Loop",
  "South Loop",
] as const;

export type ChicagoNeighborhood = (typeof CHICAGO_NEIGHBORHOODS)[number];

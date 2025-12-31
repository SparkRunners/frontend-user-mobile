import type { Zone } from './types';

// Mock polygons roughly matching central Stockholm areas.
export const mockZones: Zone[] = [
  {
    id: 'allowed-city-center',
    kind: 'allowed',
    name: 'Tillåten zon - City',
    description: 'Huvudområde där sparkcyklar får köras.',
    coordinates: [
      { latitude: 59.353, longitude: 18.033 },
      { latitude: 59.354, longitude: 18.088 },
      { latitude: 59.323, longitude: 18.108 },
      { latitude: 59.312, longitude: 18.078 },
      { latitude: 59.318, longitude: 18.030 },
    ],
  },
  {
    id: 'parking-vasastan',
    kind: 'parking',
    name: 'Parkeringszon Vasastan',
    description: 'Rekommenderad parkering nära Odenplan.',
    coordinates: [
      { latitude: 59.345, longitude: 18.046 },
      { latitude: 59.345, longitude: 18.059 },
      { latitude: 59.338, longitude: 18.059 },
      { latitude: 59.338, longitude: 18.046 },
    ],
  },
  {
    id: 'parking-sodermalm',
    kind: 'parking',
    name: 'Parkeringszon Södermalm',
    description: 'Parkera tryggt vid Mariatorget.',
    coordinates: [
      { latitude: 59.317, longitude: 18.055 },
      { latitude: 59.317, longitude: 18.073 },
      { latitude: 59.309, longitude: 18.073 },
      { latitude: 59.309, longitude: 18.055 },
    ],
  },
];

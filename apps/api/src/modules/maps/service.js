import crypto from 'crypto';

// In-memory seed data for dev/pilot when Postgres isn't running
const SEED_PLACES = [
  {
    id: 'place-1',
    title: 'Tower Bridge',
    description: 'Victorian engine-powered suspension bridge across the River Thames.',
    category: 'landmark',
    lat: 51.5055,
    lng: -0.0754
  },
  {
    id: 'place-2',
    title: 'Big Ben & Westminster',
    description: 'Iconic Elizabeth Tower and the Houses of Parliament.',
    category: 'landmark',
    lat: 51.5007,
    lng: -0.1246
  },
  {
    id: 'place-3',
    title: 'Edinburgh Castle',
    description: 'Historic fortress dominating the skyline of the city of Edinburgh.',
    category: 'historic',
    lat: 55.9486,
    lng: -3.1999
  },
  {
    id: 'place-4',
    title: 'Stonehenge',
    description: 'Prehistoric megalithic monument on Salisbury Plain.',
    category: 'historic',
    lat: 51.1789,
    lng: -1.8262
  },
  {
    id: 'place-5',
    title: 'Roman Baths',
    description: 'Ancient Roman public bathing site in the city of Bath.',
    category: 'historic',
    lat: 51.3810,
    lng: -2.3596
  },
  {
    id: 'place-6',
    title: "Giant's Causeway",
    description: 'Area of about 40,000 interlocking basalt columns in Northern Ireland.',
    category: 'nature',
    lat: 55.2408,
    lng: -6.5116
  },
  {
    id: 'place-7',
    title: 'Windermere',
    description: 'The largest natural lake in England, located in the Lake District National Park.',
    category: 'nature',
    lat: 54.3820,
    lng: -2.9090
  },
  {
    id: 'place-8',
    title: 'Eryri (Snowdonia)',
    description: 'Dramatic mountainous national park in North Wales.',
    category: 'nature',
    lat: 53.0685,
    lng: -4.0763
  },
  {
    id: 'place-9',
    title: 'York Minster',
    description: 'One of the largest cathedrals of its kind in Northern Europe.',
    category: 'historic',
    lat: 53.9623,
    lng: -1.0819
  },
  {
    id: 'place-10',
    title: 'St Ives Bay',
    description: 'Stunning coastal resort town and surf haven in Cornwall.',
    category: 'nature',
    lat: 50.2110,
    lng: -5.4800
  }
];

class MapsService {
  constructor() {
    this.places = new Map(SEED_PLACES.map(p => [p.id, { ...p, createdAt: new Date().toISOString() }]));
  }

  // Viewport / Bounding-box query
  async getMarkersInBounds({ minLng, minLat, maxLng, maxLat }) {
    // If no bounds provided, return all seed places
    if (minLng === undefined || minLat === undefined || maxLng === undefined || maxLat === undefined) {
      return Array.from(this.places.values());
    }

    const minX = parseFloat(minLng);
    const minY = parseFloat(minLat);
    const maxX = parseFloat(maxLng);
    const maxY = parseFloat(maxLat);

    return Array.from(this.places.values()).filter(place => {
      return place.lng >= minX && place.lng <= maxX && place.lat >= minY && place.lat <= maxY;
    });
  }

  async getPlaceById(id) {
    return this.places.get(id) || null;
  }

  async createPlace({ title, description, category = 'landmark', lat, lng }) {
    const id = crypto.randomUUID();
    const place = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      category,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      createdAt: new Date().toISOString()
    };
    this.places.set(id, place);
    return place;
  }
}

export const mapsService = new MapsService();


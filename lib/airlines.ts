export type Airline = {
  code: string;
  name: string;
  logo: string;
  color: string;
  buildSearchUrl: (p: SearchParams) => string;
};

export type SearchParams = {
  origin: string;
  destination: string;
  depart: string;
  return?: string;
  passengers: number;
  cabin?: 'economy' | 'business' | 'first';
};

const fmt = (d: string) => d.replace(/-/g, '');

export const AIRLINES: Airline[] = [
  {
    code: 'LY',
    name: 'El Al',
    logo: '🇮🇱',
    color: '#0033a0',
    buildSearchUrl: (p) => {
      const base = 'https://www.elal.com/en/PassengersPages/Pages/Search.aspx';
      const params = new URLSearchParams({
        from: p.origin,
        to: p.destination,
        depart: p.depart,
        ...(p.return ? { return: p.return } : {}),
        adults: String(p.passengers),
        cabin: p.cabin || 'economy'
      });
      return `${base}?${params.toString()}`;
    }
  },
  {
    code: 'IZ',
    name: 'Arkia',
    logo: '✈️',
    color: '#e30613',
    buildSearchUrl: (p) =>
      `https://www.arkia.com/en/?origin=${p.origin}&destination=${p.destination}&departure=${p.depart}${p.return ? `&return=${p.return}` : ''}&adults=${p.passengers}`
  },
  {
    code: '6H',
    name: 'Israir',
    logo: '✈️',
    color: '#003d7d',
    buildSearchUrl: (p) =>
      `https://www.israir.co.il/en/?from=${p.origin}&to=${p.destination}&depart=${p.depart}${p.return ? `&return=${p.return}` : ''}&pax=${p.passengers}`
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    logo: '🇩🇪',
    color: '#05164d',
    buildSearchUrl: (p) =>
      `https://www.lufthansa.com/de/en/flight-search?travelers=${p.passengers}&itinerary=${p.origin}-${p.destination}-${fmt(p.depart)}${p.return ? `,${p.destination}-${p.origin}-${fmt(p.return)}` : ''}&cabinClass=Economy`
  },
  {
    code: 'BA',
    name: 'British Airways',
    logo: '🇬🇧',
    color: '#075aaa',
    buildSearchUrl: (p) =>
      `https://www.britishairways.com/travel/fx/public/en_gb?eId=106001&from=${p.origin}&to=${p.destination}&departing=${p.depart}${p.return ? `&returning=${p.return}` : ''}&adults=${p.passengers}`
  },
  {
    code: 'TK',
    name: 'Turkish Airlines',
    logo: '🇹🇷',
    color: '#c70a0c',
    buildSearchUrl: (p) =>
      `https://www.turkishairlines.com/en-int/flights/booking/?TripType=${p.return ? 'R' : 'O'}&Adult=${p.passengers}&Cabin=ECONOMY&FlightSegments=${p.origin}_${p.destination}_${p.depart}${p.return ? `_${p.destination}_${p.origin}_${p.return}` : ''}`
  },
  {
    code: 'AF',
    name: 'Air France',
    logo: '🇫🇷',
    color: '#002157',
    buildSearchUrl: (p) =>
      `https://wwws.airfrance.us/search/offers?bookingFlow=LEISURE&pax=${p.passengers}A&cabinClass=ECONOMY&trip=${p.return ? 'RT' : 'OW'}&from1=${p.origin}&to1=${p.destination}&departureDate1=${p.depart}${p.return ? `&from2=${p.destination}&to2=${p.origin}&departureDate2=${p.return}` : ''}`
  },
  {
    code: 'DL',
    name: 'Delta',
    logo: '🇺🇸',
    color: '#003366',
    buildSearchUrl: (p) =>
      `https://www.delta.com/flight-search/book-a-flight?cacheKeySuffix=&searchType=${p.return ? 'recentSearch' : 'OneWay'}&originCity=${p.origin}&destinationCity=${p.destination}&departureDate=${p.depart}${p.return ? `&returnDate=${p.return}` : ''}&paxCount=${p.passengers}`
  }
];

export const META_SEARCH = (p: SearchParams) => ({
  google: `https://www.google.com/travel/flights?q=Flights%20from%20${p.origin}%20to%20${p.destination}%20on%20${p.depart}${p.return ? `%20returning%20${p.return}` : ''}`,
  skyscanner: `https://www.skyscanner.com/transport/flights/${p.origin}/${p.destination}/${p.depart.replace(/-/g, '').slice(2)}${p.return ? `/${p.return.replace(/-/g, '').slice(2)}` : ''}/?adultsv2=${p.passengers}`,
  kayak: `https://www.kayak.com/flights/${p.origin}-${p.destination}/${p.depart}${p.return ? `/${p.return}` : ''}/${p.passengers}adults`
});

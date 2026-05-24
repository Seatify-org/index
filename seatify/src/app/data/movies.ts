export interface Movie {
  id: string;
  title: string;
  rating: number;
  genre: string[];
  duration: number;
  releaseDate: string;
  description: string;
  posterUrl: string;
  bannerUrl: string;
  trailerUrl: string;
  cast: string[];
  director: string;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  distance?: number; // in km
  latitude: number;
  longitude: number;
  facilities: string[];
  totalHalls: number;
  imageUrl: string;
  integrationLevel: 1 | 2 | 3; // 1: Full seat selection, 2: General admission, 3: Phone booking only
  phoneNumber?: string; // Required for level 3
  photos?: {
    hall?: string; // Interior hall photo showing seats and screen
    screen?: string; // Close-up of screen
    facade?: string; // Building entrance/facade
  };
  infrastructureTags?: string[]; // Payment methods, amenities, special requirements
  cinemaRatings?: {
    sound: number; // 1-5 rating
    comfort: number; // 1-5 rating
    cleanliness: number; // 1-5 rating
    temperature: number; // 1-5 rating
  };
}

export interface Session {
  id: string;
  movieId: string;
  cinemaId: string;
  time: string;
  date: string;
  hallId: string;
  hallName: string;
  price: number;
  integrationLevel?: 1 | 2 | 3; // Override cinema level if needed
  availableSeats?: number; // For general admission (level 2)
}

export interface Seat {
  row: string;
  number: number;
  type: 'regular' | 'vip';
  isOccupied: boolean;
}

export interface Booking {
  id: string;
  movieId: string;
  sessionId: string;
  cinemaId: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
  status: 'active' | 'completed' | 'cancelled';
}

export const cinemas: Cinema[] = [
  // MOSCOW - 15 cinemas
  {
    id: 'c1',
    name: 'KARO 11 Oktyabr',
    address: 'Novy Arbat St, 24, Moscow',
    city: 'Москва',
    rating: 4.8,
    distance: 1.2,
    latitude: 55.7522,
    longitude: 37.5889,
    facilities: ['IMAX', 'Dolby Atmos', 'Recliner Seats', 'Parking'],
    totalHalls: 11,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
    photos: {
      hall: 'https://images.unsplash.com/photo-1710131459450-7c384b8be18f?w=800&h=500&fit=crop',
      screen: 'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?w=800&h=500&fit=crop',
      facade: 'https://images.unsplash.com/photo-1762417422262-27a8a4aa5e5b?w=800&h=500&fit=crop',
    },
    infrastructureTags: ['Card Terminal', 'Apple Pay', 'Popcorn & Snacks', 'Free Wi-Fi', 'Heated Hall'],
    cinemaRatings: {
      sound: 5,
      comfort: 5,
      cleanliness: 5,
      temperature: 4,
    },
  },
  {
    id: 'c2',
    name: 'Formula Kino Europe',
    address: 'Ploshchad Kievskogo Vokzala, 2, Moscow',
    city: 'Москва',
    rating: 4.7,
    distance: 2.5,
    latitude: 55.7434,
    longitude: 37.5666,
    facilities: ['4DX', 'IMAX', 'VIP Lounge', 'Restaurant'],
    totalHalls: 14,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c3',
    name: 'Cinema Park Metropolis',
    address: 'Leningradskoe Shosse, 16A, str. 4, Moscow',
    city: 'Москва',
    rating: 4.6,
    distance: 8.3,
    latitude: 55.8081,
    longitude: 37.5102,
    facilities: ['3D', 'Premium Seats', 'Food Court', 'Kids Play Area'],
    totalHalls: 16,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c4',
    name: 'Pioneer Cinema',
    address: 'Kutuzovsky Prospekt, 21, Moscow',
    city: 'Москва',
    rating: 4.9,
    distance: 3.1,
    latitude: 55.7453,
    longitude: 37.5644,
    facilities: ['IMAX', '4DX', 'Dolby Atmos', 'VIP Lounge', 'Bar'],
    totalHalls: 12,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c5',
    name: '5 Zvezd Novokuznetskaya',
    address: 'Novokuznetskaya St, 23/9, Moscow',
    city: 'Москва',
    rating: 4.5,
    distance: 2.8,
    latitude: 55.7423,
    longitude: 37.6289,
    facilities: ['Premium Seats', 'Bar', 'Cafe'],
    totalHalls: 5,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c6',
    name: 'Illusion',
    address: 'Kotelnicheskaya Naberezhnaya, 1/15, Moscow',
    city: 'Москва',
    rating: 4.4,
    distance: 3.5,
    latitude: 55.7467,
    longitude: 37.6397,
    facilities: ['Art House', 'Classic Films', 'Cafe'],
    totalHalls: 3,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 2,
    photos: {
      hall: 'https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?w=800&h=500&fit=crop',
      screen: 'https://images.unsplash.com/photo-1760170437237-a3654545ab4c?w=800&h=500&fit=crop',
      facade: 'https://images.unsplash.com/photo-1770462957453-b5249c869519?w=800&h=500&fit=crop',
    },
    infrastructureTags: ['Cash Only', 'Card Terminal', 'Limited Snacks', 'No Parking', 'Can Be Cold'],
    cinemaRatings: {
      sound: 4,
      comfort: 3,
      cleanliness: 4,
      temperature: 2,
    },
  },
  {
    id: 'c7',
    name: 'Khudozhestvenny',
    address: 'Arbatskaya Square, 14, Moscow',
    city: 'Москва',
    rating: 4.7,
    distance: 1.8,
    latitude: 55.7519,
    longitude: 37.5893,
    facilities: ['Art House', 'Independent Films', 'Wine Bar'],
    totalHalls: 2,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c8',
    name: 'KARO 13 Kuntsevo',
    address: 'Yartsevskaya St, 19, Moscow',
    city: 'Москва',
    rating: 4.6,
    distance: 10.2,
    latitude: 55.7301,
    longitude: 37.4086,
    facilities: ['IMAX', 'Dolby Atmos', 'Recliner Seats', 'Parking'],
    totalHalls: 13,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c9',
    name: 'Mori Cinema',
    address: 'Prospekt Mira, 211, Moscow',
    city: 'Москва',
    rating: 4.5,
    distance: 7.4,
    latitude: 55.8357,
    longitude: 37.6288,
    facilities: ['Premium Seats', 'Food Court', 'Parking'],
    totalHalls: 8,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c10',
    name: 'Vremena Goda',
    address: 'Kutuzovsky Prospekt, 48, Moscow',
    city: 'Москва',
    rating: 4.7,
    distance: 5.5,
    latitude: 55.7357,
    longitude: 37.5292,
    facilities: ['VIP Lounge', 'Restaurant', 'Premium Seats'],
    totalHalls: 7,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c11',
    name: 'Dom Kino',
    address: 'Vasilyevskaya St, 13, Moscow',
    city: 'Москва',
    rating: 4.8,
    distance: 2.1,
    latitude: 55.7656,
    longitude: 37.6045,
    facilities: ['Art House', 'Classic Films', 'Museum', 'Cafe'],
    totalHalls: 4,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c12',
    name: 'Cinema Park CSKA',
    address: 'Leningradsky Prospekt, 39, str. 1, Moscow',
    city: 'Москва',
    rating: 4.6,
    distance: 6.8,
    latitude: 55.7968,
    longitude: 37.5299,
    facilities: ['IMAX', '4DX', 'Food Court', 'Parking'],
    totalHalls: 12,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c13',
    name: 'Formula Kino Chertanovo',
    address: 'Chertanovskaya St, 1G, Moscow',
    city: 'Москва',
    rating: 4.5,
    distance: 12.5,
    latitude: 55.6347,
    longitude: 37.6047,
    facilities: ['3D', 'Premium Seats', 'Food Court'],
    totalHalls: 10,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c14',
    name: 'Kinomax Titan',
    address: 'Volgogradsky Prospekt, 89, Moscow',
    city: 'Москва',
    rating: 4.4,
    distance: 9.7,
    latitude: 55.7095,
    longitude: 37.7318,
    facilities: ['3D', 'Food Court', 'Parking'],
    totalHalls: 9,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c15',
    name: 'Silver Cinema',
    address: 'Prospekt Vernadskogo, 6, Moscow',
    city: 'Москва',
    rating: 4.6,
    distance: 8.9,
    latitude: 55.6776,
    longitude: 37.5618,
    facilities: ['Premium Seats', 'Dolby Atmos', 'Restaurant', 'Bar'],
    totalHalls: 8,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  
  // SARATOV - 10 cinemas
  {
    id: 'c16',
    name: 'Cinema Park Triumph Mall',
    address: 'Ulyanovskaya St, 47, Saratov',
    city: 'Саратов',
    rating: 4.7,
    distance: 2.1,
    latitude: 51.5331,
    longitude: 46.0342,
    facilities: ['IMAX', '3D', 'Food Court', 'Parking'],
    totalHalls: 8,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c17',
    name: 'Formula Kino Tau Gallery',
    address: 'Azina St, 32, Saratov',
    city: 'Саратов',
    rating: 4.6,
    distance: 3.4,
    latitude: 51.5268,
    longitude: 46.0478,
    facilities: ['3D', 'Premium Seats', 'Food Court'],
    totalHalls: 7,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c18',
    name: 'Happy Cinema',
    address: 'Prospekt 50 let Oktyabrya, 110A, Saratov',
    city: 'Саратов',
    rating: 4.5,
    distance: 4.2,
    latitude: 51.5459,
    longitude: 46.0596,
    facilities: ['3D', 'Kids Play Area', 'Cafe'],
    totalHalls: 6,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c19',
    name: 'Cinema 5 City Mall',
    address: 'Tarkhova St, 30B, Saratov',
    city: 'Саратов',
    rating: 4.4,
    distance: 2.8,
    latitude: 51.5400,
    longitude: 46.0353,
    facilities: ['3D', 'Standard Screens', 'Food Court'],
    totalHalls: 5,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  {
    id: 'c20',
    name: 'Oscar',
    address: 'Moskovskaya St, 115, Saratov',
    city: 'Саратов',
    rating: 4.3,
    distance: 1.9,
    latitude: 51.5312,
    longitude: 46.0147,
    facilities: ['Standard Screens', 'Cafe'],
    totalHalls: 4,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c21',
    name: 'Dom Kino Saratov',
    address: 'Volzhskaya St, 18, Saratov',
    city: 'Саратов',
    rating: 4.5,
    distance: 1.5,
    latitude: 51.5336,
    longitude: 46.0344,
    facilities: ['Art House', 'Classic Films', 'Cafe'],
    totalHalls: 3,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c22',
    name: 'Pobeda Cinema',
    address: 'Sokolovaya Gora St, 1, Saratov',
    city: 'Саратов',
    rating: 4.2,
    distance: 5.3,
    latitude: 51.5589,
    longitude: 46.0708,
    facilities: ['Standard Screens', 'Snack Bar'],
    totalHalls: 3,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c23',
    name: 'Cinema Pioner',
    address: 'Chapayeva St, 62, Saratov',
    city: 'Саратов',
    rating: 4.1,
    distance: 3.7,
    latitude: 51.5278,
    longitude: 46.0243,
    facilities: ['Classic Cinema', 'Snack Bar'],
    totalHalls: 2,
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c24',
    name: 'Loft Cinema',
    address: 'Radishcheva St, 45, Saratov',
    city: 'Саратов',
    rating: 4.4,
    distance: 2.3,
    latitude: 51.5334,
    longitude: 46.0299,
    facilities: ['Art House', 'Indie Films', 'Bar'],
    totalHalls: 2,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    integrationLevel: 2,
  },
  {
    id: 'c25',
    name: 'Cinema 5 (Novo-Astrakhanskoye)',
    address: 'Novo-Astrakhanskoye Shosse, 140, Saratov',
    city: 'Саратов',
    rating: 4.3,
    distance: 7.8,
    latitude: 51.5689,
    longitude: 46.1023,
    facilities: ['3D', 'Food Court', 'Parking'],
    totalHalls: 5,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 1,
  },
  
  // ATKARSK - 1 cinema (small town with legacy cinema)
  {
    id: 'c26',
    name: 'Cinema Rodina',
    address: 'Sovetskaya St, 87, Atkarsk',
    city: 'Аткарск',
    rating: 4.0,
    distance: 1.2,
    latitude: 51.8739,
    longitude: 45.0089,
    facilities: ['Classic Cinema', 'Snack Bar'],
    totalHalls: 1,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
    integrationLevel: 3,
    phoneNumber: '+7 (84552) 3-12-45',
  },
];

export const movies: Movie[] = [
  {
    id: '1',
    title: 'Разлом реальности',
    rating: 8.7,
    genre: ['Фантастика', 'Боевик'],
    duration: 148,
    releaseDate: '2026-03-15',
    description: 'В мире, где квантовые вычисления открыли доступ к параллельным вселенным, блестящий физик должен опередить время, чтобы предотвратить катастрофическое столкновение реальностей.',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Эмма Стоун', 'Оскар Айзек', 'Тильда Суинтон'],
    director: 'Дени Вильнёв',
  },
  {
    id: '2',
    title: 'Неоновый кошмар',
    rating: 9.1,
    genre: ['Триллер', 'Мистика'],
    duration: 132,
    releaseDate: '2026-02-28',
    description: 'Детектив в киберпанк-мегаполисе расследует серию убийств, стирающих грань между сном и реальностью.',
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Ана де Армас', 'Райан Гослинг', 'Джаред Лето'],
    director: 'Ридли Скотт',
  },
  {
    id: '3',
    title: 'Конечный горизонт',
    rating: 8.3,
    genre: ['Приключения', 'Драма'],
    duration: 156,
    releaseDate: '2026-04-10',
    description: 'Эпическое путешествие через неизведанные территории, пока человечество ищет новый дом среди звёзд.',
    posterUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Мэттью МакКонахи', 'Джессика Честейн', 'Энн Хэтэуэй'],
    director: 'Кристофер Нолан',
  },
  {
    id: '4',
    title: 'Полуночные отголоски',
    rating: 7.9,
    genre: ['Ужасы', 'Триллер'],
    duration: 118,
    releaseDate: '2026-03-25',
    description: 'Семья переезжает в старый особняк, только чтобы обнаружить, что он хранит тёмные секреты, эхом отдающиеся сквозь время.',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Florence Pugh', 'Jack Reynor', 'Will Poulter'],
    director: 'Ari Aster',
  },
  {
    id: '5',
    title: 'Velocity',
    rating: 8.5,
    genre: ['Боевик', 'Гонки'],
    duration: 124,
    releaseDate: '2026-05-01',
    description: 'An underground street racer must compete in the world\'s most dangerous race to save his family.',
    posterUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult'],
    director: 'George Miller',
  },
  {
    id: '6',
    title: 'Celestial',
    rating: 9.3,
    genre: ['Фэнтези', 'Приключения'],
    duration: 142,
    releaseDate: '2026-03-20',
    description: 'A young mage discovers she is the chosen one destined to restore balance between the mortal and celestial realms.',
    posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Zendaya', 'Timothée Chalamet', 'Rebecca Ferguson'],
    director: 'Guillermo del Toro',
  },
  {
    id: '7',
    title: 'Code Black',
    rating: 8.1,
    genre: ['Боевик', 'Шпионский'],
    duration: 136,
    releaseDate: '2026-04-15',
    description: 'A rogue spy must prevent a global cyber attack that threatens to plunge the world into chaos.',
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Tom Cruise', 'Rebecca Ferguson', 'Henry Cavill'],
    director: 'Christopher McQuarrie',
  },
  {
    id: '8',
    title: 'Eternal Summer',
    rating: 7.7,
    genre: ['Романтика', 'Драма'],
    duration: 112,
    releaseDate: '2026-06-01',
    description: 'Two strangers meet during a magical summer and must decide if their connection is worth fighting for.',
    posterUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Florence Pugh', 'Andrew Garfield', 'Saoirse Ronan'],
    director: 'Greta Gerwig',
  },
  {
    id: '9',
    title: 'Shadow Protocol',
    rating: 8.4,
    genre: ['Боевик', 'Триллер'],
    duration: 128,
    releaseDate: '2026-03-28',
    description: 'A former black ops agent is pulled back into the field when a shadow organization threatens global security.',
    posterUrl: 'https://images.unsplash.com/photo-1574267432644-f610a4ab8d9f?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1574267432644-f610a4ab8d9f?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Idris Elba', 'Charlize Theron', 'Keanu Reeves'],
    director: 'Chad Stahelski',
  },
  {
    id: '10',
    title: 'The Depths Below',
    rating: 7.6,
    genre: ['Ужасы', 'Фантастика'],
    duration: 105,
    releaseDate: '2026-03-18',
    description: 'A deep-sea research team discovers an ancient horror lurking in the ocean\'s darkest depths.',
    posterUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Jason Statham', 'Ruby Rose', 'Rainn Wilson'],
    director: 'James Wan',
  },
  {
    id: '11',
    title: 'Starlight Chronicles',
    rating: 8.9,
    genre: ['Фантастика', 'Приключения'],
    duration: 165,
    releaseDate: '2026-04-05',
    description: 'An interstellar crew embarks on a perilous mission to find humanity\'s lost colony in the far reaches of space.',
    posterUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista'],
    director: 'James Gunn',
  },
  {
    id: '12',
    title: 'Crimson Tide',
    rating: 7.3,
    genre: ['Драма', 'Триллер'],
    duration: 119,
    releaseDate: '2026-03-22',
    description: 'A submarine captain and his first officer clash over ethics when ordered to launch nuclear missiles.',
    posterUrl: 'https://images.unsplash.com/photo-1551847677-dc82d764e1eb?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1551847677-dc82d764e1eb?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Denzel Washington', 'Gene Hackman', 'Matt Craven'],
    director: 'Tony Scott',
  },
  {
    id: '13',
    title: 'Laugh Out Loud',
    rating: 6.9,
    genre: ['Комедия'],
    duration: 98,
    releaseDate: '2026-04-12',
    description: 'A struggling comedian gets one last shot at stardom when a viral video changes everything.',
    posterUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Kevin Hart', 'Tiffany Haddish', 'Ice Cube'],
    director: 'Malcolm D. Lee',
  },
  {
    id: '14',
    title: 'Dragon\'s Awakening',
    rating: 8.6,
    genre: ['Фэнтези', 'Боевик'],
    duration: 151,
    releaseDate: '2026-03-30',
    description: 'In a realm where dragons once ruled, a young warrior must awaken the last dragon to save her kingdom.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Daisy Ridley', 'John Boyega', 'Benedict Cumberbatch'],
    director: 'Peter Jackson',
  },
  {
    id: '15',
    title: 'Tokyo Midnight',
    rating: 7.8,
    genre: ['Боевик', 'Криминал'],
    duration: 116,
    releaseDate: '2026-04-08',
    description: 'A yakuza enforcer must choose between loyalty and morality when his boss targets innocent civilians.',
    posterUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1440&h=600&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: ['Hiroyuki Sanada', 'Takeshi Kitano', 'Rinko Kikuchi'],
    director: 'Takeshi Kitano',
  },
];

// Generate realistic showtimes - 4-5 shows per screen per day
const generateShowtimes = (startHour: number, movieDuration: number, showCount: number): string[] => {
  const times: string[] = [];
  let currentHour = startHour;
  let currentMinutes = 0;
  
  for (let i = 0; i < showCount; i++) {
    times.push(`${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`);
    
    // Add movie duration + 20 min cleanup time
    currentMinutes += movieDuration + 20;
    while (currentMinutes >= 60) {
      currentHour++;
      currentMinutes -= 60;
    }
  }
  
  return times;
};

// Snap a computed price to the nearest psychologically appealing ruble value
const snapToRubPrice = (price: number): number => {
  const steps = [99, 149, 199, 249, 299, 349, 399, 449, 499, 549, 599, 649, 699, 749, 799, 849, 899, 949, 999, 1099, 1199, 1299, 1399, 1499];
  return steps.reduce((closest, step) =>
    Math.abs(step - price) < Math.abs(closest - price) ? step : closest
  );
};

// Comprehensive session generation - Dynamic for all cinemas
const generateRealisticSessions = (): Omit<Session, 'id' | 'date'>[] => {
  const sessions: Omit<Session, 'id' | 'date'>[] = [];

  // Generate sessions dynamically for all cinemas
  cinemas.forEach((cinema) => {
    // Determine how many halls and sessions based on cinema size
    const hallCount = cinema.totalHalls;
    const hasIMX = cinema.facilities.includes('IMAX');
    const has4DX = cinema.facilities.includes('4DX');

    // Base pricing in rubles by city
    let basePrice = 249;
    if (cinema.city === 'Москва') basePrice = 449;
    if (cinema.city === 'Саратов') basePrice = 349;
    if (cinema.city === 'Аткарск') basePrice = 249;
    
    // Generate sessions for each hall
    for (let hallNum = 1; hallNum <= Math.min(hallCount, 8); hallNum++) {
      // Pick a random movie for this hall
      const movieIndex = (parseInt(cinema.id.replace('c', '')) + hallNum - 1) % movies.length;
      const movie = movies[movieIndex];
      
      // Determine hall type and pricing
      let hallName = `Hall ${hallNum}`;
      let priceMultiplier = 1;
      
      if (hallNum === 1 && hasIMX) {
        hallName = 'IMAX Screen';
        priceMultiplier = 1.3;
      } else if (hallNum === 2 && has4DX) {
        hallName = '4DX Theater';
        priceMultiplier = 1.6;
      } else if (hallNum <= 2) {
        hallName = `Premium Hall ${hallNum}`;
        priceMultiplier = 1.15;
      }
      
      // Generate 4-5 showtimes per hall
      const showCount = hallCount > 5 ? 5 : 4;
      const startHour = 10 + (hallNum % 3);
      
      generateShowtimes(startHour, movie.duration, showCount).forEach((time, idx) => {
        const isMatinee = idx < 2;
        const finalPrice = snapToRubPrice(basePrice * priceMultiplier * (isMatinee ? 0.9 : 1));
        
        sessions.push({
          movieId: movie.id,
          cinemaId: cinema.id,
          time,
          hallId: `h${hallNum}`,
          hallName,
          price: finalPrice,
          integrationLevel: cinema.integrationLevel,
          availableSeats: cinema.integrationLevel === 2 ? Math.floor(50 + Math.random() * 100) : undefined,
        });
      });
    }
  });
  
  return sessions;
};

// Generate sessions for next 7 days
const generateSessionsForDays = (days: number = 7): Session[] => {
  const generatedSessions: Session[] = [];
  const today = new Date(); // Using current date as base
  const baseTemplates = generateRealisticSessions();
  
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    baseTemplates.forEach((template, index) => {
      generatedSessions.push({
        ...template,
        id: `s${dayOffset * baseTemplates.length + index + 1}`,
        date: dateStr,
      });
    });
  }
  
  return generatedSessions;
};

// Generate sessions across multiple cinemas for next 7 days
export const sessions: Session[] = generateSessionsForDays(7);

export const generateSeats = (hallId: string, hallName?: string): Seat[] => {
  const seats: Seat[] = [];
  
  // Determine hall configuration based on hall name
  let rows: string[];
  let seatsPerRow: number;
  let hasVIP: boolean;
  let allVIP: boolean = false; // Premium halls only
  let vipRowStart: number;
  let vipSeatStart: number;
  let vipSeatEnd: number;
  
  // Premium halls - ALL seats are VIP, smaller intimate layout
  if (hallName?.includes('Premium')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    seatsPerRow = 8;
    hasVIP = false; // No separate VIP section
    allVIP = true; // All seats are VIP
    vipRowStart = 0;
    vipSeatStart = 0;
    vipSeatEnd = 0;
  }
  // Big Screen halls (IMAX, Big Screen) - Large auditoriums with VIP section
  else if (hallName?.includes('IMAX') || hallName?.includes('Big Screen')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    seatsPerRow = 18;
    hasVIP = true;
    vipRowStart = 7; // Rows H onwards
    vipSeatStart = 6;
    vipSeatEnd = 13;
  }
  // 4DX Theater - Medium-large with VIP section
  else if (hallName?.includes('4DX')) {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    seatsPerRow = 14;
    hasVIP = true;
    vipRowStart = 5; // Rows F onwards
    vipSeatStart = 4;
    vipSeatEnd = 11;
  }
  // Standard halls - No VIP section (just regular seats)
  else {
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    seatsPerRow = 12;
    hasVIP = false; // Standard halls don't have VIP
    vipRowStart = 0;
    vipSeatStart = 0;
    vipSeatEnd = 0;
  }
  
  rows.forEach((row, rowIndex) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      let seatType: 'vip' | 'regular' = 'regular';
      
      // Premium halls: all seats are VIP
      if (allVIP) {
        seatType = 'vip';
      }
      // Other halls with VIP sections
      else if (hasVIP && rowIndex >= vipRowStart && i >= vipSeatStart && i <= vipSeatEnd) {
        seatType = 'vip';
      }
      
      const isOccupied = Math.random() > 0.7;
      
      seats.push({
        row,
        number: i,
        type: seatType,
        isOccupied,
      });
    }
  });
  
  return seats;
};

export const userBookings: Booking[] = [
  {
    id: 'b1',
    movieId: '2',
    sessionId: 's7',
    cinemaId: 'c1',
    seats: ['D5', 'D6'],
    totalPrice: 899,
    bookingDate: '2026-03-25',
    status: 'active',
  },
  {
    id: 'b2',
    movieId: '3',
    sessionId: 's12',
    cinemaId: 'c2',
    seats: ['F7'],
    totalPrice: 449,
    bookingDate: '2026-03-20',
    status: 'completed',
  },
  {
    id: 'b3',
    movieId: '6',
    sessionId: 's21',
    cinemaId: 'c1',
    seats: ['E8', 'E9'],
    totalPrice: 899,
    bookingDate: '2026-03-12',
    status: 'completed',
  },
  {
    id: 'b4',
    movieId: '5',
    sessionId: 's18',
    cinemaId: 'c2',
    seats: ['G5', 'G6'],
    totalPrice: 1399,
    bookingDate: '2026-03-08',
    status: 'completed',
  },
  {
    id: 'b5',
    movieId: '4',
    sessionId: 's15',
    cinemaId: 'c1',
    seats: ['C4', 'C5'],
    totalPrice: 899,
    bookingDate: '2026-03-05',
    status: 'completed',
  },
  {
    id: 'b6',
    movieId: '7',
    sessionId: 's24',
    cinemaId: 'c3',
    seats: ['D7'],
    totalPrice: 449,
    bookingDate: '2026-03-02',
    status: 'completed',
  },
  {
    id: 'b7',
    movieId: '8',
    sessionId: 's27',
    cinemaId: 'c1',
    seats: ['F3', 'F4'],
    totalPrice: 899,
    bookingDate: '2026-02-28',
    status: 'completed',
  },
  {
    id: 'b8',
    movieId: '1',
    sessionId: 's1',
    cinemaId: 'c1',
    seats: ['H6', 'H7'],
    totalPrice: 1799,
    bookingDate: '2026-02-25',
    status: 'completed',
  },
];

// Utility functions
export const getCinemaById = (id: string): Cinema | undefined => {
  return cinemas.find(c => c.id === id);
};

export const getSessionsByCinema = (cinemaId: string): Session[] => {
  return sessions.filter(s => s.cinemaId === cinemaId);
};

export const getSessionsByMovie = (movieId: string): Session[] => {
  return sessions.filter(s => s.movieId === movieId);
};

export const getCinemasForMovie = (movieId: string): Cinema[] => {
  const movieSessions = getSessionsByMovie(movieId);
  const cinemaIds = [...new Set(movieSessions.map(s => s.cinemaId))];
  return cinemaIds.map(id => getCinemaById(id)).filter(Boolean) as Cinema[];
};

export const cities = ['Moscow', 'Saratov', 'Atkarsk'];
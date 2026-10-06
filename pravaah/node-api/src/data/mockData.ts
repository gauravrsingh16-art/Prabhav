import {
  MegaEvent,
  EventLocation,
  EventVideo,
  Zone,
  Gate,
  CameraFeed,
  TransportPoint,
  EmergencyPoint,
  AlertItem,
  Intervention,
  User,
  VisitorReport,
  EmergencyReport
} from '../types';

export const initialUsers: User[] = [
  {
    userId: 'usr-op-01',
    username: 'operator',
    fullName: 'Chief Operations Officer',
    role: 'OPERATOR',
    email: 'ops@pravaah.gov.in',
    phone: '+91 98765 43210',
    createdAt: new Date().toISOString()
  },
  {
    userId: 'usr-vis-01',
    username: 'visitor',
    fullName: 'Arjun Sharma',
    role: 'VISITOR',
    email: 'arjun@pravaah.app',
    phone: '+91 91234 56789',
    createdAt: new Date().toISOString()
  }
];

export const initialEvents: MegaEvent[] = [
  {
    id: 'maha-kumbh',
    name: 'Maha Kumbh Mela',
    category: 'Religious Gathering',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    location: 'Prayagraj, Uttar Pradesh',
    dateRange: '13 Jan – 26 Feb',
    expectedVisitors: 40000000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'The world\'s largest peaceful congregation at the sacred Triveni Sangam. High-density pedestrian corridors and dynamic pontoon bridge dispersal.',
    schedule: [
      { id: 'sc-1', time: '05:00 AM', title: 'Morning Snan (Holy Bath)', venueId: 'main-venue', expectedImpact: 'low' },
      { id: 'sc-2', time: '11:30 AM', title: 'Akharas Royal Procession', venueId: 'main-venue', expectedImpact: 'high' },
      { id: 'sc-3', time: '06:00 PM', title: 'Main Ghat Maha Aarti', venueId: 'main-venue', expectedImpact: 'high' }
    ]
  },
  {
    id: 'jantar-mantar',
    name: 'Jantar Mantar Protest',
    category: 'Civil Gathering',
    city: 'New Delhi',
    state: 'Delhi',
    location: 'Sansad Marg, New Delhi',
    dateRange: 'Today · 10:00 AM – 06:00 PM',
    expectedVisitors: 45000,
    status: 'normal',
    hasCameraCoverage: false, // Step 20: Jantar Mantar Mode (No cameras available!)
    description: 'Civic congregation zone under restricted airspace and no direct drone/CCTV coverage. Operates entirely in manual operator observation and visitor telemetry mode.',
    schedule: [
      { id: 'sc-jm-1', time: '10:30 AM', title: 'Participant Assembly at Sansad Marg', venueId: 'jantar-main', expectedImpact: 'moderate' },
      { id: 'sc-jm-2', time: '02:00 PM', title: 'Delegation March to Memorial Circle', venueId: 'jantar-circle', expectedImpact: 'high' },
      { id: 'sc-jm-3', time: '05:30 PM', title: 'Dispersal toward Patel Chowk Metro', venueId: 'jantar-exit', expectedImpact: 'moderate' }
    ]
  },
  {
    id: 'mumbai-ganpati',
    name: 'Mumbai Ganpati Visarjan',
    category: 'Large Public Celebration',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: 'Mumbai, Maharashtra',
    dateRange: '17 Sep - 19 Sep 2026',
    expectedVisitors: 15000000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'Massive devotional immersion procession spanning Lalbaugcha Raja to Girgaon Chowpatty and Juhu beachfront corridors.',
    schedule: [
      { id: 'sc-mg-1', time: '09:00 AM', title: 'Procession Departure from Lalbaug', venueId: 'lalbaug-corridor', expectedImpact: 'high' },
      { id: 'sc-mg-2', time: '04:00 PM', title: 'Peak Immersion Cohort at Chowpatty', venueId: 'chowpatty-beach', expectedImpact: 'high' },
      { id: 'sc-mg-3', time: '11:00 PM', title: 'Midnight Crowd Return & Local Train Egress', venueId: 'marine-lines', expectedImpact: 'moderate' }
    ]
  },
  {
    id: 'stadium-event',
    name: 'Mega Cricket Championship',
    category: 'Stadium Event',
    city: 'Ahmedabad',
    state: 'Gujarat',
    location: 'Narendra Modi Stadium, Ahmedabad',
    dateRange: '22 Oct · 02:00 PM – 11:00 PM',
    expectedVisitors: 132000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'World-class stadium arena with radial entry turnstiles, multi-tiered security plazas, and dedicated metro concourse routing.',
    schedule: [
      { id: 'sc-st-1', time: '11:30 AM', title: 'Gates 1 to 8 Ingress Commencement', venueId: 'stadium-concourse', expectedImpact: 'moderate' },
      { id: 'sc-st-2', time: '02:00 PM', title: 'Match Inauguration & Anthem', venueId: 'main-arena', expectedImpact: 'high' },
      { id: 'sc-st-3', time: '10:30 PM', title: 'Post-Match Egress Surge to Motera Metro', venueId: 'metro-corridor', expectedImpact: 'high' }
    ]
  },
  {
    id: 'concert-festival',
    name: 'NH7 Weekender Festival',
    category: 'Concert / Music Festival',
    city: 'Bengaluru',
    state: 'Karnataka',
    location: 'Nice Grounds, Tumkur Road, Bengaluru',
    dateRange: '05 Nov – 07 Nov',
    expectedVisitors: 60000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'Multi-stage open grounds with high acoustic boundaries, craft food zones, and dynamic bottlenecks during headliner stage shifts.',
    schedule: [
      { id: 'sc-cf-1', time: '03:00 PM', title: 'Afternoon Stage Openings', venueId: 'arena-north', expectedImpact: 'low' },
      { id: 'sc-cf-2', time: '08:00 PM', title: 'Headliner Main Stage Surge', venueId: 'main-stage', expectedImpact: 'high' },
      { id: 'sc-cf-3', time: '11:45 PM', title: 'Cab Pickup & Radial Parking Evacuation', venueId: 'parking-gate', expectedImpact: 'high' }
    ]
  },
  {
    id: 'religious-festival',
    name: 'Puri Jagannath Ratha Yatra',
    category: 'Religious Festival',
    city: 'Puri',
    state: 'Odisha',
    location: 'Grand Road (Bada Danda), Puri',
    dateRange: '07 Jul – 16 Jul',
    expectedVisitors: 2500000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'Devotees pulling sacred Nandighosha, Taladhwaja, and Darpadalana chariots through dense barricaded pilgrim pathways.',
    schedule: [
      { id: 'sc-pj-1', time: '08:30 AM', title: 'Pahandi Bije Ceremonial Procession', venueId: 'singhadwara', expectedImpact: 'high' },
      { id: 'sc-pj-2', time: '02:30 PM', title: 'Commencement of Chariot Pulling', venueId: 'bada-danda', expectedImpact: 'high' }
    ]
  },
  {
    id: 'public-celebration',
    name: 'Durga Puja Carnival',
    category: 'Large Public Celebration',
    city: 'Kolkata',
    state: 'West Bengal',
    location: 'Red Road & Maidan, Kolkata',
    dateRange: '08 Oct – 13 Oct',
    expectedVisitors: 8000000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'Immersion parade featuring top thematic pandal idols with high spectator density lining Red Road grandstands.',
    schedule: [
      { id: 'sc-dp-1', time: '04:30 PM', title: 'Carnival Tableau Departure', venueId: 'red-road-north', expectedImpact: 'moderate' },
      { id: 'sc-dp-2', time: '07:30 PM', title: 'Prime Tableau Judging & Folk Ensembles', venueId: 'vip-pavilion', expectedImpact: 'high' }
    ]
  }
];

export const initialLocations: Record<string, EventLocation> = {
  'maha-kumbh': {
    locationId: 'loc-kumbh',
    eventId: 'maha-kumbh',
    name: 'Triveni Sangam Ghats',
    latitude: 25.4294,
    longitude: 81.8841,
    defaultZoom: 14,
    venueRadiusMeters: 4500,
    address: 'Triveni Sangam, Daraganj, Prayagraj, UP 211006'
  },
  'jantar-mantar': {
    locationId: 'loc-jantar',
    eventId: 'jantar-mantar',
    name: 'Jantar Mantar Demonstration Area',
    latitude: 28.6271,
    longitude: 77.2166,
    defaultZoom: 16,
    venueRadiusMeters: 1200,
    address: 'Sansad Marg, Connaught Place, New Delhi, Delhi 110001'
  },
  'mumbai-ganpati': {
    locationId: 'loc-mumbai',
    eventId: 'mumbai-ganpati',
    name: 'Girgaon Chowpatty Coastal Sector',
    latitude: 18.9548,
    longitude: 72.8156,
    defaultZoom: 15,
    venueRadiusMeters: 3000,
    address: 'Marine Drive / Girgaon Chowpatty, Mumbai, MH 400007'
  },
  'stadium-event': {
    locationId: 'loc-stadium',
    eventId: 'stadium-event',
    name: 'Narendra Modi Stadium Complex',
    latitude: 23.0915,
    longitude: 72.5975,
    defaultZoom: 15,
    venueRadiusMeters: 2000,
    address: 'Motera, Stadium Rd, Ahmedabad, GJ 380005'
  },
  'concert-festival': {
    locationId: 'loc-concert',
    eventId: 'concert-festival',
    name: 'Nice Grounds Arena',
    latitude: 13.0489,
    longitude: 77.4735,
    defaultZoom: 15,
    venueRadiusMeters: 1800,
    address: 'Tumkur Road, Madavara, Bengaluru, KA 562123'
  },
  'religious-festival': {
    locationId: 'loc-puri',
    eventId: 'religious-festival',
    name: 'Bada Danda (Grand Road)',
    latitude: 19.8048,
    longitude: 85.8179,
    defaultZoom: 15,
    venueRadiusMeters: 3200,
    address: 'Grand Road, Jagannath Temple to Gundicha, Puri, OD 752001'
  },
  'public-celebration': {
    locationId: 'loc-kolkata',
    eventId: 'public-celebration',
    name: 'Red Road & Central Pandal Belt',
    latitude: 22.5552,
    longitude: 88.3476,
    defaultZoom: 14,
    venueRadiusMeters: 3800,
    address: 'Red Road, Maidan, Kolkata, WB 700021'
  }
};

export const initialVideos: Record<string, EventVideo> = {
  'maha-kumbh': {
    videoId: 'vid-kumbh',
    eventId: 'maha-kumbh',
    title: 'Maha Kumbh Holy Snan & Riverfront Movement',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545652985-5edd365b12eb?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded aerial overview of Sangam ghat approaches during morning peak bath. Distinct from real-time operational feeds.',
    durationSeconds: 240
  },
  'jantar-mantar': {
    videoId: 'vid-jantar',
    eventId: 'jantar-mantar',
    title: 'Sansad Marg Movement Pattern & Ingress Flow',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596405835955-4532a4e21a16?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded perimeter security movement and barricaded corridor survey.',
    durationSeconds: 180
  },
  'mumbai-ganpati': {
    videoId: 'vid-mumbai',
    eventId: 'mumbai-ganpati',
    title: 'Marine Drive to Chowpatty Immersion Route',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded evening procession trajectory along the Marine Drive coastal road.',
    durationSeconds: 300
  },
  'stadium-event': {
    videoId: 'vid-stadium',
    eventId: 'stadium-event',
    title: 'Motera Radial Ingress & Metro Concourses',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded spectator entry queue dispersal video.',
    durationSeconds: 210
  },
  'concert-festival': {
    videoId: 'vid-concert',
    eventId: 'concert-festival',
    title: 'Stage Arena Perimeter & Acoustic Corridors',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded festival grounds crowd movement and lighting test.',
    durationSeconds: 195
  },
  'religious-festival': {
    videoId: 'vid-puri',
    eventId: 'religious-festival',
    title: 'Bada Danda Chariot Pulling Stream',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded grand chariot procession along the main thoroughfare.',
    durationSeconds: 320
  },
  'public-celebration': {
    videoId: 'vid-kolkata',
    eventId: 'public-celebration',
    title: 'Durga Puja Carnival Float Pathway',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    isRecorded: true,
    description: 'Prerecorded ceremonial carnival staging and spectator stands.',
    durationSeconds: 260
  }
};

export const initialZones: Record<string, Zone[]> = {
  'maha-kumbh': [
    {
      zoneId: 'zn-kumbh-central',
      eventId: 'maha-kumbh',
      name: 'Central Zone',
      polygonGeoJSON: [
        [25.434, 81.878],
        [25.436, 81.890],
        [25.425, 81.892],
        [25.423, 81.880]
      ],
      centerLat: 25.4294,
      centerLng: 81.8841,
      capacity: 150000,
      currentOccupancy: 93000,
      pressurePercent: 62,
      status: 'MODERATE',
      accommodationPressure: 72
    },
    {
      zoneId: 'zn-kumbh-north',
      eventId: 'maha-kumbh',
      name: 'North Zone',
      polygonGeoJSON: [
        [25.438, 81.875],
        [25.445, 81.885],
        [25.436, 81.890],
        [25.432, 81.878]
      ],
      centerLat: 25.4370,
      centerLng: 81.8820,
      capacity: 90000,
      currentOccupancy: 37800,
      pressurePercent: 42,
      status: 'LOW',
      accommodationPressure: 48
    },
    {
      zoneId: 'zn-kumbh-east',
      eventId: 'maha-kumbh',
      name: 'East Zone',
      polygonGeoJSON: [
        [25.425, 81.892],
        [25.428, 81.905],
        [25.418, 81.904],
        [25.415, 81.891]
      ],
      centerLat: 25.4215,
      centerLng: 81.8980,
      capacity: 80000,
      currentOccupancy: 24800,
      pressurePercent: 31,
      status: 'LOW',
      accommodationPressure: 34
    },
    {
      zoneId: 'zn-kumbh-south',
      eventId: 'maha-kumbh',
      name: 'South Zone',
      polygonGeoJSON: [
        [25.420, 81.875],
        [25.423, 81.884],
        [25.414, 81.886],
        [25.411, 81.877]
      ],
      centerLat: 25.4170,
      centerLng: 81.8805,
      capacity: 75000,
      currentOccupancy: 28500,
      pressurePercent: 38,
      status: 'LOW',
      accommodationPressure: 40
    }
  ],
  'jantar-mantar': [
    {
      zoneId: 'zn-jm-core',
      eventId: 'jantar-mantar',
      name: 'Central Demonstration Plaza',
      polygonGeoJSON: [
        [28.6275, 77.2155],
        [28.6280, 77.2175],
        [28.6265, 77.2178],
        [28.6260, 77.2158]
      ],
      centerLat: 28.6271,
      centerLng: 77.2166,
      capacity: 20000,
      currentOccupancy: 11000,
      pressurePercent: 55,
      status: 'MODERATE',
      accommodationPressure: 0
    },
    {
      zoneId: 'zn-jm-north',
      eventId: 'jantar-mantar',
      name: 'Tolstoy Marg Ingress',
      polygonGeoJSON: [
        [28.6285, 77.2150],
        [28.6295, 77.2180],
        [28.6280, 77.2175],
        [28.6275, 77.2155]
      ],
      centerLat: 28.6285,
      centerLng: 77.2165,
      capacity: 15000,
      currentOccupancy: 4200,
      pressurePercent: 28,
      status: 'LOW',
      accommodationPressure: 0
    }
  ],
  'mumbai-ganpati': [
    {
      zoneId: 'zn-mb-chowpatty',
      eventId: 'mumbai-ganpati',
      name: 'Chowpatty Beachfront',
      polygonGeoJSON: [
        [18.956, 72.813],
        [18.958, 72.818],
        [18.951, 72.819],
        [18.949, 72.814]
      ],
      centerLat: 18.9548,
      centerLng: 72.8156,
      capacity: 80000,
      currentOccupancy: 52000,
      pressurePercent: 65,
      status: 'MODERATE',
      accommodationPressure: 85
    }
  ]
};

export const initialGates: Record<string, Gate[]> = {
  'maha-kumbh': [
    {
      gateId: 'gt-kumbh-1',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-central',
      name: 'Gate 1 (Fort Rampart)',
      latitude: 25.4312,
      longitude: 81.8798,
      queueTimeMinutes: 8,
      flowRatePerMin: 220,
      status: 'OPEN',
      isEmergencyExit: false
    },
    {
      gateId: 'gt-kumbh-2',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-central',
      name: 'Gate 2 (Sangam Direct)',
      latitude: 25.4285,
      longitude: 81.8820,
      queueTimeMinutes: 22,
      flowRatePerMin: 380,
      status: 'CONGESTED',
      isEmergencyExit: false
    },
    {
      gateId: 'gt-kumbh-3',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-north',
      name: 'Gate 3 (North Causeway)',
      latitude: 25.4358,
      longitude: 81.8845,
      queueTimeMinutes: 4,
      flowRatePerMin: 150,
      status: 'OPEN',
      isEmergencyExit: true
    },
    {
      gateId: 'gt-kumbh-4',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-east',
      name: 'Gate 4 (Pontoon Bridge East)',
      latitude: 25.4241,
      longitude: 81.8912,
      queueTimeMinutes: 6,
      flowRatePerMin: 180,
      status: 'OPEN',
      isEmergencyExit: false
    }
  ],
  'jantar-mantar': [
    {
      gateId: 'gt-jm-1',
      eventId: 'jantar-mantar',
      zoneId: 'zn-jm-core',
      name: 'Sansad Marg Entry Gate',
      latitude: 28.6262,
      longitude: 77.2160,
      queueTimeMinutes: 5,
      flowRatePerMin: 80,
      status: 'OPEN',
      isEmergencyExit: false
    },
    {
      gateId: 'gt-jm-2',
      eventId: 'jantar-mantar',
      zoneId: 'zn-jm-north',
      name: 'Tolstoy Road Barricade Point',
      latitude: 28.6282,
      longitude: 77.2170,
      queueTimeMinutes: 7,
      flowRatePerMin: 60,
      status: 'OPEN',
      isEmergencyExit: true
    }
  ],
  'mumbai-ganpati': [
    {
      gateId: 'gt-mb-1',
      eventId: 'mumbai-ganpati',
      zoneId: 'zn-mb-chowpatty',
      name: 'Tambe Chowk Coastal Gate',
      latitude: 18.9560,
      longitude: 72.8145,
      queueTimeMinutes: 18,
      flowRatePerMin: 290,
      status: 'CONGESTED',
      isEmergencyExit: false
    },
    {
      gateId: 'gt-mb-2',
      eventId: 'mumbai-ganpati',
      zoneId: 'zn-mb-chowpatty',
      name: 'Opera House Ingress Ramp',
      latitude: 18.9535,
      longitude: 72.8160,
      queueTimeMinutes: 6,
      flowRatePerMin: 170,
      status: 'OPEN',
      isEmergencyExit: true
    }
  ]
};

export const initialCameras: Record<string, CameraFeed[]> = {
  'maha-kumbh': [
    {
      cameraId: 'cam-07',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-central',
      name: 'CAM-07 · Main Corridor',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      latitude: 25.4305,
      longitude: 81.8815,
      status: 'ONLINE',
      lastFlowPerMin: 258,
      lastDensityPercent: 47,
      lastPeopleCount: 4910
    },
    {
      cameraId: 'cam-03',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-north',
      name: 'CAM-03 · North Transit Hub',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      latitude: 25.4362,
      longitude: 81.8830,
      status: 'ONLINE',
      lastFlowPerMin: 118,
      lastDensityPercent: 29,
      lastPeopleCount: 1640
    },
    {
      cameraId: 'cam-12',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-east',
      name: 'CAM-12 · East Approach',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      latitude: 25.4230,
      longitude: 81.8935,
      status: 'ONLINE',
      lastFlowPerMin: 96,
      lastDensityPercent: 55,
      lastPeopleCount: 1180
    },
    {
      cameraId: 'cam-09',
      eventId: 'maha-kumbh',
      zoneId: 'zn-kumbh-south',
      name: 'CAM-09 · Naini Bridge Ingress',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      latitude: 25.4180,
      longitude: 81.8820,
      status: 'ONLINE',
      lastFlowPerMin: 145,
      lastDensityPercent: 38,
      lastPeopleCount: 2100
    }
  ],
  'jantar-mantar': [], // Step 20: Jantar Mantar Mode (No cameras!)
  'mumbai-ganpati': [
    {
      cameraId: 'cam-mb-01',
      eventId: 'mumbai-ganpati',
      zoneId: 'zn-mb-chowpatty',
      name: 'CAM-MG · Marine Drive Promenade',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      latitude: 18.9555,
      longitude: 72.8150,
      status: 'ONLINE',
      lastFlowPerMin: 320,
      lastDensityPercent: 62,
      lastPeopleCount: 5400
    }
  ]
};

export const initialTransport: Record<string, TransportPoint[]> = {
  'maha-kumbh': [
    {
      transportId: 'tr-kumbh-s1',
      eventId: 'maha-kumbh',
      name: 'Shuttle S1 — Central Line',
      type: 'Shuttle',
      latitude: 25.4330,
      longitude: 81.8760,
      capacityPerHour: 3000,
      utilizationPercent: 70,
      status: 'BUSY'
    },
    {
      transportId: 'tr-kumbh-s3',
      eventId: 'maha-kumbh',
      name: 'Shuttle S3 — North Line',
      type: 'Shuttle',
      latitude: 25.4390,
      longitude: 81.8790,
      capacityPerHour: 2400,
      utilizationPercent: 52,
      status: 'NORMAL'
    },
    {
      transportId: 'tr-kumbh-bus',
      eventId: 'maha-kumbh',
      name: 'East Express Bus Terminal',
      type: 'Bus',
      latitude: 25.4210,
      longitude: 81.9020,
      capacityPerHour: 1800,
      utilizationPercent: 45,
      status: 'NORMAL'
    },
    {
      transportId: 'tr-kumbh-south',
      eventId: 'maha-kumbh',
      name: 'South Connector Shuttle Hub',
      type: 'Shuttle',
      latitude: 25.4150,
      longitude: 81.8780,
      capacityPerHour: 2000,
      utilizationPercent: 48,
      status: 'NORMAL'
    }
  ],
  'jantar-mantar': [
    {
      transportId: 'tr-jm-metro',
      eventId: 'jantar-mantar',
      name: 'Patel Chowk Metro Station',
      type: 'Metro',
      latitude: 28.6235,
      longitude: 77.2140,
      capacityPerHour: 8000,
      utilizationPercent: 42,
      status: 'NORMAL'
    }
  ]
};

export const initialEmergency: Record<string, EmergencyPoint[]> = {
  'maha-kumbh': [
    {
      pointId: 'em-kumbh-med1',
      eventId: 'maha-kumbh',
      name: 'Sangam Sector Hospital & Trauma Unit',
      type: 'MEDICAL',
      latitude: 25.4310,
      longitude: 81.8850,
      contactNumber: '108 / +91 532 2451000',
      isActive: true
    },
    {
      pointId: 'em-kumbh-med2',
      eventId: 'maha-kumbh',
      name: 'North Corridor First Aid Post',
      type: 'MEDICAL',
      latitude: 25.4380,
      longitude: 81.8830,
      contactNumber: '108',
      isActive: true
    },
    {
      pointId: 'em-kumbh-pol1',
      eventId: 'maha-kumbh',
      name: 'Central Mela Police Control Post',
      type: 'POLICE',
      latitude: 25.4290,
      longitude: 81.8810,
      contactNumber: '112 / +91 532 2451100',
      isActive: true
    },
    {
      pointId: 'em-kumbh-safe1',
      eventId: 'maha-kumbh',
      name: 'Fort Safe Haven & Evacuation Field',
      type: 'SAFE_HAVEN',
      latitude: 25.4335,
      longitude: 81.8770,
      contactNumber: '+91 532 2451200',
      isActive: true
    }
  ],
  'jantar-mantar': [
    {
      pointId: 'em-jm-med',
      eventId: 'jantar-mantar',
      name: 'Sansad Marg Mobile Medical Van',
      type: 'MEDICAL',
      latitude: 28.6265,
      longitude: 77.2162,
      contactNumber: '102',
      isActive: true
    },
    {
      pointId: 'em-jm-pol',
      eventId: 'jantar-mantar',
      name: 'Parliament Street Police Station',
      type: 'POLICE',
      latitude: 28.6255,
      longitude: 77.2170,
      contactNumber: '112',
      isActive: true
    }
  ]
};

export const initialAlerts: AlertItem[] = [
  {
    alertId: 'alt-01',
    eventId: 'maha-kumbh',
    title: 'High Crowd at Gate 2',
    message: 'Gate 2 queue length has exceeded 20 minutes with high incoming rate.',
    recommendation: 'USE GATE 3',
    targetGateId: 'gt-kumbh-2',
    targetZoneId: 'zn-kumbh-central',
    severity: 'MODERATE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

export const initialInterventions: Intervention[] = [
  {
    interventionId: 'int-01',
    eventId: 'maha-kumbh',
    title: 'Redirect arrivals to Gate 3',
    actionType: 'REDIRECT',
    targetEntity: 'Gate 2',
    description: 'Divert incoming visitors approaching Central Zone toward Gate 3 to balance queue density.',
    beforeState: 'Gate 2: HIGH (22 min wait)',
    afterState: 'Gate 2: MODERATE (9 min wait)',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    interventionId: 'int-02',
    eventId: 'maha-kumbh',
    title: 'Promote Gate B / Gate 3 in Visitor App',
    actionType: 'ADVISORY',
    targetEntity: 'Visitor Navigation App',
    description: 'Push real-time in-app rerouting advisory recommending Gate 3 over congested Gate 2.',
    beforeState: 'Gate 2 queue: 22 min',
    afterState: 'Traffic split: 45% diverted to Gate 3',
    status: 'COMPLETED',
    measuredOutcome: 'Gate 2 pressure dropped from 74% to 51% within 15 minutes of app advisory broadcast.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const initialVisitorReports: VisitorReport[] = [
  {
    reportId: 'rep-01',
    eventId: 'maha-kumbh',
    userId: 'usr-vis-01',
    userName: 'Arjun Sharma',
    category: 'Heavy Crowd',
    description: 'Choke point near pontoon ramp 2. People slowing down to photograph.',
    latitude: 25.4288,
    longitude: 81.8825,
    status: 'NEW',
    createdAt: new Date(Date.now() - 600000).toISOString()
  }
];

export const initialEmergencyReports: EmergencyReport[] = [];

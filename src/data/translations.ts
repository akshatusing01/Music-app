import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  home: string;
  search: string;
  sessions: string;
  focus: string;
  library: string;
  profile: string;
  explore: string;
  listenTogether: string;
  studyFocus: string;
  lyrics: string;
  importPlaylist: string;
  searchPlaceholder: string;
  searchSongOrArtist: string;
  createRoom: string;
  joinRoom: string;
  activeRooms: string;
  listeners: string;
  host: string;
  youAreHost: string;
  syncDrift: string;
  synced: string;
  syncing: string;
  reconnecting: string;
  lowLatencyMode: string;
  dataSaver: string;
  offlineMode: string;
  downloaded: string;
  downloadSong: string;
  aiGenerator: string;
  aiGeneratorSubtitle: string;
  generateMix: string;
  moodRomance: string;
  moodGym: string;
  moodStudy: string;
  moodParty: string;
  moodDevotional: string;
  moodIndie: string;
  moodRegional: string;
  moodChill: string;
  allSongs: string;
  nowPlaying: string;
  upNext: string;
  shareRoom: string;
  shareLyricCard: string;
  equalizer: string;
  timerWork: string;
  timerBreak: string;
  stopwatch: string;
  ambientMixer: string;
  rain: string;
  cafe: string;
  fire: string;
  templeBells: string;
  oceanWaves: string;
  whiteNoise: string;
  sendChat: string;
  chatPlaceholder: string;
  react: string;
  languageSelect: string;
  themeSelect: string;
  singAlongMode: string;
  lyricsMeaning: string;
  aiMeaningAnalysis: string;
  importFromServices: string;
  pasteUrlOrNames: string;
  importNow: string;
  storageUsed: string;
  clearOffline: string;
  connectedServices: string;
  presenceStatus: string;
}

const baseEnglish: TranslationDictionary = {
  appName: 'SyncBeat',
  tagline: 'Synchronized Social Listening, Focus & Shared Moments',
  home: 'Home',
  search: 'Search',
  sessions: 'Sessions',
  focus: 'Focus',
  library: 'Library',
  profile: 'Profile',
  explore: 'Explore',
  listenTogether: 'Listen Together',
  studyFocus: 'Study & Focus',
  lyrics: 'Live Lyrics',
  importPlaylist: 'Import Playlist',
  searchPlaceholder: 'Search songs, artists, Bollywood, Telugu, Punjabi, Lofi...',
  searchSongOrArtist: 'Search by song, artist, film or mood...',
  createRoom: 'Create Sync Room',
  joinRoom: 'Join Room',
  activeRooms: 'Active Live Rooms',
  listeners: 'Listeners',
  host: 'Host',
  youAreHost: 'You are DJ / Host',
  syncDrift: 'Sync Latency',
  synced: 'SYNCED',
  syncing: 'SYNCING',
  reconnecting: 'RECONNECTING',
  lowLatencyMode: 'Low Latency Audio',
  dataSaver: 'Data Saver (64kbps)',
  offlineMode: 'Offline Mode',
  downloaded: 'Downloaded',
  downloadSong: 'Download for Offline',
  aiGenerator: 'AI Habit & Mood Playlist',
  aiGeneratorSubtitle: 'Crafted instantly by Gemini for your current vibe',
  generateMix: 'Generate Custom Mix',
  moodRomance: 'Couple & Romance',
  moodGym: 'Gym & Beast Mode',
  moodStudy: 'Focus & Study Lofi',
  moodParty: 'Desi Party & Kuthu',
  moodDevotional: 'Sufi & Devotional',
  moodIndie: 'Indie & Chill Pop',
  moodRegional: 'Regional Hits',
  moodChill: 'Night Chill & Ambient',
  allSongs: 'All Tracks',
  nowPlaying: 'Now Playing',
  upNext: 'Up Next',
  shareRoom: 'Share Room',
  shareLyricCard: 'Share Lyric Story',
  equalizer: '10-Band Equalizer',
  timerWork: 'Deep Focus Work',
  timerBreak: 'Mind Refresh Break',
  stopwatch: 'Productivity Stopwatch',
  ambientMixer: 'Ambient Focus Sounds',
  rain: 'Monsoon Rain',
  cafe: 'Chai & Cafe',
  fire: 'Campfire',
  templeBells: 'Temple Bells & Om',
  oceanWaves: 'Goa Ocean Waves',
  whiteNoise: 'Alpha White Noise',
  sendChat: 'Send',
  chatPlaceholder: 'Send reaction or timestamped moment...',
  react: 'React',
  languageSelect: 'Language',
  themeSelect: 'Atmosphere Theme',
  singAlongMode: 'Karaoke Sing-Along',
  lyricsMeaning: 'Poetic Meaning',
  aiMeaningAnalysis: 'AI Lyric Deep Dive',
  importFromServices: 'Import from Spotify, YouTube, Apple & Amazon',
  pasteUrlOrNames: 'Paste playlist link or song titles list...',
  importNow: 'Convert & Import',
  storageUsed: 'Offline Storage Used',
  clearOffline: 'Clear Cache',
  connectedServices: 'Connected Music Services',
  presenceStatus: 'Presence & Status',
};

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: baseEnglish,
  hi: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'साथ में सुनें • रियल-टाइम सिंक • बॉलीवुड व ग्लोबल संगीत',
    home: 'होम',
    search: 'खोजें',
    sessions: 'सेशन्स',
    focus: 'फोकस',
    library: 'लाइब्रेरी',
    profile: 'प्रोफाइल',
    explore: 'खोजें (Explore)',
    listenTogether: 'साथ में सुनें (Sync Room)',
    studyFocus: 'पढ़ाई व ध्यान (Focus)',
    lyrics: 'लाइव लिरिक्स',
    importPlaylist: 'प्लेलिस्ट लाएं',
    searchPlaceholder: 'बॉलीवुड, पंजाबी, तमिल, तेलुगु, लोफी खोजें...',
    searchSongOrArtist: 'गाना, गायक या मूड खोजें...',
    createRoom: 'नया सिंक रूम बनाएं',
    joinRoom: 'रूम में जुड़ें',
    activeRooms: 'सक्रिय लाइव रूम्स',
    listeners: 'श्रोता',
    host: 'होस्ट',
    synced: 'सिंक्ड (SYNCED)',
    syncing: 'सिंकिंग...',
    reconnecting: 'पुनः कनेक्टिंग...',
    moodRomance: 'रोमांस व लव',
    moodGym: 'जिम व वर्कआउट',
    moodStudy: 'पढ़ाई व लो-फाई',
    moodParty: 'पार्टी व कुथु',
    moodDevotional: 'सूफी व भक्ति',
    moodChill: 'नाइट चिल',
    moodRegional: 'क्षेत्रीय संगीत',
  },
  ta: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'ஒன்றாக கேளுங்கள் • நேரலை இசை • தமிழ் & உலக பாடல்கள்',
    home: 'முகப்பு',
    search: 'தேடு',
    sessions: 'அறைகள்',
    focus: 'கவனம்',
    library: 'நூலகம்',
    profile: 'சுயவிவரம்',
    explore: 'ஆராய்க',
    listenTogether: 'ஒன்றாக கேளுங்கள்',
    studyFocus: 'படிப்பு & கவனம்',
    lyrics: 'நேரலை வரிகள்',
    synced: 'இணைக்கப்பட்டது',
    moodRomance: 'காதல் பாடல்கள்',
    moodGym: 'உடற்பயிற்சி',
    moodParty: 'பார்ட்டி & குத்து',
  },
  te: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'కలిసి వినండి • లైవ్ సింక్ • తెలుగు & గ్లోబల్ మ్యూజిక్',
    home: 'హోమ్',
    search: 'శోధించండి',
    sessions: 'సెషన్లు',
    focus: 'ఫోకస్',
    library: 'లైబ్రరీ',
    profile: 'ప్రొఫైల్',
    listenTogether: 'కలిసి వినండి',
    studyFocus: 'చదువు & ఫోకస్',
    lyrics: 'లైవ్ లిరిక్స్',
    synced: 'సింక్ అయింది',
    moodRomance: 'ప్రేమ గీతాలు',
    moodGym: 'జిమ్ ఎనర్జీ',
    moodParty: 'పార్టీ బీట్స్',
  },
  pa: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'ਇਕੱਠੇ ਸੁਣੋ • ਰੀਅਲ-ਟਾਈਮ ਸਿੰਕ • ਪੰਜਾਬੀ ਬੀਟਸ',
    home: 'ਹੋਮ',
    search: 'ਖੋਜੋ',
    sessions: 'ਸੈਸ਼ਨ',
    focus: 'ਧਿਆਨ',
    library: 'ਲਾਇਬ੍ਰੇਰੀ',
    profile: 'ਪ੍ਰੋਫਾਈਲ',
    listenTogether: 'ਇਕੱਠੇ ਸੁਣੋ',
    studyFocus: 'ਪੜ੍ਹਾਈ ਅਤੇ ਫੋਕਸ',
    lyrics: 'ਲਾਈਵ ਬੋਲ',
    synced: 'ਸਿੰਕ ਹੋ ਗਿਆ',
    moodRomance: 'ਰੋਮਾਂਟਿਕ ਗੀਤ',
    moodGym: 'ਜਿਮ ਬੀਸਟ ਮੋਡ',
    moodParty: 'ਭੰਗੜਾ ਤੇ ਪਾਰਟੀ',
  },
  bn: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'একসাথে শুনুন • রিয়েল-টাইম সিঙ্ক • বাংলা ও বৈশ্বিক গান',
    home: 'হোম',
    search: 'অনুসন্ধান',
    sessions: 'রুম',
    focus: 'মনোযোগ',
    library: 'লাইব্রেরি',
    profile: 'প্রোফাইল',
    listenTogether: 'একসাথে শুনুন',
    studyFocus: 'পড়ালেখা ও ফোকাস',
    lyrics: 'লাইভ লিরিক্স',
    synced: 'সিঙ্ক হয়েছে',
    moodRomance: 'রোমান্টিক গান',
    moodGym: 'জিম ও ওয়ার্কআউট',
  },
  mr: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'एकत्र ऐका • रिअल-टाइम सिंक • मराठी व बॉलिवूड संगीत',
    home: 'मुख्यपृष्ठ',
    search: 'शोधा',
    sessions: 'सेशन्स',
    focus: 'अभ्यास व लक्ष',
    library: 'संग्रह',
    profile: 'प्रोफाइल',
    listenTogether: 'एकत्र ऐका',
    studyFocus: 'अभ्यास व ध्यान',
    lyrics: 'लाइव्ह लिरिक्स',
    synced: 'सिंक झाले',
    moodRomance: 'रोमँटिक गाणी',
  },
  kn: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'ಒಟ್ಟಿಗೆ ಕೇಳಿ • ರಿಯಲ್-ಟೈಮ್ ಸಿಂಕ್ • ಕನ್ನಡ & ಜಾಗತಿಕ ಸಂಗೀತ',
    home: 'ಮುಖಪುಟ',
    search: 'ಹುಡುಕಿ',
    sessions: 'ಕೋಣೆಗಳು',
    focus: 'ಗಮನ',
    library: 'ಲೈಬ್ರರಿ',
    profile: 'ಪ್ರೊಫೈಲ್',
    listenTogether: 'ಒಟ್ಟಿಗೆ ಕೇಳಿ',
    studyFocus: 'ಅಧ್ಯಯನ & ಗಮನ',
    lyrics: 'ಲೈವ್ ಸಾಹಿತ್ಯ',
    synced: 'ಸಿಂಕ್ ಆಗಿದೆ',
  },
  ml: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'ഒരുമിച്ച് കേൾക്കൂ • തത്സമയ സിങ്ക് • മലയാളം സംഗീതം',
    home: 'ഹോം',
    search: 'തിരയുക',
    sessions: 'സെഷനുകൾ',
    focus: 'ഫോക്കസ്',
    library: 'ലൈബ്രറി',
    profile: 'പ്രൊഫൈൽ',
    listenTogether: 'ഒരുമിച്ച് കേൾക്കൂ',
    studyFocus: 'പഠനം & ഫോക്കസ്',
    lyrics: 'തത്സമയ വരികൾ',
    synced: 'സിങ്ക് ചെയ്തു',
  },
  gu: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'સાથે સાંભળો • રીઅલ-ટાઇમ સિંક • સંગીત',
    home: 'હોમ',
    search: 'શોધો',
    sessions: 'રૂમ્સ',
    focus: 'ફોકસ',
    library: 'લાઇબ્રેરી',
    profile: 'પ્રોફાઇલ',
    listenTogether: 'સાથે સાંભળો',
    studyFocus: 'અભ્યાસ અને ફોકસ',
    lyrics: 'લાઈવ ગીતો',
    synced: 'સિંક થયું',
  },
  ur: {
    ...baseEnglish,
    appName: 'SyncBeat',
    tagline: 'ایک ساتھ سنیں • ریئل ٹائم مطابقت پذیری • صوفیانہ اور بالی ووڈ',
    home: 'ہوم',
    search: 'تلاش کریں',
    sessions: 'سیشنز',
    focus: 'توجہ',
    library: 'لائبریری',
    profile: 'پروفائل',
    listenTogether: 'ایک ساتھ سنیں',
    studyFocus: 'مطالعہ اور توجہ',
    lyrics: 'لائیو بول',
    synced: 'مطابقت پذیر',
  },
};

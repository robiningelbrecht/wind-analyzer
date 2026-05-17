export const WEATHER_CODES = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Heavy freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Light snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail'
};

export const WEATHER_ICONS = {
    0: '\u2600\uFE0F',      1: '\u{1F324}\uFE0F',   2: '\u26C5',            3: '\u2601\uFE0F',
    45: '\u{1F32B}\uFE0F',  48: '\u{1F32B}\uFE0F',
    51: '\u{1F326}\uFE0F',  53: '\u{1F326}\uFE0F',  55: '\u{1F326}\uFE0F',
    56: '\u2744\uFE0F',     57: '\u2744\uFE0F',
    61: '\u{1F327}\uFE0F',  63: '\u{1F327}\uFE0F',  65: '\u{1F327}\uFE0F',
    66: '\u{1F327}\uFE0F',  67: '\u{1F327}\uFE0F',
    71: '\u{1F328}\uFE0F',  73: '\u{1F328}\uFE0F',  75: '\u{1F328}\uFE0F',  77: '\u{1F328}\uFE0F',
    80: '\u{1F326}\uFE0F',  81: '\u{1F327}\uFE0F',  82: '\u{1F327}\uFE0F',
    85: '\u{1F328}\uFE0F',  86: '\u{1F328}\uFE0F',
    95: '\u26A1',           96: '\u26A1',           99: '\u26A1',
};

export const WIND_LABELS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

export const BEAUFORT_SCALE = [
    { maxKmh: 1,        force: 0,  name: 'Calm',            color: [107, 114, 128] },
    { maxKmh: 6,        force: 1,  name: 'Light air',       color: [107, 114, 128] },
    { maxKmh: 12,       force: 2,  name: 'Light breeze',    color: [22, 163, 74]   },
    { maxKmh: 20,       force: 3,  name: 'Gentle breeze',   color: [22, 163, 74]   },
    { maxKmh: 29,       force: 4,  name: 'Moderate breeze', color: [217, 119, 6]   },
    { maxKmh: 39,       force: 5,  name: 'Fresh breeze',    color: [217, 119, 6]   },
    { maxKmh: 50,       force: 6,  name: 'Strong breeze',   color: [234, 88, 12]   },
    { maxKmh: 62,       force: 7,  name: 'Near gale',       color: [220, 38, 38]   },
    { maxKmh: 75,       force: 8,  name: 'Gale',            color: [220, 38, 38]   },
    { maxKmh: 89,       force: 9,  name: 'Strong gale',     color: [220, 38, 38]   },
    { maxKmh: 103,      force: 10, name: 'Storm',           color: [185, 28, 28]   },
    { maxKmh: 118,      force: 11, name: 'Violent storm',   color: [185, 28, 28]   },
    { maxKmh: Infinity, force: 12, name: 'Hurricane',       color: [127, 29, 29]   },
];

export const UV_BANDS = [
    { max: 3,        label: 'Low',       color: '',               severity: 'info',    advice: 'No sun protection needed for most rides.' },
    { max: 6,        label: 'Moderate',  color: 'text-amber-600', severity: 'info',    advice: 'Sunscreen and sunglasses recommended, especially on long rides.' },
    { max: 8,        label: 'High',      color: 'text-amber-600', severity: 'warning', advice: 'Apply SPF 30+, wear sunglasses, cover exposed skin.' },
    { max: 11,       label: 'Very High', color: 'text-red-600',   severity: 'danger',  advice: 'Strong protection essential. Limit sun exposure between 10:00 and 16:00.' },
    { max: Infinity, label: 'Extreme',   color: 'text-red-600',   severity: 'danger',  advice: 'Maximum protection required. Consider rescheduling, or ride early or late.' },
];

export const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export const WEATHER_PARAMS = [
    'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
    'precipitation', 'weather_code', 'cloud_cover', 'surface_pressure',
    'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index',
].join(',');

export const SPEED_KEY = 'wind-analyzer-speed';
export const UNITS_KEY = 'wind-analyzer-units';
export const THEME_KEY = 'wind-analyzer-theme';

export const NO_WIND_THRESHOLD = 1;
export const WindType = Object.freeze({
    HEADWIND: 'headwind',
    TAILWIND: 'tailwind',
    CROSSWIND: 'crosswind',
    CALM: 'calm',
});

export function windTypeShortLabel(type) {
    if (type === WindType.CALM) return 'Negligible';
    return type.charAt(0).toUpperCase() + type.slice(1);
}

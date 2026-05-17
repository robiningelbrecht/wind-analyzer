import { METRIC } from './utils/units';
import { SPEED_KEY, UNITS_KEY, THEME_KEY, WEATHER_MODEL_KEY, WEATHER_MODELS } from './constants';

function initialWeatherModel() {
    const saved = localStorage.getItem(WEATHER_MODEL_KEY);
    return WEATHER_MODELS.some((m) => m.id === saved) ? localStorage.getItem(WEATHER_MODEL_KEY) : WEATHER_MODELS[0].id;
}

export const $ = (name) => document.querySelector(`[data-component="${name}"]`);

export const state = {
    view: 'upload',
    loading: false,
    dateTime: '',
    dateMin: '',
    dateMax: '',
    avgSpeed: parseInt(localStorage.getItem(SPEED_KEY)) || 25,
    points: null,
    reversedPoints: null,
    centroid: null,
    routeName: null,
    analysis: null,
    weather: null,
    windDir: 0,
    windSpeed: 0,
    reversed: false,
    unitSystem: localStorage.getItem(UNITS_KEY) || METRIC,
    weatherModel: initialWeatherModel(),
    isDarkMode: (localStorage.getItem(THEME_KEY) || 'dark') === 'dark',
    _weatherCache: null,
};

export function setView(view) {
    state.view = view;
    const isResults = view === 'results';
    $('uploadView').classList.toggle('hidden', isResults);
    $('resultsView').classList.toggle('hidden', !isResults);
    $('resetBtn').classList.toggle('hidden', !isResults);
    $('tourItem').classList.toggle('hidden', !isResults);
}

export function setLoading(on) {
    state.loading = on;
    $('loadingOverlay').classList.toggle('hidden', !on);
}

export function setError(msg) {
    const box = $('errorBox');
    if (msg) {
        box.textContent = msg;
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
}

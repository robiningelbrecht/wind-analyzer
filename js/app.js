import { $, state, setView, setLoading, setError } from './state';
import { assertUniqueDataComponents } from './utils/assertUniqueDataComponents';
import { LocalDate } from './utils/LocalDate';
import { unitLabel, METRIC, IMPERIAL } from './utils/units';
import { SPEED_KEY, UNITS_KEY, THEME_KEY } from './constants';
import { GpxParser } from './services/GpxParser';
import { OpenMeteo } from './services/OpenMeteo';
import { RouteAnalyzer } from './services/RouteAnalyzer';
import { keyValueRepository } from './services/KeyValueRepository';
import { LeafletMap } from './components/LeafletMap';
import { WindStrip } from './components/WindStrip';
import { RouteStats } from './components/RouteStats';
import { Breakdown } from './components/Breakdown';
import { WindRose } from './components/WindRose';
import { Weather } from './components/Weather';
import { SegmentTable } from './components/SegmentTable';
import { HourlyForecastTable } from './components/HourlyForecastTable';
import { DropZone } from './components/DropZone';
import { Dropdown } from './components/Dropdown';
import { Tour } from './components/Tour';
import { Debug } from './utils/Debug';

const debug = new Debug(state);
window.WindAhead = { debug: () => debug.snapshot() };
const gpxParser = new GpxParser();
const openMeteo = new OpenMeteo();
const routeAnalyzer = new RouteAnalyzer();
const map = new LeafletMap();
const windStrip = new WindStrip();
const tour = new Tour();

let stats, breakdown, windRose, weather, segmentTable, hourlyForecastTable;

function updateUnitLabels() {
    $('speedUnit').textContent = unitLabel(state.unitSystem, 'speed');
}

function renderResults() {
    if (!state.analysis) {
        return;
    }

    $('dateInput').value = state.dateTime;
    $('dateInput').min = state.dateMin;
    $('dateInput').max = state.dateMax;
    $('speedInput').value = state.avgSpeed;

    $('mapLegendTitle').textContent = state.routeName || 'Wind Effect';

    const date = new LocalDate(state.dateTime);
    const opts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', ...opts });
    $('dateNote').textContent = dateStr;
    $('dateNoteLg').textContent = dateStr;

    stats.render(state);

    $('cardsSection').classList.toggle('hidden', !state.weather);
    if (state.weather) {
        breakdown.render(state);
        windRose.render(state);
        weather.render(state);
    }

    segmentTable.render(state);
    hourlyForecastTable.render(state);
    map.render(state);
    windStrip.render(state);
}

async function processGpx(name, text, { persist = true } = {}) {
    setView('results');
    setLoading(true);
    setError(null);

    try {
        const parsed = gpxParser.parse(text);
        debug.logUpload({ name, size: text.length }, parsed);
        state.points = parsed.points;
        state.reversedPoints = [...parsed.points].reverse();
        state.routeName = parsed.name;
        state.centroid = state.points.reduce(
            (acc, p) => ({ lat: acc.lat + p.lat / state.points.length, lon: acc.lon + p.lon / state.points.length }),
            { lat: 0, lon: 0 }
        );
        const now = new Date();
        now.setMinutes(0, 0, 0);
        const nowDate = LocalDate.fromDate(now);
        state.dateTime = nowDate.toString();
        state.dateMin = nowDate.toString();
        state.dateMax = nowDate.addDays(7).toString();

        if (persist) {
            keyValueRepository.set('lastGpx', { name, text });
        }

        await runAnalysis();
    } catch (err) {
        debug.logError('GPX processing', err);
        setLoading(false);
        setView('upload');
        setError(err.message || 'Something went wrong');
    }
}

async function processFile(file) {
    const text = await file.text();
    await processGpx(file.name, text);
}

async function runAnalysis() {
    setLoading(true);
    setError(null);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
        const lat = state.centroid.lat.toFixed(4);
        const lon = state.centroid.lon.toFixed(4);
        const localDate = new LocalDate(state.dateTime);
        const cacheKey = `${lat},${lon},${localDate.dateStr},${state.unitSystem}`;

        let data;
        if (state._weatherCache && state._weatherCache.key === cacheKey) {
            data = state._weatherCache.data;
        } else {
            data = await openMeteo.fetch(lat, lon, localDate, state.unitSystem);
            state._weatherCache = { key: cacheKey, data };
        }
        const weather = openMeteo.extract(data, localDate);

        const windData = {
            speeds: data.hourly.wind_speed_10m,
            dirs: data.hourly.wind_direction_10m,
            codes: data.hourly.weather_code,
            temps: data.hourly.temperature_2m,
        };
        let startIdx = data.hourly.time.findIndex(t => t.startsWith(localDate.hourPrefix));
        if (startIdx === -1) {
            startIdx = 0;
        }

        const pts = state.reversed ? state.reversedPoints : state.points;
        state.analysis = routeAnalyzer.analyze(pts, windData, startIdx, state.avgSpeed);
        state.weather = weather;

        debug.logAnalysis({ lat, lon, dateStr: localDate.dateStr, unitSystem: state.unitSystem, weather, analysis: state.analysis, data });
        state.windDir = weather.windDirection10m;
        state.windSpeed = weather.windSpeed10m;

        setLoading(false);
        renderResults();
    } catch (err) {
        debug.logError('Weather/Analysis', err);
        setLoading(false);
        setError(err.message || 'Failed to fetch weather data');
    }
}

function reset() {
    state.analysis = null;
    state.weather = null;
    state.points = null;
    state.reversedPoints = null;
    state.centroid = null;
    state.routeName = null;
    state.reversed = false;
    state._weatherCache = null;
    $('fileInput').value = '';
    $('reverseToggle').classList.remove('active');
    stats.hide();
    $('cardsSection').classList.add('hidden');
    segmentTable.hide();
    hourlyForecastTable.hide();
    map.destroy();
    keyValueRepository.delete('lastGpx');
    setView('upload');
    setError(null);
}

document.addEventListener('DOMContentLoaded', async () => {
    assertUniqueDataComponents();

    $('speedInput').value = state.avgSpeed;
    updateUnitLabels();

    $('resetBtn').addEventListener('click', reset);
    $('faqBtn').addEventListener('click', () => {
        dropdown.close();
        $('faqDialog').showModal();
    });
    $('tourBtn').addEventListener('click', () => {
        dropdown.close();
        tour.run();
    });
    const unitToggle = $('unitToggle');
    unitToggle.checked = state.unitSystem === IMPERIAL;
    unitToggle.addEventListener('change', () => {
        state.unitSystem = unitToggle.checked ? IMPERIAL : METRIC;
        localStorage.setItem(UNITS_KEY, state.unitSystem);
        updateUnitLabels();
        if (state.analysis) {
            runAnalysis();
        }
    });
    const themeToggle = $('themeToggle');
    themeToggle.checked = state.isDarkMode;
    themeToggle.addEventListener('change', () => {
        const next = themeToggle.checked ? 'dark' : 'light';
        state.isDarkMode = next === 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        map.updateTiles();
    });

    const dropdown = new Dropdown('mainMenu');

    const dropZone = new DropZone();
    dropZone.bind(processFile, processGpx);

    $('dateInput').addEventListener('change', (e) => {
        state.dateTime = e.target.value;
        runAnalysis();
    });
    $('speedInput').addEventListener('change', (e) => {
        state.avgSpeed = parseInt(e.target.value) || 25;
        localStorage.setItem(SPEED_KEY, state.avgSpeed);
        runAnalysis();
    });
    $('reverseToggle').addEventListener('click', () => {
        state.reversed = !state.reversed;
        const btn = $('reverseToggle');
        btn.classList.toggle('active', state.reversed);
        btn.lastChild.textContent = state.reversed ? 'Original' : 'Reverse';
        runAnalysis();
    });

    stats = new RouteStats();
    breakdown = new Breakdown();
    windRose = new WindRose();
    weather = new Weather();
    segmentTable = new SegmentTable();
    hourlyForecastTable = new HourlyForecastTable();
    windStrip.bind(map);

    const cachedGpx = await keyValueRepository.get('lastGpx');
    if (cachedGpx) {
        dropZone.showLastGpx(cachedGpx.name, cachedGpx.text, processGpx);
    }
});

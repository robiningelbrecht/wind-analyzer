import { $ } from '../state';
import { unitLabel, convertUnit, IMPERIAL } from '../utils/units';
import { UV_BANDS, NO_WIND_THRESHOLD } from '../constants';
import { GeoUtils } from '../utils/GeoUtils';
import { Popover } from './Popover';

const STAT_VALUE_CLASS = 'text-2xl font-extrabold tabular-nums tracking-[-0.02em] leading-[1.2]';

export class RouteStats {
    constructor() {
        this.statsRow = $('statsRow');
        this.statDist = $('statDist');
        this.distUnit = $('distUnit');
        this.elevContainer = $('elevContainer');
        this.statElev = $('statElev');
        this.elevUnit = $('elevUnit');
        this.statNetValue = $('statNetValue');
        this.statNetLabel = $('statNetLabel');
        this.statNet = $('statNet');
        this.netWindUnit = $('netWindUnit');
        this.tempContainer = $('tempContainer');
        this.statTemp = $('statTemp');
        this.tempUnit = $('tempUnit');
        this.windSpeedContainer = $('windSpeedContainer');
        this.statWindSpeed = $('statWindSpeed');
        this.windSpeedUnit = $('windSpeedUnit');
        this.beaufortChip = $('beaufortChip');
        this.windSpeedPopover = new Popover('windSpeedPopover');
        this.uvContainer = $('uvContainer');
        this.statUvValue = $('statUvValue');
        this.statUv = $('statUv');
        this.statUvLabel = $('statUvLabel');
        this.uvPopover = new Popover('uvPopover');
    }

    render(state) {
        const { analysis, weather, unitSystem } = state;
        this.statsRow.classList.remove('hidden');

        const dist = convertUnit(analysis.totalDist / 1000, 'dist', unitSystem);
        this.statDist.textContent = dist.toFixed(1);
        this.distUnit.textContent = unitLabel(unitSystem, 'dist');

        const hasEle = analysis.maxEle !== null;
        this.elevContainer.classList.toggle('hidden', !hasEle);
        if (hasEle) {
            this.statElev.textContent = convertUnit(analysis.elevGain, 'elev', unitSystem).toFixed(0);
            this.elevUnit.textContent = unitLabel(unitSystem, 'elev');
        }

        const ah = analysis.avgHead;
        this.statNetValue.className = STAT_VALUE_CLASS;
        if (ah > NO_WIND_THRESHOLD) {
            this.statNetValue.classList.add('text-red-600');
            this.statNetLabel.textContent = 'Net Headwind';
        } else if (ah < -NO_WIND_THRESHOLD) {
            this.statNetValue.classList.add('text-green-600');
            this.statNetLabel.textContent = 'Net Tailwind';
        } else if (Math.abs(ah) <= NO_WIND_THRESHOLD) {
            this.statNetValue.classList.add('text-gray-500');
            this.statNetLabel.textContent = 'Net wind negligible';
        } else {
            this.statNetValue.classList.add('text-amber-600');
            this.statNetLabel.textContent = 'Net Crosswind';
        }
        this.statNet.textContent = Math.abs(analysis.avgHead).toFixed(1);
        this.netWindUnit.textContent = unitLabel(unitSystem, 'speed');

        const hasWeather = !!weather;
        this.tempContainer.classList.toggle('hidden', !hasWeather);
        this.windSpeedContainer.classList.toggle('hidden', !hasWeather);
        if (hasWeather) {
            this.statTemp.textContent = weather.temperature2m;
            this.tempUnit.textContent = unitLabel(unitSystem, 'temp');
            this.statWindSpeed.textContent = weather.windSpeed10m;
            this.windSpeedUnit.textContent = unitLabel(unitSystem, 'speed');
            this.renderBeaufort(weather.windSpeed10m, unitSystem);
        }

        const hasUv = hasWeather && weather.uvIndexMax != null;
        this.uvContainer.classList.toggle('hidden', !hasUv);
        if (hasUv) {
            this.renderUv(weather.uvIndexMax);
        }
    }

    renderBeaufort(windSpeed, unitSystem) {
        const kmh = unitSystem === IMPERIAL ? windSpeed * 1.609344 : windSpeed;
        const b = GeoUtils.beaufort(kmh);
        const [r, g, bl] = b.color;
        this.beaufortChip.textContent = `Force ${b.force} - ${b.name}`;
        this.beaufortChip.style.color = `rgb(${r},${g},${bl})`;
        this.beaufortChip.style.backgroundColor = `rgba(${r},${g},${bl},0.15)`;
    }

    renderUv(uvIndex) {
        const band = UV_BANDS.find(b => uvIndex < b.max);
        this.statUv.textContent = uvIndex.toFixed(0);
        this.statUvLabel.textContent = band.label;
        this.statUvValue.className = `${STAT_VALUE_CLASS} ${band.color}`.trim();
        this.uvPopover.setContent(band.advice);
    }

    hide() {
        this.statsRow.classList.add('hidden');
    }
}

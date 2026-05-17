import { $ } from '../state';
import { LocalDate } from '../utils/LocalDate';
import { GeoUtils } from '../utils/GeoUtils';
import { UV_BANDS } from '../constants';
import { unitLabel, convertUnit } from '../utils/units';

function uvDisplay(uv) {
    if (uv == null || Number.isNaN(Number(uv))) {
        return { html: '-' };
    }
    const u = Number(uv);
    const band = UV_BANDS.find(b => u < b.max);
    const bandClass = band.color || 'text-gray-600';
    return {
        html: `${u.toFixed(0)}<span class="text-[0.68rem] ${bandClass} ml-1 whitespace-nowrap">${band.label}</span>`,
    };
}

export class HourlyForecastTable {
    constructor() {
        this.section = $('hourlyForecastSection');
        this.body = $('hourlyForecastBody');
    }

    buildHourlyRows(apiResponse, hourPrefix) {
        const h = apiResponse.hourly;
        if (!h?.time?.length) return [];
        const uv = h.uv_index;
        const rows = [];
        for (let i = 0; i < h.time.length; i++) {
            rows.push({
                time: h.time[i],
                windSpeed: h.wind_speed_10m[i],
                windDir: h.wind_direction_10m[i],
                precipitation: h.precipitation[i],
                uvIndex: Array.isArray(uv) ? uv[i] ?? null : null,
                isSelectedHour: h.time[i].startsWith(hourPrefix),
            });
        }
        return rows;
    }

    render(state) {
        if (!state.weather) {
            this.section.classList.add('hidden');
            return;
        }
        const api = state._weatherCache?.data;
        const hourPrefix = new LocalDate(state.dateTime).hourPrefix;
        const rows = api ? this.buildHourlyRows(api, hourPrefix) : [];
        if (!rows.length) {
            this.section.classList.add('hidden');
            return;
        }
        this.section.classList.remove('hidden');
        const { unitSystem } = state;
        const speedU = unitLabel(unitSystem, 'speed');
        const precipU = unitLabel(unitSystem, 'precip');
        this.body.innerHTML = rows.map((row) => {
            const timeStr = new LocalDate(row.time).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            const windStr = `${Number(row.windSpeed).toFixed(0)}\u00a0${speedU}\u00a0<span class="text-[0.68rem] text-gray-500">${GeoUtils.windLabel(row.windDir)}</span>`;
            const precipVal = convertUnit(row.precipitation, 'precip', unitSystem).toFixed(2);
            const uv = uvDisplay(row.uvIndex);
            const trClass = row.isSelectedHour ? ' class="data-table-row-highlight"' : '';
            return `<tr${trClass}>
                <td>${timeStr}</td>
                <td>${windStr}</td>
                <td>${precipVal}\u00a0${precipU}</td>
                <td>${uv.html}</td>
            </tr>`;
        }).join('');
    }

    hide() {
        this.section.classList.add('hidden');
    }
}

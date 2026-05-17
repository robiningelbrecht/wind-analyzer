import { WindType, windTypeShortLabel } from '../constants';
import { GeoUtils } from '../utils/GeoUtils';
import { unitLabel, convertUnit } from '../utils/units';
import { $, state } from '../state';

export class WindStrip {
    constructor() {
        this.segments = [];
        this.strip = $('windStrip');
        this.tooltip = $('stripTooltip');
        this.container = $('stripContainer');
    }

    render(s) {
        const segments = s.analysis.segments;
        this.strip.innerHTML = '';
        this.segments = [];
        let cumDist = 0;
        segments.forEach(seg => {
            const div = document.createElement('div');
            div.style.flex = `${seg.dist} 0 0`;
            div.style.background = GeoUtils.segmentRouteColor(seg);
            this.strip.appendChild(div);
            cumDist += seg.dist;
            this.segments.push({ ...seg, cumDist });
        });
    }

    bind(map) {
        this.strip.addEventListener('mousemove', (event) => {
            if (!this.segments.length || !map.map) return;
            const rect = this.strip.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const seg = this.getSegmentAtPosition(pct);
            if (!seg) return;
            const midLat = (seg.p1.lat + seg.p2.lat) / 2;
            const midLon = (seg.p1.lon + seg.p2.lon) / 2;
            const { unitSystem } = state;
            const dist = convertUnit(seg.cumDist / 1000, 'dist', unitSystem).toFixed(1);
            const distU = unitLabel(unitSystem, 'dist');
            const speedU = unitLabel(unitSystem, 'speed');
            const typeClass = seg.type === WindType.HEADWIND ? 'text-red-600' : seg.type === WindType.TAILWIND ? 'text-green-600'
                : seg.type === WindType.CALM ? 'text-gray-500' : 'text-amber-600';
            const typeLabel = windTypeShortLabel(seg.type);
            this.tooltip.innerHTML = `<span class="font-semibold ${typeClass}">${typeLabel}</span> &middot; ${dist} ${distU}<br>Along route: ${seg.headComp.toFixed(1)} ${speedU} &middot; Cross: ${Math.abs(seg.crossComp).toFixed(1)} ${speedU}`;
            this.tooltip.style.left = (event.clientX - rect.left) + 'px';
            this.tooltip.classList.remove('hidden');
            map.showHoverMarker(midLat, midLon, seg);
        });

        this.container.addEventListener('mouseleave', () => {
            this.tooltip.classList.add('hidden');
            map.removeHoverMarker();
        });
    }

    getSegmentAtPosition(pct) {
        if (!this.segments.length) return null;
        const totalDist = this.segments[this.segments.length - 1].cumDist;
        const targetDist = pct * totalDist;
        return this.segments.find(s => s.cumDist >= targetDist) || this.segments[this.segments.length - 1];
    }
}

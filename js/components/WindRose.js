import { WindType } from '../constants';
import { $ } from '../state';
import { GeoUtils } from '../utils/GeoUtils';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export class WindRose {
    constructor() {
        this.paths = $('windRosePaths');
        this.legend = $('windRoseLegend');
    }

    render(state) {
        const rose = this.compute(state.analysis.segments);
        const { windDir } = state;

        let svg = rose.map(p =>
            `<path d="${p.path}" fill="${p.color}" fill-opacity="0.5" stroke="${p.color}" stroke-width="0.5"/>`
        ).join('');
        const toX = 50 + 22 * Math.sin(GeoUtils.toRad(windDir + 180));
        const toY = 50 - 22 * Math.cos(GeoUtils.toRad(windDir + 180));
        svg += `<line x1="50" y1="50" x2="${toX.toFixed(1)}" y2="${toY.toFixed(1)}" stroke="#FC4C02" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>`;
        svg += `<circle cx="${toX.toFixed(1)}" cy="${toY.toFixed(1)}" r="2.5" fill="#FC4C02" opacity="0.8"/>`;
        this.paths.innerHTML = svg;

        this.legend.innerHTML = rose.map(p => `
            <div class="flex items-center gap-1.5">
                <span class="text-[0.72rem] font-semibold text-gray-600 w-5.5">${p.label}</span>
                <div class="flex-1 h-1.25 bg-gray-200 rounded-sm overflow-hidden">
                    <div class="h-full rounded-sm transition-[width] duration-400" style="width:${p.pct}%;background:${p.color}"></div>
                </div>
                <span class="text-[0.68rem] text-gray-500 tabular-nums w-7 text-right">${p.distPct}%</span>
            </div>`).join('');
    }

    compute(segments) {
        const bins = DIRS.map(() => ({ dist: 0, headW: 0 }));
        let totalDist = 0;
        for (const seg of segments) {
            const idx = Math.round(seg.brng / 45) % 8;
            bins[idx].dist += seg.dist;
            bins[idx].headW += (seg.type === WindType.CALM ? 0 : seg.headFactor) * seg.dist;
            totalDist += seg.dist;
        }
        const maxDist = Math.max(...bins.map(bin => bin.dist), 1);
        const cx = 50, cy = 50, maxR = 36;
        return DIRS.map((label, i) => {
            const bin = bins[i];
            const pctOfMax = bin.dist / maxDist;
            const radius = maxR * Math.max(pctOfMax, 0.06);
            const angleDeg = i * 45;
            const avgHeadFactor = bin.dist > 0 ? bin.headW / bin.dist : 0;
            const arcStart = GeoUtils.toRad(angleDeg - 22.5 - 90);
            const arcEnd = GeoUtils.toRad(angleDeg + 22.5 - 90);
            const x1 = cx + radius * Math.cos(arcStart);
            const y1 = cy + radius * Math.sin(arcStart);
            const x2 = cx + radius * Math.cos(arcEnd);
            const y2 = cy + radius * Math.sin(arcEnd);
            return {
                label,
                path: `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${radius.toFixed(1)},${radius.toFixed(1)} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`,
                color: GeoUtils.segmentColor(avgHeadFactor),
                pct: (pctOfMax * 100).toFixed(0),
                distPct: totalDist > 0 ? (bin.dist / totalDist * 100).toFixed(0) : '0',
            };
        });
    }
}

import { $ } from '../state';
import { GeoUtils } from '../utils/GeoUtils';
import { NO_WIND_THRESHOLD, WindType, windTypeShortLabel } from '../constants';
import { unitLabel, convertUnit } from '../utils/units';
import { NetWindBar } from './NetWindBar';

export class SegmentTable {
    constructor() {
        this.container = $('segmentDetails');
        this.body = $('segmentTableBody');
        this.netWindBar = new NetWindBar();
    }

    render(state) {
        const { unitSystem } = state;
        const rows = this.compute(state.analysis.segments, NO_WIND_THRESHOLD);
        const speed = unitLabel(unitSystem, 'speed');
        const elev = unitLabel(unitSystem, 'elev');
        if (!rows.length) {
            this.container.classList.add('hidden');
            return;
        }
        this.container.classList.remove('hidden');
        const maxAbs = Math.max(...rows.map(r => Math.abs(r.headComp)), 1e-6);
        this.body.innerHTML = rows.map(row => {
            const colorClass = row.type === WindType.CALM ? 'text-gray-500'
                : row.headComp > 0.5 ? 'text-red-600' : row.headComp < -0.5 ? 'text-green-600' : '';
            const dotClass = row.type === WindType.HEADWIND ? 'bg-red-600' : row.type === WindType.TAILWIND ? 'bg-green-600'
                : row.type === WindType.CALM ? 'bg-gray-400' : 'bg-amber-600';
            const elevVal = row.elevation !== null ? convertUnit(row.elevation, 'elev', unitSystem).toFixed(0) + '\u00a0' + elev : '-';
            const bar = this.netWindBar.render(row.headComp, maxAbs, row.type === WindType.CALM);
            const typeLabel = windTypeShortLabel(row.type);
            return `<tr>
                <td>${row.index}</td>
                <td>${row.bearing.toFixed(0)}\u00b0 <span class="text-[0.68rem] text-gray-500">${GeoUtils.windLabel(row.bearing)}</span></td>
                <td><div class="flex items-center gap-2 min-w-0">${bar}<span class="${colorClass} whitespace-nowrap">${row.headComp.toFixed(1)}\u00a0${speed}</span></div></td>
                <td>${row.crossComp.toFixed(1)}\u00a0${speed}</td>
                <td>${elevVal}</td>
                <td><span class="inline-block size-2 rounded-full mr-1.5 align-middle ${dotClass}"></span>${typeLabel}</td>
            </tr>`;
        }).join('');
    }

    hide() {
        this.container.classList.add('hidden');
    }

    compute(segments, noWindThreshold) {
        const classify = (avgHead, avgCross) => {
            const absH = Math.abs(avgHead);
            const absC = Math.abs(avgCross);
            if (absH < noWindThreshold && absC < noWindThreshold) return WindType.CALM;
            if (absH < noWindThreshold) return WindType.CROSSWIND;
            if (avgHead > 2) return WindType.HEADWIND;
            if (avgHead < -2) return WindType.TAILWIND;
            return WindType.CROSSWIND;
        };
        const rows = [];
        let cumDist = 0, bucketDist = 0;
        let bucketHeadW = 0, bucketCrossW = 0;
        let bucketBrngX = 0, bucketBrngY = 0;
        let lastEle = null;
        let nextInterval = 1000;
        for (const seg of segments) {
            cumDist += seg.dist;
            bucketDist += seg.dist;
            bucketHeadW += seg.headComp * seg.dist;
            bucketCrossW += Math.abs(seg.crossComp) * seg.dist;
            bucketBrngX += Math.cos(GeoUtils.toRad(seg.brng)) * seg.dist;
            bucketBrngY += Math.sin(GeoUtils.toRad(seg.brng)) * seg.dist;
            lastEle = seg.p2.ele;
            if (cumDist >= nextInterval) {
                const avgHead = bucketDist > 0 ? bucketHeadW / bucketDist : 0;
                const avgCross = bucketDist > 0 ? bucketCrossW / bucketDist : 0;
                const avgBrng = (GeoUtils.toDeg(Math.atan2(bucketBrngY, bucketBrngX)) + 360) % 360;
                const type = classify(avgHead, avgCross);
                rows.push({ index: rows.length + 1, bearing: avgBrng, headComp: avgHead, crossComp: avgCross, elevation: lastEle, type });
                bucketDist = 0; bucketHeadW = 0; bucketCrossW = 0; bucketBrngX = 0; bucketBrngY = 0;
                nextInterval += 1000;
            }
        }
        if (bucketDist > 100) {
            const avgHead = bucketHeadW / bucketDist;
            const avgCross = bucketCrossW / bucketDist;
            const avgBrng = (GeoUtils.toDeg(Math.atan2(bucketBrngY, bucketBrngX)) + 360) % 360;
            const type = classify(avgHead, avgCross);
            rows.push({ index: rows.length + 1, bearing: avgBrng, headComp: avgHead, crossComp: avgCross, elevation: lastEle, type });
        }
        return rows;
    }
}

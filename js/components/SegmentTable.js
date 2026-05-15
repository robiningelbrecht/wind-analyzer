import { $ } from '../state';
import { GeoUtils } from '../utils/GeoUtils';
import { unitLabel, convertUnit } from '../utils/units';
import { NetWindBar } from './NetWindBar';

export class SegmentTable {
    constructor() {
        this.container = $('segmentDetails');
        this.body = $('segmentTableBody');
        this.netWindBar = new NetWindBar();
    }

    render(state) {
        const rows = this.compute(state.analysis.segments);
        const { unitSystem } = state;
        const speed = unitLabel(unitSystem, 'speed');
        const elev = unitLabel(unitSystem, 'elev');
        if (!rows.length) {
            this.container.classList.add('hidden');
            return;
        }
        this.container.classList.remove('hidden');
        const maxAbs = Math.max(...rows.map(r => Math.abs(r.headComp)), 1e-6);
        this.body.innerHTML = rows.map(row => {
            const colorClass = row.headComp > 0.5 ? 'text-red-600' : row.headComp < -0.5 ? 'text-green-600' : '';
            const dotClass = row.type === 'headwind' ? 'bg-red-600' : row.type === 'tailwind' ? 'bg-green-600' : 'bg-amber-600';
            const elevVal = row.elevation !== null ? convertUnit(row.elevation, 'elev', unitSystem).toFixed(0) + '\u00a0' + elev : '-';
            const bar = this.netWindBar.render(row.headComp, maxAbs);
            return `<tr class="even:bg-gray-50">
                <td>${row.index}</td>
                <td>${row.bearing.toFixed(0)}\u00b0 <span class="text-[0.68rem] text-gray-500">${GeoUtils.windLabel(row.bearing)}</span></td>
                <td><div class="flex items-center gap-2 min-w-0">${bar}<span class="${colorClass} whitespace-nowrap">${row.headComp.toFixed(1)}\u00a0${speed}</span></div></td>
                <td>${row.crossComp.toFixed(1)}\u00a0${speed}</td>
                <td>${elevVal}</td>
                <td><span class="inline-block size-2 rounded-full mr-1.5 align-middle ${dotClass}"></span>${row.type.charAt(0).toUpperCase() + row.type.slice(1)}</td>
            </tr>`;
        }).join('');
    }

    hide() {
        this.container.classList.add('hidden');
    }

    compute(segments) {
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
                const type = avgHead > 2 ? 'headwind' : avgHead < -2 ? 'tailwind' : 'crosswind';
                rows.push({ index: rows.length + 1, bearing: avgBrng, headComp: avgHead, crossComp: avgCross, elevation: lastEle, type });
                bucketDist = 0; bucketHeadW = 0; bucketCrossW = 0; bucketBrngX = 0; bucketBrngY = 0;
                nextInterval += 1000;
            }
        }
        if (bucketDist > 100) {
            const avgHead = bucketHeadW / bucketDist;
            const avgCross = bucketCrossW / bucketDist;
            const avgBrng = (GeoUtils.toDeg(Math.atan2(bucketBrngY, bucketBrngX)) + 360) % 360;
            const type = avgHead > 2 ? 'headwind' : avgHead < -2 ? 'tailwind' : 'crosswind';
            rows.push({ index: rows.length + 1, bearing: avgBrng, headComp: avgHead, crossComp: avgCross, elevation: lastEle, type });
        }
        return rows;
    }
}

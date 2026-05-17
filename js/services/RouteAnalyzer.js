import { GeoUtils } from '../utils/GeoUtils';
import { NO_WIND_THRESHOLD, WindType } from '../constants';

export class RouteAnalyzer {
    analyze(points, windData, startIdx, avgSpeed) {
        const segments = [];
        const weatherMarkers = [];
        let totalDist = 0, headwindDist = 0, tailwindDist = 0, crosswindDist = 0, calmDist = 0;
        let weightedHeadwind = 0, weightedCrosswind = 0;
        let elevGain = 0, elevLoss = 0, cumDist = 0;
        let prevWIdx = -1;
        const baseSpeed = avgSpeed / 3.6;
        const maxIdx = windData.speeds.length - 1;
        const smoothedEle = GeoUtils.smoothElevations(points);

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i], p2 = points[i + 1];
            const dist = GeoUtils.haversine(p1.lat, p1.lon, p2.lat, p2.lon);
            if (dist < 0.5) continue;
            const wIdx = Math.min(startIdx + Math.floor((cumDist / baseSpeed) / 3600), maxIdx);
            if (wIdx !== prevWIdx) {
                weatherMarkers.push({
                    lat: p1.lat, lon: p1.lon,
                    weatherCode: windData.codes[wIdx],
                    temp: windData.temps[wIdx],
                    hour: wIdx,
                });
                prevWIdx = wIdx;
            }
            const windSpeed = windData.speeds[wIdx];
            const windDir = windData.dirs[wIdx];
            const brng = GeoUtils.bearing(p1.lat, p1.lon, p2.lat, p2.lon);
            const relAngle = GeoUtils.toRad(windDir - brng);
            const headComp = windSpeed * Math.cos(relAngle);
            const crossComp = windSpeed * Math.sin(relAngle);
            const headFactor = Math.cos(relAngle);
            const absH = Math.abs(headComp);
            const absC = Math.abs(crossComp);
            let type;
            if (absH < NO_WIND_THRESHOLD && absC < NO_WIND_THRESHOLD) {
                type = WindType.CALM;
            } else if (absH < NO_WIND_THRESHOLD) {
                type = WindType.CROSSWIND;
            } else if (headComp > 0) {
                type = WindType.HEADWIND;
            } else {
                type = WindType.TAILWIND;
            }
            if (type === WindType.HEADWIND) headwindDist += dist;
            else if (type === WindType.TAILWIND) tailwindDist += dist;
            else if (type === WindType.CROSSWIND) crosswindDist += dist;
            else calmDist += dist;
            if (type !== WindType.CALM) {
                weightedHeadwind += headComp * dist;
            }
            weightedCrosswind += Math.abs(crossComp) * dist;
            cumDist += dist;
            totalDist += dist;
            const ele1 = smoothedEle[i], ele2 = smoothedEle[i + 1];
            if (ele1 !== null && ele2 !== null) {
                const diff = ele2 - ele1;
                if (diff > 0) elevGain += diff; else elevLoss += Math.abs(diff);
            }
            segments.push({ p1, p2, dist, brng, headComp, crossComp, headFactor, type });
        }

        const elevations = points.map(p => p.ele).filter(e => e !== null);
        return {
            segments, totalDist, weatherMarkers,
            avgHead: totalDist > 0 ? weightedHeadwind / totalDist : 0,
            avgCross: totalDist > 0 ? weightedCrosswind / totalDist : 0,
            pctHead: totalDist > 0 ? headwindDist / totalDist * 100 : 0,
            pctTail: totalDist > 0 ? tailwindDist / totalDist * 100 : 0,
            pctCross: totalDist > 0 ? crosswindDist / totalDist * 100 : 0,
            pctCalm: totalDist > 0 ? calmDist / totalDist * 100 : 0,
            elevGain, elevLoss,
            maxEle: elevations.length ? Math.max(...elevations) : null,
            minEle: elevations.length ? Math.min(...elevations) : null,
        };
    }
}

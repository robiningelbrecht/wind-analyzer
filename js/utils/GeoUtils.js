import { WIND_LABELS, BEAUFORT_SCALE, WindType } from '../constants';

export class GeoUtils {
    static toRad(d) { return d * Math.PI / 180; }
    static toDeg(r) { return r * 180 / Math.PI; }

    static windLabel(deg) {
        return WIND_LABELS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
    }

    static beaufort(kmh) {
        return BEAUFORT_SCALE.find(b => kmh < b.maxKmh) || BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
    }

    static bearing(lat1, lon1, lat2, lon2) {
        const dLon = GeoUtils.toRad(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(GeoUtils.toRad(lat2));
        const x = Math.cos(GeoUtils.toRad(lat1)) * Math.sin(GeoUtils.toRad(lat2))
                - Math.sin(GeoUtils.toRad(lat1)) * Math.cos(GeoUtils.toRad(lat2)) * Math.cos(dLon);
        return (GeoUtils.toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    static haversine(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = GeoUtils.toRad(lat2 - lat1), dLon = GeoUtils.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(GeoUtils.toRad(lat1)) * Math.cos(GeoUtils.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    static segmentColor(headFactor) {
        const norm = (headFactor + 1) / 2;
        if (norm <= 0.5) {
            const t = norm / 0.5;
            return `rgb(${Math.round(76 + 175 * t)},${Math.round(217 - 26 * t)},${Math.round(100 - 64 * t)})`;
        }
        const t = (norm - 0.5) / 0.5;
        return `rgb(${Math.round(251 - 12 * t)},${Math.round(191 - 123 * t)},${Math.round(36 + 32 * t)})`;
    }

    /** Route / strip color: neutral gray for calm segments. */
    static segmentRouteColor(seg) {
        if (seg.type === WindType.CALM) return 'rgb(156, 163, 175)';
        return GeoUtils.segmentColor(seg.headFactor);
    }

    static smoothElevations(points) {
        const eles = points.map(p => p.ele);
        const diffs = [];
        for (let i = 0; i < eles.length - 1; i++) {
            if (eles[i] !== null && eles[i + 1] !== null) diffs.push(Math.abs(eles[i + 1] - eles[i]));
        }
        if (!diffs.length) return eles;
        const medianNoise = diffs.slice().sort((a, b) => a - b)[Math.floor(diffs.length / 2)];
        const windowSize = Math.max(1, Math.round(medianNoise ** 2 * 65)) | 1;
        if (windowSize <= 1) return eles;

        const half = Math.floor(windowSize / 2);
        const smoothed = [];
        for (let i = 0; i < points.length; i++) {
            if (eles[i] === null) { smoothed.push(null); continue; }
            let sum = 0, count = 0;
            for (let j = Math.max(0, i - half); j <= Math.min(points.length - 1, i + half); j++) {
                if (eles[j] !== null) { sum += eles[j]; count++; }
            }
            smoothed.push(count > 0 ? sum / count : null);
        }
        return smoothed;
    }

}

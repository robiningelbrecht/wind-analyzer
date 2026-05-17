import { GeoUtils } from '../utils/GeoUtils';
import { TILE_DARK, TILE_LIGHT, WEATHER_CODES, WEATHER_ICONS } from '../constants';
import { unitLabel } from '../utils/units';
import { state as appState } from '../state';

export class LeafletMap {
    constructor() {
        this.map = null;
        this.tileLayer = null;
        this.layerGroup = null;
        this.windOverlayGroup = null;
        this.weatherOverlayGroup = null;
        this.cachedWindDir = 0;
        this.hoverMarker = null;
        this.routeBounds = null;
    }

    createWindArrowIcon(blowsTo) {
        return L.divIcon({
            className: 'wind-arrow-marker',
            html: `<svg viewBox="0 0 24 24" width="24" height="24" style="transform:rotate(${blowsTo}deg)"><path d="M12 2 L16.5 11 L12 8.5 L7.5 11 Z" fill="#FC4C02" fill-opacity="0.35"/></svg>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });
    }

    updateWindOverlay() {
        if (!this.map || !this.windOverlayGroup) return;
        this.windOverlayGroup.clearLayers();
        if (!this.map.hasLayer(this.windOverlayGroup)) return;
        const bounds = this.map.getBounds();
        const rows = 5, cols = 5;
        const latStep = (bounds.getNorth() - bounds.getSouth()) / (rows + 1);
        const lonStep = (bounds.getEast() - bounds.getWest()) / (cols + 1);
        const arrowDir = (this.cachedWindDir + 180) % 360;
        for (let i = 1; i <= rows; i++)
            for (let j = 1; j <= cols; j++)
                L.marker(
                    [bounds.getSouth() + i * latStep, bounds.getWest() + j * lonStep],
                    { icon: this.createWindArrowIcon(arrowDir), interactive: false }
                ).addTo(this.windOverlayGroup);
    }

    addOverlayToggle(layerGroup, title, label, { onShow } = {}) {
        const self = this;
        const Toggle = L.Control.extend({
            options: { position: 'topright' },
            onAdd() {
                const btn = L.DomUtil.create('div', 'map-overlay-toggle active');
                btn.innerHTML = `${title}<br><span class="toggle-label">${label}</span>`;
                btn.title = `Toggle ${title.toLowerCase()} overlay`;
                L.DomEvent.disableClickPropagation(btn);
                btn.addEventListener('click', () => {
                    const visible = self.map.hasLayer(layerGroup);
                    btn.classList.toggle('active', !visible);
                    if (visible) self.map.removeLayer(layerGroup);
                    else { layerGroup.addTo(self.map); onShow?.(); }
                });
                return btn;
            }
        });
        this.map.addControl(new Toggle());
    }

    renderRoute(segments) {
        segments.forEach(seg => {
            const line = L.polyline(
                [[seg.p1.lat, seg.p1.lon], [seg.p2.lat, seg.p2.lon]],
                { color: GeoUtils.segmentRouteColor(seg), weight: 4, opacity: 0.9 }
            );
            this.layerGroup.addLayer(line);
        });
    }

    renderStartEnd(latlngs) {
        this.routeBounds = L.latLngBounds(latlngs).pad(0.1);
        this.map.fitBounds(this.routeBounds);
        L.circleMarker(latlngs[0], {
            radius: 7, color: '#303030', fillColor: '#4cd964', fillOpacity: 1, weight: 2.5
        }).bindTooltip('Start').addTo(this.map);
        L.circleMarker(latlngs[latlngs.length - 1], {
            radius: 7, color: '#303030', fillColor: '#FC4C02', fillOpacity: 1, weight: 2.5
        }).bindTooltip('End').addTo(this.map);
    }

    addRecenterControl() {
        const self = this;
        const Recenter = L.Control.extend({
            options: { position: 'topleft' },
            onAdd() {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const link = L.DomUtil.create('a', 'leaflet-control-recenter', container);
                link.href = '#';
                link.title = 'Re-center route';
                link.setAttribute('role', 'button');
                link.setAttribute('aria-label', 'Re-center route');
                link.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>';
                L.DomEvent.on(link, 'click', L.DomEvent.stop)
                          .on(link, 'click', () => self.map.fitBounds(self.routeBounds));
                return container;
            }
        });
        this.map.addControl(new Recenter());
    }

    renderWindOverlay(wDir, wSpeed, speed) {
        this.windOverlayGroup = L.layerGroup().addTo(this.map);
        this.cachedWindDir = wDir;
        const windLabel = `${GeoUtils.windLabel(wDir)} ${wSpeed} ${speed}`;
        this.addOverlayToggle(this.windOverlayGroup, 'Wind', windLabel, {
            onShow: () => this.updateWindOverlay()
        });
        this.map.on('moveend', () => this.updateWindOverlay());
        this.updateWindOverlay();
    }

    renderWeatherOverlay(weatherMarkers) {
        this.weatherOverlayGroup = L.layerGroup().addTo(this.map);
        if (weatherMarkers) {
            weatherMarkers.forEach(marker => {
                const icon = WEATHER_ICONS[marker.weatherCode] || '';
                const divIcon = L.divIcon({
                    className: 'weather-pill-marker',
                    html: `<span>${icon} ${Math.round(marker.temp)}°</span>`,
                    iconSize: null, iconAnchor: [0, 14]
                });
                L.marker([marker.lat, marker.lon], { icon: divIcon, interactive: false })
                    .addTo(this.weatherOverlayGroup);
            });
        }
        const firstMarker = weatherMarkers?.[0];
        const label = firstMarker
            ? (WEATHER_ICONS[firstMarker.weatherCode] || '') + ' ' + (WEATHER_CODES[firstMarker.weatherCode] || '')
            : 'Weather';
        this.addOverlayToggle(this.weatherOverlayGroup, 'Weather', label);
    }

    render(state) {
        const { points, analysis, windDir: wDir, windSpeed: wSpeed, unitSystem } = state;
        const speed = unitLabel(unitSystem, 'speed');
        if (this.map) { this.map.remove(); this.map = null; }
        this.map = L.map('map');
        this.tileLayer = L.tileLayer(appState.isDarkMode ? TILE_DARK : TILE_LIGHT, {
            attribution: '&copy; OSM &copy; CARTO'
        }).addTo(this.map);
        this.layerGroup = L.layerGroup().addTo(this.map);

        this.renderRoute(analysis.segments);
        const latlngs = points.map(p => [p.lat, p.lon]);
        this.renderStartEnd(latlngs);
        this.addRecenterControl();
        this.renderWindOverlay(wDir, wSpeed, speed);
        this.renderWeatherOverlay(analysis.weatherMarkers);
    }

    updateTiles() {
        if (this.map && this.tileLayer) {
            this.tileLayer.setUrl(appState.isDarkMode ? TILE_DARK : TILE_LIGHT);
        }
    }

    showHoverMarker(lat, lon, seg) {
        if (!this.map) return;
        const fill = GeoUtils.segmentRouteColor(seg);
        if (!this.hoverMarker) {
            this.hoverMarker = L.circleMarker([lat, lon], {
                radius: 7, color: '#fff', fillColor: fill,
                fillOpacity: 1, weight: 2
            }).addTo(this.map);
        } else {
            this.hoverMarker.setLatLng([lat, lon]);
            this.hoverMarker.setStyle({ fillColor: fill });
        }
    }

    removeHoverMarker() {
        if (this.hoverMarker && this.map) {
            this.map.removeLayer(this.hoverMarker);
            this.hoverMarker = null;
        }
    }

    destroy() {
        if (this.map) { this.map.remove(); this.map = null; }
    }
}

const STYLE_BRAND = 'color: #FC5201; font-family: monospace;';
const STYLE_LABEL = 'color: #FC5201; font-weight: bold;';
const STYLE_SUB = 'color: gray; font-size: 11px;';
const STYLE_ERR = 'color: #dc2626; font-weight: bold;';

const BANNER = [
    ' __          ___           _          _                    _ ',
    ' \\ \\        / (_)         | |   /\\   | |                  | |',
    '  \\ \\  /\\  / / _ _ __   __| |  /  \\  | |__   ___  __ _  __| |',
    '   \\ \\/  \\/ / | | \'_ \\ / _` | / /\\ \\ | \'_ \\ / _ \\/ _` |/ _` |',
    '    \\  /\\  /  | | | | | (_| |/ ____ \\| | | |  __/ (_| | (_| |',
    '     \\/  \\/   |_|_| |_|\\__,_/_/    \\_\\_| |_|\\___|\\__,_|\\__,_|',
].join('\n');

export class Debug {
    constructor(state) {
        this.state = state;
        console.log('%c' + BANNER, STYLE_BRAND);
        console.log('%cWind analyzer for cycling and running routes', STYLE_SUB);
        this.logEnv();
    }

    logEnv() {
        this.log('Environment', {
            'User Agent': navigator.userAgent,
            'Platform': navigator.platform,
            'Language': navigator.language,
            'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'Viewport': `${window.innerWidth}x${window.innerHeight}`,
            'Screen': `${screen.width}x${screen.height} @${devicePixelRatio}x`,
            'Theme': this.state.isDarkMode ? 'dark' : 'light',
            'Unit System': this.state.unitSystem,
            'Weather model': this.state.weatherModel,
            'Touch': 'ontouchstart' in window,
        });
    }

    logUpload(file, parsed) {
        const hasElevation = parsed.points.some(p => p.ele !== null);
        this.log('GPX Upload', {
            'File name': file.name,
            'File size': (file.size / 1024).toFixed(1) + ' KB',
            'Route name': parsed.name || '(none)',
            'Track points': parsed.points.length,
            'Has elevation': hasElevation,
        });
    }

    logAnalysis(params) {
        const { lat, lon, dateStr, unitSystem, weatherModel, weather, analysis, data } = params;
        this.log('Analysis', {
            'Centroid': `${lat}, ${lon}`,
            'Date': dateStr,
            'Unit system': unitSystem,
            'Weather model': weatherModel,
            'Segments': analysis.segments.length,
            'Total distance': (analysis.totalDist / 1000).toFixed(2) + ' km',
            'Headwind': analysis.pctHead.toFixed(1) + '%',
            'Tailwind': analysis.pctTail.toFixed(1) + '%',
            'Crosswind': analysis.pctCross.toFixed(1) + '%',
            'Negligible': (analysis.pctCalm ?? 0).toFixed(1) + '%',
        });
        this.log('Open-Meteo data', {
            'Request': { lat, lon, date: dateStr, unitSystem, weatherModel },
            'Extracted hour': weather,
            'Full hourly response': data.hourly,
        });
    }

    logError(context, err) {
        console.groupCollapsed('%c[WindAhead] Error: ' + context, STYLE_ERR);
        console.error(err);
        if (err.stack) console.log(err.stack);
        console.groupEnd();
    }

    log(title, data) {
        console.groupCollapsed('%c[WindAhead] ' + title, STYLE_LABEL);
        Object.entries(data).forEach(([key, value]) => console.log(key + ':', value));
        console.groupEnd();
    }

    snapshot() {
        const snap = {
            timestamp: new Date().toISOString(),
            url: location.href,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            screen: `${screen.width}x${screen.height} @${devicePixelRatio}x`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            state: {
                view: this.state.view,
                unitSystem: this.state.unitSystem,
                weatherModel: this.state.weatherModel,
                dateTime: this.state.dateTime,
                avgSpeed: this.state.avgSpeed,
                routeName: this.state.routeName,
                centroid: this.state.centroid,
                pointCount: this.state.points?.length || 0,
                segmentCount: this.state.analysis?.segments?.length || 0,
                weather: this.state.weather,
                windDir: this.state.windDir,
                windSpeed: this.state.windSpeed,
            },
        };
        const json = JSON.stringify(snap, null, 2);
        console.log('%c[WindAhead] Debug Snapshot — copy the JSON below:', STYLE_LABEL);
        console.log(json);
        return snap;
    }
}

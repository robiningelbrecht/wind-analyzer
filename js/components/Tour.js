import { driver } from 'driver.js';

export class Tour {
    run() {
        const tour = driver({
            showProgress: true,
            popoverClass: 'driver-popover',
            steps: [
                { element: '[data-driver="input"]', popover: { title: 'Ride setup', description: 'Pick when you plan to ride and set your average speed. The analysis updates automatically. To compare numerical forecast models, open the main menu.', side: 'bottom' } },
                { element: '[data-driver="map"]', popover: { title: 'Route Map', description: 'Your route colored by wind effect: green = tailwind, red = headwind, amber = crosswind, gray = negligible. Toggle the wind overlay arrows in the top-right.', side: 'bottom' } },
                { element: '[data-driver="strip"]', popover: { title: 'Wind Strip', description: 'A minimap of wind along your route. Hover to see details and a marker on the map.', side: 'top' } },
                { element: '[data-driver="breakdown"]', popover: { title: 'Wind Breakdown', description: 'Share of distance in headwind, tailwind, crosswind, and negligible (too light to matter along your direction of travel).', side: 'top' } },
                { element: '[data-driver="rose"]', popover: { title: 'Wind Rose', description: 'Shows which directions your route travels. Petal size = distance, color = wind effect. The orange arrow shows wind direction.', side: 'top' } },
                { element: '[data-driver="weather"]', popover: { title: 'Weather Conditions', description: 'Forecast details for the selected hour: temperature, humidity, precipitation, wind speed & gusts with compass.', side: 'top' } },
                { element: '[data-driver="segments"]', popover: { title: 'Segment Details', description: 'A per-kilometer table with bearing, net wind (inline bar: red = head, green = tail), crosswind, and elevation for each km.', side: 'top' } },
            ]
        });
        tour.drive();
    }
}

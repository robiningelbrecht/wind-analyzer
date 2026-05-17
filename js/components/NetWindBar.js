export class NetWindBar {
    render(headComp, maxAbs, isCalm = false) {
        if (isCalm) {
            return `<div class="relative isolate h-2.5 w-18 shrink-0 rounded-sm bg-gray-200/90 dark:bg-gray-600/50" role="presentation">
        <div class="pointer-events-none absolute left-1/2 top-0 bottom-0 z-1 w-px bg-gray-500/70"></div></div>`;
        }
        const scale = Math.max(maxAbs, 1e-6);
        const pct = Math.min(50, (Math.abs(headComp) / scale) * 50);
        const head = headComp > 0.05
            ? `<div class="absolute top-0.5 bottom-0.5 right-1/2 z-0 bg-red-600 rounded-l-sm" style="width:${pct}%"></div>`
            : headComp < -0.05
                ? `<div class="absolute top-0.5 bottom-0.5 left-1/2 z-0 bg-green-600 rounded-r-sm" style="width:${pct}%"></div>`
                : '';
        return `<div class="relative isolate h-2.5 w-18 shrink-0 rounded-sm bg-gray-200/90 dark:bg-gray-600/50" role="presentation">${head}
        <div class="pointer-events-none absolute left-1/2 top-0 bottom-0 z-1 w-px bg-gray-500/70"></div></div>`;
    }
}

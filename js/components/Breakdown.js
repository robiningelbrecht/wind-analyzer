import { $ } from '../state';

const ARC_STROKE_SPECS = [
    ['head', 'stroke-red-600'],
    ['tail', 'stroke-green-600'],
    ['cross', 'stroke-amber-600'],
    ['calm', 'stroke-gray-400'],
];

/** @returns {boolean} true when pct would render as something other than 0%. */
function isNonZeroDisplayPct(pct) {
    return Number((pct ?? 0).toFixed(0)) > 0;
}

export class Breakdown {
    constructor() {
        this.svg = $('breakdownDonut');
        this.arcs = { head: null, tail: null, cross: null, calm: null };
        this.dominantPct = $('dominantPct');
        this.dominantType = $('dominantType');
        this.headText = $('pctHeadText');
        this.tailText = $('pctTailText');
        this.crossText = $('pctCrossText');
        this.calmText = $('pctCalmText');
        this.headRow = this.headText?.parentElement;
        this.tailRow = this.tailText?.parentElement;
        this.crossRow = this.crossText?.parentElement;
        this.calmRow = this.calmText?.parentElement;
    }

    createArc(strokeColorClass) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', '18');
        c.setAttribute('cy', '18');
        c.setAttribute('r', '15.9155');
        c.setAttribute('stroke-dasharray', '0 100');
        c.setAttribute('stroke-dashoffset', '25');
        c.classList.add(
            'fill-none', 'stroke-[3.5]', '[stroke-linecap:round]', '[transition:stroke-dasharray_0.6s_ease]',
            strokeColorClass
        );
        return c;
    }

    clearArcs() {
        for (const key of Object.keys(this.arcs)) {
            const el = this.arcs[key];
            if (el) el.remove();
            this.arcs[key] = null;
        }
    }

    render(state) {
        const { pctHead, pctTail, pctCross } = state.analysis;
        const pctCalm = state.analysis.pctCalm ?? 0;
        const pctByKey = { head: pctHead, tail: pctTail, cross: pctCross, calm: pctCalm };

        this.clearArcs();
        let cum = 0;
        for (const [key, colorClass] of ARC_STROKE_SPECS) {
            const pct = pctByKey[key];
            if (pct > 0) {
                const arc = this.createArc(colorClass);
                arc.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
                arc.setAttribute('stroke-dashoffset', String(25 - cum));
                this.svg.appendChild(arc);
                this.arcs[key] = arc;
            }
            cum += pct;
        }

        const maxPct = Math.max(pctHead, pctTail, pctCross, pctCalm);
        let dominant, colorClass;
        if (pctHead === maxPct) { dominant = 'Headwind'; colorClass = 'text-red-600'; }
        else if (pctTail === maxPct) { dominant = 'Tailwind'; colorClass = 'text-green-600'; }
        else if (pctCross === maxPct) { dominant = 'Crosswind'; colorClass = 'text-amber-600'; }
        else { dominant = 'Negligible'; colorClass = 'text-gray-500'; }
        const dominantVal = maxPct.toFixed(0);

        this.dominantPct.className = `text-[1.4rem] font-extrabold leading-[1.1] ${colorClass}`;
        this.dominantPct.textContent = dominantVal + '%';
        this.dominantType.textContent = dominant;
        const rows = [
            [this.headRow, this.headText, pctHead],
            [this.tailRow, this.tailText, pctTail],
            [this.crossRow, this.crossText, pctCross],
            [this.calmRow, this.calmText, pctCalm],
        ];
        for (const [row, textEl, pct] of rows) {
            const show = isNonZeroDisplayPct(pct);
            row?.classList.toggle('hidden', !show);
            if (textEl) textEl.textContent = show ? (pct ?? 0).toFixed(0) + '%' : '';
        }
    }
}

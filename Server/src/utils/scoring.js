const SUB_BUCKETS = {
    theoretical: ['definition', 'mechanism', 'relation'],
    practical: ['example', 'application', 'edge_case'],
};

export const TYPE_TO_AXIS = {
    definition: 'theoretical',
    mechanism: 'theoretical',
    relation: 'theoretical',
    example: 'practical',
    application: 'practical',
    edge_case: 'practical',
    analogy: 'practical',
};

function scoreSide(evidence, subBuckets) {
    if (!evidence || evidence.length === 0) return 0;
    const totalQuality = evidence.reduce((s, e) => s + (Number(e.quality) || 0), 0);
    const avgQuality = totalQuality / evidence.length;
    const baseScore = (avgQuality / 3) * 100;
    const coveredBuckets = subBuckets.filter(b => evidence.some(e => e.type === b)).length;
    const coverageBonus = coveredBuckets / subBuckets.length;
    return Math.max(0, Math.min(100, Math.round(baseScore * coverageBonus)));
}

function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

export function bandFor(score) {
    if (score >= 85) return 'mastered';
    if (score >= 70) return 'proficient';
    if (score >= 50) return 'developing';
    if (score >= 25) return 'emerging';
    return 'not_yet';
}

export function computeAxisScores(session) {
    const theo = session.theoreticalEvidence || {};
    const prac = session.practicalEvidence || {};
    const concepts = session.conceptTree || [];

    const perConcept = concepts.map((c) => {
        const tEv = Array.isArray(theo[c.id]) ? theo[c.id] : [];
        const pEv = Array.isArray(prac[c.id]) ? prac[c.id] : [];
        const theoretical = scoreSide(tEv, SUB_BUCKETS.theoretical);
        const practical = scoreSide(pEv, SUB_BUCKETS.practical);
        return {
            id: c.id,
            name: c.name,
            theoretical,
            practical,
            theoretical_band: bandFor(theoretical),
            practical_band: bandFor(practical),
            evidence_count: tEv.length + pEv.length,
        };
    });

    const overallTheoretical = avg(perConcept.map(p => p.theoretical));
    const overallPractical = avg(perConcept.map(p => p.practical));
    const gap = overallTheoretical - overallPractical;

    let gapLabel;
    if (gap > 20) gapLabel = 'theory_heavy';
    else if (gap < -20) gapLabel = 'practice_heavy';
    else gapLabel = 'balanced';

    return {
        perConcept,
        overallTheoretical,
        overallPractical,
        gap,
        gapLabel,
    };
}

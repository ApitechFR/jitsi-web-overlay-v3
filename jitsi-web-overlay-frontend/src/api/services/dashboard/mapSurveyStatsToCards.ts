import type { CardDataFeedback } from './dashboard.types';

/**
 * Data mapping for survey statistics to card format.
 * Can be enriched according to display needs.
 */
export function mapSurveyStatsToCards(data: CardDataFeedback) {

    const cards = [];
    if (data.total > 0) {
        cards.push({
            key: 'total',
            description: '',
            label: 'Nombre total de réponses',
            valeur: data.total,
        });
    }
    if (data.rating) {
        for (const [question, ratingData] of Object.entries(data.rating)) {
            cards.push({
                key: question,
                description: question,
                label: 'Moyenne notes',
                valeur: ratingData.moy,
            });
        }
    }
    return cards;
}


export type CardDataFeedback = {
    total: number;
    rating?: Record<string, any>;
    radio?: Record<string, any>;
    // text comments with their counts
    text?: Record<string, { count: number }>;
};

export type PeriodFilter = "today" | "week" | "month" | "year";

export type DateFilters = {
    startDate: string;
    endDate: string;
};

export type QuestionTextTableProps = {
    question: string;
    organization: string;
    filter: PeriodFilter;
    limitPerPage: number;
    dateFilters: DateFilters;
};
export type CardData = {
    key: string;
    description: string;
    label: string;
    valeur?: string | number;
    question?: string;
};

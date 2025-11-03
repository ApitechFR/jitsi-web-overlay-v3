export interface FeedbackType {
    id: number;
    name: string;
    description: string;
}

export interface Feedback {
    id: number;
}

export interface FeedbackTemplate {
    id: number;
    label: string;
    organization: string;
    choices: string[];
    deletedAt: string | null;
    feedbacks: Feedback[];
    type: FeedbackType;
}

export interface CreateFeedbackDTO {
    conferenceUuid: string;
    date: string;
    userAgent: string;
    feedbackTemplateId: number;
    reponse: string;
}

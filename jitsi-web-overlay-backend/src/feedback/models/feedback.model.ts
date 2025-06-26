export const FeedbackModel = {
    clientID: { type: Number, required: false },
    room: { type: String, required: false },
    evaluation: { type: Number, required: true },
    comment: { type: String, required: false },
    userAgent: { type: String, required: false },
    jmmc_id: { type: String, required: false },
    ip: { type: Number, required: false },
};

import { FeedbackDTO } from '../DTOs/feedback.dto';

export function mapDtoToFeedbackEntity(dto: FeedbackDTO, ip: string, jmmc_id?: string) {
    return {
        evaluation: dto.rt.qty,
        inv: dto.rt.inv,
        comment: dto.com,
        isVPN: dto.isVPN,
        ip: ipToInt(ip),
        jmmc_id,
    };
}

function ipToInt(ip: string): number {
    return (
        ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
}

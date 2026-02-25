import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CurrentClient } from '../decorators/current-client.decorator';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { OfferChangeService } from '../services/offer-change.service';
import { OfferChangePreviewDto, OfferChangeResponseDto, PaginatedResponseDto } from '../dto/response.dto';
import { PaginationDto } from '../dto/shared.dto';

@Controller('reseller')
@UseGuards(ApiKeyGuard)
export class OfferChangeController {
  constructor(private readonly offerChangeService: OfferChangeService) {}

  /**
   * GET /reseller/clients/:clientId/offer-changes
   * Get offer change history for a client
   */
  @Get('clients/:clientId/offer-changes')
  @HttpCode(HttpStatus.OK)
  async getChangeHistory(
    @Param('clientId') clientId: string,
    @Query() pagination: PaginationDto,
    @CurrentClient() resellerId: string,
  ): Promise<PaginatedResponseDto<{ id: number; status: string; fromOffer: string; toOffer: string; createdAt: Date }>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const { data, total } = await this.offerChangeService.getChangeHistory(
      clientId,
      resellerId,
      page,
      limit,
    );

    const pages = Math.ceil(total / limit);

    return {
      data: data.map((change) => ({
        id: change.id,
        status: change.status,
        fromOffer: change.fromOffer,
        toOffer: change.toOffer,
        createdAt: change.createdAt,
      })),
      total,
      page,
      limit,
      pages,
    };
  }

  /**
   * GET /reseller/offer-changes/:changeId
   * Preview what will happen with an offer change
   */
  @Get('offer-changes/:changeId')
  @HttpCode(HttpStatus.OK)
  async previewChange(
    @Param('changeId') changeId: string,
    @CurrentClient() resellerId: string,
  ): Promise<OfferChangePreviewDto> {
    return this.offerChangeService.previewOfferChange(
      Number.parseInt(changeId, 10),
      resellerId,
    );
  }

  /**
   * POST /reseller/offer-changes/:changeId/apply
   * Apply a pending offer change
   */
  @Post('offer-changes/:changeId/apply')
  @HttpCode(HttpStatus.OK)
  async applyChange(
    @Param('changeId') changeId: string,
    @CurrentClient() resellerId: string,
  ): Promise<OfferChangeResponseDto> {
    return this.offerChangeService.applyOfferChange(
      Number.parseInt(changeId, 10),
      resellerId,
    );
  }

  /**
   * POST /reseller/offer-changes/:changeId/cancel
   * Cancel a pending offer change
   */
  @Post('offer-changes/:changeId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelChange(
    @Param('changeId') changeId: string,
    @CurrentClient() resellerId: string,
  ): Promise<OfferChangeResponseDto> {
    return this.offerChangeService.cancelOfferChange(
      Number.parseInt(changeId, 10),
      resellerId,
    );
  }
}

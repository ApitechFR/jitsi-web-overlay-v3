import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { CurrentClient } from '../decorators/current-client.decorator';
import { ClientService } from '../services/client.service';
import { OfferService } from '../services/offer.service';
import { CreateClientDto, UpdateClientDto, UpgradeClientDto, DowngradeClientDto } from '../dto/client.dto';
import { CustomizationDto, PaginationDto } from '../dto/shared.dto';
import { ClientResponseDto, ClientSummaryDto, PaginatedResponseDto, OfferInfoDto } from '../dto/response.dto';
import { Client } from '../entities/client.entity';

/**
 * Transforms a Client entity to a ClientResponseDto with optional user count
 */
function clientToResponseDto(client: Client, usersCount: number = 0): ClientResponseDto {
  return {
    uid: client.uid,
    name: client.name,
    offerType: client.offerType,
    domains: client.domains?.map((d) => d.domainName) || [],
    modules: client.modules?.map((m) => m.moduleKey) || [],
    customization: client.customization
      ? {
        logo: client.customization.logo,
        logoSmall: client.customization.logoSmall,
        logoDarkMode: client.customization.logoDarkMode,
        favicon: client.customization.favicon,
        appName: client.customization.appName,
      }
      : undefined,
    authConfig: client.authConfig
      ? {
        type: client.authConfig.type,
        oidcUrl: client.authConfig.config?.oidcUrl,
        oidcClientId: client.authConfig.config?.oidcClientId,
        ldapUrl: client.authConfig.config?.ldapUrl,
        ldapBindDn: client.authConfig.config?.ldapBindDn,
        ldapBaseDn: client.authConfig.config?.ldapBaseDn,
      }
      : undefined,
    limits: client.offer
      ? {
        maxParticipants: client.offer.limits?.maxParticipants,
        replayRetentionDays: client.offer.limits?.replayRetentionDays,
      }
      : undefined,
    stats: {
      usersCount: usersCount,
    },
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    deactivatedAt: client.deactivatedAt,
  };
}

/**
 * Transforms a Client entity to a ClientSummaryDto with user count
 */
function clientToSummaryDto(client: Client, usersCount: number = 0): ClientSummaryDto {
  return {
    uid: client.uid,
    name: client.name,
    domains: client.domains?.map((d) => d.domainName) || [],
    offerType: client.offerType,
    usersCount: usersCount,
    isActive: client.isActive,
    createdAt: client.createdAt,
  };
}

@Controller('reseller/clients')
@UseGuards(ApiKeyGuard)
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly offerService: OfferService,
  ) { }

  /**
   * POST /reseller/clients
   * Create a new client for the reseller
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentClient() resellerId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.createClient(createClientDto, resellerId);
    const usersCount = await this.clientService.countUsersByClientId(client.uid);
    return clientToResponseDto(client, usersCount);
  }

  /**
   * GET /reseller/clients
   * List clients for the reseller with pagination
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listClients(
    @Query() pagination: PaginationDto,
    @CurrentClient() resellerId: string,
  ): Promise<PaginatedResponseDto<ClientSummaryDto>> {
    const { data, total } = await this.clientService.findClientsByReseller(
      resellerId,
      pagination,
    );

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const pages = Math.ceil(total / limit);

    // Get user counts for all clients in the list
    const dataWithCounts = await Promise.all(
      data.map(async (client) => {
        const usersCount = await this.clientService.countUsersByClientId(client.uid);
        return clientToSummaryDto(client, usersCount);
      }),
    );

    return {
      data: dataWithCounts,
      total,
      page,
      limit,
      pages,
    };
  }

  /**
   * GET /reseller/clients/:uid
   * Get a specific client by UID
   */
  @Get(':uid')
  @HttpCode(HttpStatus.OK)
  async getClient(
    @Param('uid') uid: string,
    @CurrentClient() resellerId: string,
  ): Promise<ClientResponseDto> {
    const { client, usersCount } = await this.clientService.findClientWithStats(uid, resellerId);
    return clientToResponseDto(client, usersCount);
  }

  /**
   * PATCH /reseller/clients/:uid
   * Update a client (name, domains, customization)
   */
  @Patch(':uid')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('uid') uid: string,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentClient() resellerId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.updateClient(uid, updateClientDto, resellerId);
    const usersCount = await this.clientService.countUsersByClientId(client.uid);
    return clientToResponseDto(client, usersCount);
  }

  /**
   * DELETE /reseller/clients/:uid
   * Soft delete a client (set inactive)
   */
  @Delete(':uid')
  @HttpCode(HttpStatus.OK)
  async deleteClient(
    @Param('uid') uid: string,
    @CurrentClient() resellerId: string,
  ): Promise<{ message: string; uid: string; deactivatedAt: Date }> {
    const client = await this.clientService.deleteClient(uid, resellerId);
    return {
      message: 'Client supprimé avec succès',
      uid: client.uid,
      deactivatedAt: client.deactivatedAt,
    };
  }

  /**
   * DELETE /reseller/clients/:uid/hard-delete
   * Hard delete a client (permanent deletion with all associated data)
   */
  @Delete(':uid/hard-delete')
  @HttpCode(HttpStatus.OK)
  async hardDeleteClient(
    @Param('uid') uid: string,
    @CurrentClient() resellerId: string,
  ): Promise<{ message: string; uid: string }> {
    return this.clientService.hardDeleteClient(uid, resellerId);
  }

  /**
   * POST /reseller/clients/:uid/upgrade
   * Initiate an offer upgrade for a client
   */
  @Post(':uid/upgrade')
  @HttpCode(HttpStatus.OK)
  async upgradeClient(
    @Param('uid') uid: string,
    @Body() upgradeClientDto: UpgradeClientDto,
    @CurrentClient() resellerId: string,
  ): Promise<{ preview: any; appliedAt: Date }> {
    return this.clientService.upgradeClient(uid, upgradeClientDto, resellerId);
  }

  /**
   * POST /reseller/clients/:uid/downgrade
   * Initiate an offer downgrade for a client
   */
  @Post(':uid/downgrade')
  @HttpCode(HttpStatus.OK)
  async downgradeClient(
    @Param('uid') uid: string,
    @Body() downgradeClientDto: DowngradeClientDto,
    @CurrentClient() resellerId: string,
  ): Promise<{ preview: any; appliedAt: Date }> {
    return this.clientService.downgradeClient(uid, downgradeClientDto, resellerId);
  }

  /**
   * GET /reseller/clients/:uid/customization
   * Get customization for a client (premium only)
   */
  @Get(':uid/customization')
  @HttpCode(HttpStatus.OK)
  async getCustomization(
    @Param('uid') uid: string,
    @CurrentClient() resellerId: string,
  ): Promise<any> {
    return this.clientService.getCustomization(uid, resellerId);
  }

  /**
   * PUT /reseller/clients/:uid/customization
   * Update customization for a client (premium only)
   */
  @Put(':uid/customization')
  @HttpCode(HttpStatus.OK)
  async updateCustomization(
    @Param('uid') uid: string,
    @Body() customizationDto: CustomizationDto,
    @CurrentClient() resellerId: string,
  ): Promise<any> {
    return this.clientService.updateCustomization(uid, customizationDto, resellerId);
  }

  /**
   * DELETE /reseller/clients/:uid/customization
   * Delete customization for a client (reset to default)
   */
  @Delete(':uid/customization')
  @HttpCode(HttpStatus.OK)
  async deleteCustomization(
    @Param('uid') uid: string,
    @CurrentClient() resellerId: string,
  ): Promise<{ message: string }> {
    await this.clientService.deleteCustomization(uid, resellerId);
    return { message: 'Customization reset to default' };
  }

  /**
   * GET /reseller/clients/:uid/offer-change/preview
   * Preview offer change for a client
   */
  @Get(':uid/offer-change/preview')
  @HttpCode(HttpStatus.OK)
  async previewOfferChange(
    @Param('uid') uid: string,
    @Query('targetOffer') targetOffer: string,
    @CurrentClient() resellerId: string,
  ): Promise<any> {
    // Offer change preview implementation
    throw new BadRequestException('Offer change preview not yet available');
  }
}

/**
 * Controller for offer management endpoints
 */
@Controller('reseller')
@UseGuards(ApiKeyGuard)
export class OfferController {
  constructor(private readonly offerService: OfferService) { }

  /**
   * GET /reseller/offers
   * List all available offers
   */
  @Get('offers')
  @HttpCode(HttpStatus.OK)
  async getOffers(): Promise<{ offers: OfferInfoDto[] }> {
    const offers = await this.offerService.getAllOffersInfo();
    return { offers };
  }
}

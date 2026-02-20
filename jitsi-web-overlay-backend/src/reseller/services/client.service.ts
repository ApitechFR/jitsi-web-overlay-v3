import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../entities/client.entity';
import { Offer } from '../entities/offer.entity';
import { ClientModule } from '../entities/client-module.entity';
import { ClientDomain } from '../entities/client-domain.entity';
import { ClientCustomization } from '../entities/client-customization.entity';
import { ClientAuthConfig } from '../entities/client-auth-config.entity';
import { ClientOfferChangeHistory } from '../entities/client-offer-change-history.entity';
import { CreateClientDto, UpdateClientDto, UpgradeClientDto, DowngradeClientDto } from '../dto/client.dto';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey, OFFER_MODULES } from '../enums/module-key.enum';
import { EncryptionService } from './encryption.service';
import { PaginationDto } from '../dto/shared.dto';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(ClientModule)
    private readonly clientModuleRepository: Repository<ClientModule>,
    @InjectRepository(ClientDomain)
    private readonly clientDomainRepository: Repository<ClientDomain>,
    @InjectRepository(ClientCustomization)
    private readonly customizationRepository: Repository<ClientCustomization>,
    @InjectRepository(ClientAuthConfig)
    private readonly authConfigRepository: Repository<ClientAuthConfig>,
    @InjectRepository(ClientOfferChangeHistory)
    private readonly offerChangeHistoryRepository: Repository<ClientOfferChangeHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) { }

  /**
   * Create a new client for a reseller
   * Inherits modules from the selected offer
   */
  async createClient(
    createClientDto: CreateClientDto,
    resellerId: string,
  ): Promise<Client> {
    const { name, offerType, domains, customization, authConfig } = createClientDto;

    // Validate offer exists
    const offer = await this.offerRepository.findOne({ where: { type: offerType } });
    if (!offer) {
      throw new BadRequestException(`Offer type ${offerType} not found`);
    }

    // Check client name uniqueness within the reseller
    const existingClient = await this.clientRepository.findOne({
      where: { resellerId, name, isActive: true },
    });
    if (existingClient) {
      throw new ConflictException(
        `A client with the name "${name}" already exists for this reseller`,
      );
    }

    // Check domain uniqueness
    if (domains && domains.length > 0) {
      for (const domainDto of domains) {
        const existingDomain = await this.clientDomainRepository.findOne({
          where: { domainName: domainDto.domain },
        });
        if (existingDomain) {
          throw new ConflictException(
            `Domain ${domainDto.domain} is already assigned to another client`,
          );
        }
      }
    }

    // Create client entity
    const client = new Client();
    client.uid = uuidv4();
    client.name = name;
    client.offerType = offerType;
    client.resellerId = resellerId;
    client.isActive = true;

    // Save client first
    const savedClient = await this.clientRepository.save(client);

    // Assign modules from offer
    const offerModules = OFFER_MODULES[offerType];
    if (offerModules && offerModules.length > 0) {
      const clientModules = offerModules.map((moduleKey) => {
        const mod = new ClientModule();
        mod.clientId = savedClient.id;
        mod.moduleKey = moduleKey;
        mod.enabled = true;
        return mod;
      });
      await this.clientModuleRepository.save(clientModules);
    }

    // Add domains if provided
    if (domains && domains.length > 0) {
      const clientDomains = domains.map((domainDto) => {
        const d = new ClientDomain();
        d.client = savedClient;
        d.domainName = domainDto.domain;
        return d;
      });
      await this.clientDomainRepository.save(clientDomains);
    }

    // Add customization if provided and offer supports it
    if (customization && offer.customizationEnabled) {
      const custom = new ClientCustomization();
      custom.client = savedClient;
      custom.appName = customization.appName;
      custom.favicon = customization.favicon;
      custom.logo = customization.logo;
      custom.logoSmall = customization.logoSmall;
      custom.logoDarkMode = customization.logoDarkMode;
      await this.customizationRepository.save(custom);
    }

    // Add auth config if provided
    if (authConfig) {
      const authCfg = new ClientAuthConfig();
      authCfg.client = savedClient;
      authCfg.type = authConfig.type;
      // Encrypt sensitive config data - convert to JSON string first
      const configJson = JSON.stringify(authConfig);
      const encryptedConfig = this.encryptionService.encrypt(configJson);
      // Store the decrypted config object (encryption is transparent to entity)
      authCfg.config = authConfig;
      await this.authConfigRepository.save(authCfg);
    }

    return this.findClient(savedClient.uid, resellerId);
  }

  /**
   * Find a single client by UID, scoped to reseller
   */
  async findClient(uid: string, resellerId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { uid, resellerId, isActive: true },
      relations: ['offer', 'modules', 'domains', 'customization', 'authConfig'],
    });

    if (!client) {
      throw new NotFoundException(`Client with UID ${uid} not found`);
    }

    return client;
  }

  /**
   * Find clients with pagination, scoped to reseller
   * Supports filtering by offerType, isActive, and search (name/domain)
   */
  async findClientsByReseller(
    resellerId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Client[]; total: number }> {
    const { page = 1, limit = 20, offerType, isActive, search } = pagination;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = { resellerId };

    // Filter by offerType if provided
    if (offerType) {
      where.offerType = offerType;
    }

    // Filter by isActive if provided (default: true)
    if (isActive === undefined) {
      where.isActive = true; // Default: only active clients
    } else {
      where.isActive = isActive;
    }

    const query = this.clientRepository
      .createQueryBuilder('client')
      .where('client.resellerId = :resellerId', { resellerId })
      .andWhere('client.isActive = :isActive', { isActive: where.isActive });

    // Add offerType filter if provided
    if (offerType) {
      query.andWhere('client.offerType = :offerType', { offerType });
    }

    // Add search filter (name or domain) if provided
    if (search) {
      query.leftJoinAndSelect('client.domains', 'domains')
        .andWhere('(client.name LIKE :search OR domains.domainName LIKE :search)', {
          search: `%${search}%`,
        });
    } else {
      query.leftJoinAndSelect('client.domains', 'domains');
    }

    query
      .leftJoinAndSelect('client.offer', 'offer')
      .leftJoinAndSelect('client.modules', 'modules')
      .leftJoinAndSelect('client.customization', 'customization')
      .skip(skip)
      .take(limit)
      .orderBy('client.createdAt', 'DESC');

    const [clients, total] = await query.getManyAndCount();

    return { data: clients, total };
  }

  /**
   * Update client basic info: name, domains, customization
   */
  async updateClient(
    uid: string,
    updateClientDto: UpdateClientDto,
    resellerId: string,
  ): Promise<Client> {
    const client = await this.findClient(uid, resellerId);
    const { name, domains, customization } = updateClientDto;

    // Update name if provided
    if (name !== undefined) {
      client.name = name;
    }

    // Handle domain updates
    if (domains !== undefined) {
      // Check new domains for uniqueness (excluding this client's existing domains)
      const existingDomainNames = new Set((client.domains || []).map((d) => d.domainName));
      const newDomains = domains.filter((d) => !existingDomainNames.has(d.domain));

      for (const domainDto of newDomains) {
        const existingDomain = await this.clientDomainRepository.findOne({
          where: { domainName: domainDto.domain },
        });
        if (existingDomain) {
          throw new ConflictException(
            `Domain ${domainDto.domain} is already assigned to another client`,
          );
        }
      }

      // Remove old domains and add new ones
      await this.clientDomainRepository.delete({ client: { uid } });
      const clientDomains = domains.map((domainDto) => {
        const d = new ClientDomain();
        d.client = client;
        d.domainName = domainDto.domain;
        return d;
      });
      await this.clientDomainRepository.save(clientDomains);
    }

    // Update customization if provided
    if (customization !== undefined) {
      const offer = await this.offerRepository.findOne({
        where: { type: client.offerType },
      });

      if (offer?.customizationEnabled) {
        let custom = client.customization;
        if (!custom) {
          custom = new ClientCustomization();
          custom.client = client;
        }
        custom.appName = customization.appName;
        custom.favicon = customization.favicon;
        custom.logo = customization.logo;
        custom.logoSmall = customization.logoSmall;
        custom.logoDarkMode = customization.logoDarkMode;
        await this.customizationRepository.save(custom);
      } else if (!offer?.customizationEnabled && client.customization) {
        // Remove customization if offer no longer supports it
        await this.customizationRepository.delete({ client: { uid } });
      }
    }

    await this.clientRepository.save(client);
    return this.findClient(uid, resellerId);
  }

  /**
   * Update modules for a client based on offer type
   */
  private async updateModulesForOffer(clientId: number, offerType: OfferType): Promise<void> {
    // Delete existing modules
    await this.clientModuleRepository.delete({ client: { id: clientId } });

    // Add new modules from the offer
    const newModules = OFFER_MODULES[offerType];
    if (newModules && newModules.length > 0) {
      const clientModules = newModules.map((moduleKey) => {
        const mod = new ClientModule();
        mod.clientId = clientId;
        mod.moduleKey = moduleKey;
        mod.enabled = true;
        return mod;
      });
      await this.clientModuleRepository.save(clientModules);
    }
  }

  /**
   * Upgrade client to a higher offer type
   */
  async upgradeClient(
    uid: string,
    upgradeClientDto: UpgradeClientDto,
    resellerId: string,
  ): Promise<{ preview: any; appliedAt: Date }> {
    const client = await this.findClient(uid, resellerId);
    const { toOffer } = upgradeClientDto;

    if (toOffer === client.offerType) {
      throw new BadRequestException(
        'Cannot upgrade to the same offer type',
      );
    }

    // Validate offer exists and is actually an upgrade
    const newOffer = await this.offerRepository.findOne({
      where: { type: toOffer },
    });
    if (!newOffer) {
      throw new BadRequestException(`Offer type ${toOffer} not found`);
    }

    // Simple validation: BASIC-> PREMIUM is upgrade, others check offer priorities
    if (client.offerType === OfferType.PREMIUM) {
      throw new BadRequestException(
        'Cannot upgrade from PREMIUM offer',
      );
    }

    // Update client offer type
    client.offerType = toOffer;
    await this.clientRepository.save(client);

    // Update client modules to match new offer
    await this.updateModulesForOffer(client.id, toOffer);

    // Create offer change history entry
    const history = new ClientOfferChangeHistory();
    history.client = client;
    history.fromOffer = client.offerType;
    history.toOffer = toOffer;
    history.status = 'applied';
    history.effectiveDate = new Date();

    const savedHistory = await this.offerChangeHistoryRepository.save(history);

    // Return preview of changes
    const newModules = OFFER_MODULES[toOffer];
    const preview = {
      currentOffer: client.offerType,
      newOffer: toOffer,
      newModules: newModules,
      affectedAt: new Date(),
    };

    return { preview, appliedAt: savedHistory.effectiveDate };
  }

  /**
   * Downgrade client to a lower offer type
   */
  async downgradeClient(
    uid: string,
    downgradeClientDto: DowngradeClientDto,
    resellerId: string,
  ): Promise<{ preview: any; appliedAt: Date }> {
    const client = await this.findClient(uid, resellerId);
    const { toOffer } = downgradeClientDto;

    if (toOffer === client.offerType) {
      throw new BadRequestException(
        'Cannot downgrade to the same offer type',
      );
    }

    // Validate offer exists
    const newOffer = await this.offerRepository.findOne({
      where: { type: toOffer },
    });
    if (!newOffer) {
      throw new BadRequestException(`Offer type ${toOffer} not found`);
    }

    // Validate downgrade: PREMIUM -> BASIC is downgrade, others not allowed
    if (client.offerType === OfferType.BASIC) {
      throw new BadRequestException(
        'Cannot downgrade from BASIC offer',
      );
    }

    // Update client offer type
    client.offerType = toOffer;
    await this.clientRepository.save(client);

    // Update client modules to match new offer
    await this.updateModulesForOffer(client.id, toOffer);

    // Remove customization if downgrading to BASIC
    if (toOffer === OfferType.BASIC && client.customization) {
      await this.customizationRepository.delete({ client: { id: client.id } });
    }

    // Create offer change history entry
    const history = new ClientOfferChangeHistory();
    history.client = client;
    history.fromOffer = client.offerType;
    history.toOffer = toOffer;
    history.status = 'applied';
    history.effectiveDate = new Date();

    const savedHistory = await this.offerChangeHistoryRepository.save(history);

    // Return preview of changes
    const newModules = OFFER_MODULES[toOffer];
    const preview = {
      currentOffer: client.offerType,
      newOffer: toOffer,
      newModules: newModules,
      affectedAt: new Date(),
    };

    return { preview, appliedAt: savedHistory.effectiveDate };
  }

  /**
   * Soft delete a client (set is_active=false, deactivatedAt=now)
   */
  async deleteClient(uid: string, resellerId: string): Promise<Client> {
    const client = await this.findClient(uid, resellerId);

    client.isActive = false;
    client.deactivatedAt = new Date();

    return await this.clientRepository.save(client);
  }

  /**
   * Hard delete a client (permanent deletion with all associated data)
   * Deletes: client, domains, customization, auth config, modules, users, conferences, etc.
   */
  async hardDeleteClient(uid: string, resellerId: string): Promise<{ message: string; uid: string }> {
    const client = await this.findClient(uid, resellerId);

    // Delete all users associated with this client
    await this.userRepository.delete({ clientId: client.uid });

    // Delete all domains
    await this.clientDomainRepository.delete({ client: { uid } });

    // Delete customization
    if (client.customization) {
      await this.customizationRepository.delete({ client: { uid } });
    }

    // Delete auth config
    if (client.authConfig) {
      await this.authConfigRepository.delete({ client: { uid } });
    }

    // Delete modules
    await this.clientModuleRepository.delete({ client: { uid } });

    // Delete offer change history
    await this.offerChangeHistoryRepository.delete({ client: { uid } });

    // Delete the client itself
    await this.clientRepository.delete({ uid });

    return { message: 'Client supprimé définitivement', uid };
  }

  /**
   * Count active users for a specific client
   */
  async countUsersByClientId(clientId: string): Promise<number> {
    return await this.userRepository.count({
      where: { clientId, isActive: true },
    });
  }

  /**
   * Get client customization (premium only)
   */
  async getCustomization(
    uid: string,
    resellerId: string,
  ): Promise<{ customization: any; offerType: OfferType }> {
    const client = await this.findClient(uid, resellerId);
    const offer = await this.offerRepository.findOne({
      where: { type: client.offerType },
    });

    if (!offer?.customizationEnabled) {
      return {
        customization: null,
        offerType: client.offerType,
      };
    }

    return {
      customization: client.customization || null,
      offerType: client.offerType,
    };
  }

  /**
   * Update client customization (premium only)
   */
  async updateCustomization(
    uid: string,
    customization: any,
    resellerId: string,
  ): Promise<any> {
    const client = await this.findClient(uid, resellerId);
    const offer = await this.offerRepository.findOne({
      where: { type: client.offerType },
    });

    if (!offer?.customizationEnabled) {
      throw new BadRequestException(
        'Customization is only available for premium clients',
      );
    }

    let custom = client.customization;
    if (!custom) {
      custom = new ClientCustomization();
      custom.client = client;
    }

    custom.appName = customization.appName || custom.appName;
    custom.favicon = customization.favicon || custom.favicon;
    custom.logo = customization.logo || custom.logo;
    custom.logoSmall = customization.logoSmall || custom.logoSmall;
    custom.logoDarkMode = customization.logoDarkMode || custom.logoDarkMode;

    await this.customizationRepository.save(custom);
    return custom;
  }

  /**
   * Delete client customization (reset to default)
   */
  async deleteCustomization(uid: string, resellerId: string): Promise<void> {
    const client = await this.findClient(uid, resellerId);

    if (client.customization) {
      await this.customizationRepository.delete({ client: { uid } });
    }
  }

  /**
   * Get client with decrypted auth config (internal use only)
   */
  /**
   * Get client with decrypted auth config (internal use only)
   */
  async getClientWithDecryptedConfig(
    uid: string,
    resellerId: string,
  ): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { uid, resellerId },
      relations: ['authConfig'],
    });

    if (!client) {
      throw new NotFoundException(`Client with UID ${uid} not found`);
    }

    return client;
  }

  /**
   * Get a client by UID with all relations and user count
   */
  async findClientWithStats(
    uid: string,
    resellerId: string,
  ): Promise<{ client: Client; usersCount: number }> {
    const client = await this.findClient(uid, resellerId);
    const usersCount = await this.countUsersByClientId(client.uid);
    return { client, usersCount };
  }
}

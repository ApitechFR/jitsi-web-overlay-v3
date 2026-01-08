import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { In, LessThan, Repository } from 'typeorm';
import { LdapService } from '../ldap/ldap.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly ldapService: LdapService,
  ) { }

  // Create user
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const user = this.userRepository.create(userData);
      return this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('cannot create user');
    }
  }

  // Get all users
  async findAll(): Promise<User[]> {
    try {
      return this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('cannot find users');
    }
  }

  // Get user by ID
  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Cannot find user');
    }
  }

  //find user by email
  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Cannot find user');
    }
  }

  //Update User
  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
      await this.userRepository.update(id, userData);
      return this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Cannot update user');
    }
  }

  //Delete User
  async delete(id: number): Promise<void> {
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Cannot delete user');
    }
  }

  async deleteDeactivatedUsers(date: Date): Promise<{ totalDeleted: number; deletedUserUids: string[]; }> {

    const users = await this.userRepository.find({
      where: {
        isActive: false,
        desactivated_at: LessThan(date),
      },
      select: ['uid'],
    });

    if (!users.length) {
      return { totalDeleted: 0, deletedUserUids: [] };
    }

    const uids = users.map(u => u.uid);

    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .where('uid IN (:...uids)', { uids })
      .execute();

    return {
      totalDeleted: result.affected || 0,
      deletedUserUids: uids,
    };
  }


  async deactivateUser(uid: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { uid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      return user;
    }

    user.isActive = false;
    user.desactivated_at = new Date();

    return await this.userRepository.save(user);
  }


  //-------------------------------------------------------------------------

  async findAllLDAP() {
    const users = await this.ldapService.getAllUsers();
    return users.map(u => ({
      uid: u.uidNumber,
      name: u.cn,
      email: u.Email,
    }));
  }

  async deactivateUsersWithExpiredPassword(
    externalUsers: any[],
  ): Promise<{ checked: number; deactivated: string[] }> {
    const deactivatedUids: string[] = [];

    for (const extUser of externalUsers) {
      if (!this.hasExpiredPassword(extUser)) continue;

      const user = await this.findByEmail(extUser.Email);
      if (!user) continue;

      const wasDeactivated = await this.deactivateUserIfNeeded(user.uid);
      if (wasDeactivated) {
        deactivatedUids.push(user.uid);
      }
    }

    return {
      checked: externalUsers.length,
      deactivated: deactivatedUids,
    };
  }

  private hasExpiredPassword(user: any): boolean {
    return user.pwdEndTime !== null && user.pwdEndTime !== 0;
  }

  private async deactivateUserIfNeeded(userUid: string): Promise<boolean> {
    const result = await this.userRepository
      .createQueryBuilder()
      .update()
      .set({
        isActive: false,
        desactivated_at: () => 'NOW()',
      })
      .where('uid = :uid', { uid: userUid })
      .andWhere('is_active = 1')
      .andWhere('desactivated_at IS NULL')
      .execute();

    return (result.affected || 0) > 0;
  }

  async deactivateUsersByEmail(emails: string[]): Promise<{ deactivatedUids: string[] }> {
    const users = await this.userRepository.find({
      where: {
        email: In(emails),
        isActive: true,
      },
    });

    if (!users.length) {
      return { deactivatedUids: [] };
    }

    const deactivatedUids = users.map(u => u.uid);

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({
        isActive: false,
        desactivated_at: () => 'IFNULL(desactivated_at, NOW())',
      })
      .where('uid IN (:...uids)', { uids: deactivatedUids })
      .execute();

    return { deactivatedUids };
  }



}

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { In, LessThan, Repository } from 'typeorm';
import { DirectoryProvider } from '../providers/directory-provider/directory-provider.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('DIRECTORY_PROVIDER')
    private readonly directoryService: DirectoryProvider,
  ) { }

  // Create user
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const user = this.userRepository.create(userData);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('cannot create user', error);
    }
  }

  // Get all users
  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('cannot find users', error);
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
      throw new InternalServerErrorException('Cannot find user', error);
    }
  }

  //find user by email
  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Cannot find user', error);
    }
  }

  //Update User
  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
      await this.userRepository.update(id, userData);
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Cannot update user', error);
    }
  }

  //Delete User
  async delete(id: number): Promise<void> {
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Cannot delete user', error);
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


  //--------------------------OIDC-------------------------------------------

  //juste pour tester
  async getAllOidcUsers() {
    return this.directoryService.getDirectory();
  }

  async getUsersWithPwdEndTime(): Promise<any[]> {
    const users = await this.directoryService.getDirectory();

    return users.filter(user => {
      const pwdEndTime = user?.attributes?.pwdEndTime?.[0];

      return (
        pwdEndTime === true ||
        pwdEndTime === 1 ||
        pwdEndTime === '1' ||
        pwdEndTime === 'true'
      );
    });
  }

  async deactivateUsersWithExpiredPassword(): Promise<{
    checked: number;
    deactivated: string[];
  }> {
    const expiredUsers = await this.getUsersWithPwdEndTime();
    const deactivatedUids: string[] = [];

    for (const extUser of expiredUsers) {
      if (!extUser?.email) continue;

      const user = await this.findByEmail(extUser.Email);
      if (!user) continue;

      const wasDeactivated = await this.deactivateUserIfNeeded(user.uid);
      if (wasDeactivated) {
        deactivatedUids.push(user.uid);
      }
    }

    return {
      checked: expiredUsers.length,
      deactivated: deactivatedUids,
    };
  }



  //---------------------------LDAP------------------------------------------

  // async findAllLDAP() {
  //   const users = await this.ldapService.getAllLdapUsers();
  //   return users.map(u => ({
  //     uid: u.uidNumber,
  //     name: u.cn,
  //     email: u.Email,
  //   }));
  // }

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

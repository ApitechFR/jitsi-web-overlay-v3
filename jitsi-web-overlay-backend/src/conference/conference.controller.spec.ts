import { Test, TestingModule } from '@nestjs/testing';
import { ConferenceController } from './conference.controller';
import { IConferenceService } from './interfaces/conference-service.interface';
import { CreateConferenceDTO } from './DTOs/conference.dto';
import { ByEmailDTO } from './DTOs/byEmail.dto';
import { JwtDTO } from './DTOs/jwt.dto';

describe('ConferenceController', () => {
  let controller: ConferenceController;
  const roomName = 'conference123456';
  const jwt = 'fegugeguguu.egfgugb687687gjGJHJB.GVHGJBhu76887Y8';
  const mockConferenceService = {
    create: jest.fn((dto) => ({ ...dto, id: '1' })),
    findAll: jest.fn(() => [{ id: '1', roomName }]),
    findOne: jest.fn((id) => ({ id, roomName })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    delete: jest.fn((id) => ({ id })),
    roomExists: jest.fn((roomName) => ({ roomName })),
    getRoomAccessToken: jest.fn((roomName, region, token) => ({
      roomName,
      jwt,
    })),
    getRoomAccessTokenByEmail: jest.fn((args) => ({
      roomName: args.room,
      jwt,
    })),
    verifyToken: jest.fn((jwt) => ({ jwt })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConferenceController],
      providers: [
        {
          provide: IConferenceService,
          useValue: mockConferenceService,
        },
      ],
    }).compile();
    controller = module.get<ConferenceController>(ConferenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service and return created conference', async () => {
    const dto: CreateConferenceDTO = {
      roomName: 'room',
      subject: 'subj',
    } as any;
    await expect(controller.create(dto)).resolves.toHaveProperty(
      'roomName',
      'room',
    );
    expect(mockConferenceService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll should return all conferences', async () => {
    await expect(controller.findAll()).resolves.toEqual([
      { id: '1', roomName },
    ]);
    expect(mockConferenceService.findAll).toHaveBeenCalled();
  });

  it('findOne should return a conference by id', async () => {
    await expect(controller.findOne('1')).resolves.toEqual({
      id: '1',
      roomName,
    });
    expect(mockConferenceService.findOne).toHaveBeenCalledWith('1');
  });

  it('update should call service and return updated conference', async () => {
    const dto = {
      name: 'new',
      start_time: new Date(),
      end_time: new Date(),
      created_by: 1,
    };
    await expect(controller.update('1', dto)).resolves.toEqual({
      id: '1',
      ...dto,
    });
    expect(mockConferenceService.update).toHaveBeenCalledWith('1', dto);
  });

  it('delete should call service and return deleted id', async () => {
    await expect(controller.delete('1')).resolves.toEqual({ id: '1' });
    expect(mockConferenceService.delete).toHaveBeenCalledWith('1');
  });

  it('roomExists should return an object of the same roomName', async () => {
    await expect(controller.roomExists({ roomName })).resolves.toEqual({
      roomName,
    });
    expect(mockConferenceService.roomExists).toHaveBeenCalledWith(roomName);
  });

  it('getRoomAccessToken should return an object of the same roomName and a jwt', async () => {
    await expect(
      controller.getRoomAccessToken({ roomName }, 'internet', 'Bearer token'),
    ).resolves.toEqual({ roomName, jwt });
    expect(mockConferenceService.getRoomAccessToken).toHaveBeenCalledWith(
      roomName,
      'internet',
      'token',
    );
  });

  it('getRoomAccessTokenByEmail should return an object of the same roomName and a jwt', async () => {
    const body: ByEmailDTO = { roomName, email: 'test@test.com' } as any;
    await expect(
      controller.getRoomAccessTokenByEmail(body, 'host'),
    ).resolves.toEqual({ roomName, jwt });
    expect(
      mockConferenceService.getRoomAccessTokenByEmail,
    ).toHaveBeenCalledWith({
      room: roomName,
      email: 'test@test.com',
      host: 'host',
    });
  });

  it('verifyToken should return jwt', async () => {
    const dto: JwtDTO = { jwt: 'jwt' };
    await expect(controller.verifyToken(dto)).resolves.toEqual({ jwt: 'jwt' });
    expect(mockConferenceService.verifyToken).toHaveBeenCalledWith('jwt');
  });
});

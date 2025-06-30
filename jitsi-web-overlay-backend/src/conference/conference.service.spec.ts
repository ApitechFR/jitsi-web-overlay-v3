import { IConferenceService } from './interfaces/conference-service.interface';

describe('IConferenceService (mock)', () => {
  let service: IConferenceService;

  beforeEach(() => {
    service = {
      create: jest.fn((dto) => Promise.resolve({ ...dto, id: '1' })),
      findAll: jest.fn(() => Promise.resolve([{ id: '1', name: 'room' }])),
      findOne: jest.fn((id) => Promise.resolve({ id, name: 'room' })),
      update: jest.fn((id, dto) => Promise.resolve({ id, ...dto })),
      delete: jest.fn(() => Promise.resolve()),
      roomExists: jest.fn((roomName) => Promise.resolve({ roomName })),
      getRoomAccessToken: jest.fn((roomName, region, token) =>
        Promise.resolve({ roomName, jwt: 'jwt' }),
      ),
      getRoomAccessTokenByEmail: jest.fn((args) =>
        Promise.resolve({ isWhitelisted: true, sended: 'email sended' }),
      ),
      verifyToken: jest.fn((jwt) => ({ jwt })),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should return created conference', async () => {
    const dto = {
      name: 'room',
      start_time: new Date(),
      end_time: new Date(),
      created_by: 1,
    };
    await expect(service.create(dto)).resolves.toHaveProperty('name', 'room');
  });

  it('findAll should return all conferences', async () => {
    await expect(service.findAll()).resolves.toEqual([
      { id: '1', name: 'room' },
    ]);
  });

  it('findOne should return a conference by id', async () => {
    await expect(service.findOne('1')).resolves.toEqual({
      id: '1',
      name: 'room',
    });
  });

  it('update should return updated conference', async () => {
    const dto = { name: 'new' };
    await expect(service.update('1', dto)).resolves.toEqual({
      id: '1',
      ...dto,
    });
  });

  it('delete should resolve without error', async () => {
    await expect(service.delete('1')).resolves.toBeUndefined();
  });

  it('roomExists should return roomName', async () => {
    await expect(service.roomExists('room')).resolves.toEqual({
      roomName: 'room',
    });
  });

  it('getRoomAccessToken should return jwt', async () => {
    await expect(
      service.getRoomAccessToken('room', 'internet', 'token'),
    ).resolves.toEqual({ roomName: 'room', jwt: 'jwt' });
  });

  it('getRoomAccessTokenByEmail should return isWhitelisted and sended', async () => {
    await expect(
      service.getRoomAccessTokenByEmail({
        room: 'room',
        email: 'test@test.com',
        host: 'host',
      }),
    ).resolves.toEqual({ isWhitelisted: true, sended: 'email sended' });
  });

  it('verifyToken should return jwt', () => {
    expect(service.verifyToken('jwt')).toEqual({ jwt: 'jwt' });
  });
});

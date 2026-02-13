import { ModuleKey, OFFER_MODULES } from './module-key.enum';

describe('ModuleKey Enum', () => {
  it('should have all module keys', () => {
    expect(ModuleKey.VISIO_JITSI).toBe('visio_jitsi');
    expect(ModuleKey.FEEDBACK).toBe('feedback');
    expect(ModuleKey.WEBINAR).toBe('webinar');
    expect(ModuleKey.REPLAY).toBe('replay');
    expect(ModuleKey.RECORDING).toBe('recording');
    expect(ModuleKey.WHITEBOARD).toBe('whiteboard');
    expect(ModuleKey.VOXIFY).toBe('voxify');
  });

  it('should have exactly 7 module keys', () => {
    const values = Object.values(ModuleKey);
    expect(values).toHaveLength(7);
  });
});

describe('OFFER_MODULES Config', () => {
  it('should have BASIQUE offer with 2 modules', () => {
    expect(OFFER_MODULES.BASIQUE).toHaveLength(2);
    expect(OFFER_MODULES.BASIQUE).toContain(ModuleKey.VISIO_JITSI);
    expect(OFFER_MODULES.BASIQUE).toContain(ModuleKey.FEEDBACK);
  });

  it('should have PREMIUM offer with 7 modules', () => {
    expect(OFFER_MODULES.PREMIUM).toHaveLength(7);
    expect(OFFER_MODULES.PREMIUM).toContain(ModuleKey.WEBINAR);
    expect(OFFER_MODULES.PREMIUM).toContain(ModuleKey.REPLAY);
    expect(OFFER_MODULES.PREMIUM).toContain(ModuleKey.RECORDING);
    expect(OFFER_MODULES.PREMIUM).toContain(ModuleKey.WHITEBOARD);
  });

  it('should include core modules in both offers', () => {
    expect(OFFER_MODULES.BASIQUE).toContain(ModuleKey.VISIO_JITSI);
    expect(OFFER_MODULES.PREMIUM).toContain(ModuleKey.VISIO_JITSI);
  });
});

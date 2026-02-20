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
    expect(ModuleKey.ETHERPAD).toBe('etherpad');
    expect(ModuleKey.TRANSCRIPTION).toBe('transcription');
  });

  it('should have exactly 9 module keys', () => {
    const values = Object.values(ModuleKey);
    expect(values).toHaveLength(9);
  });
});

describe('OFFER_MODULES Config', () => {
  it('should have BASIC offer with 2 modules', () => {
    expect(OFFER_MODULES.basic).toHaveLength(2);
    expect(OFFER_MODULES.basic).toContain(ModuleKey.VISIO_JITSI);
    expect(OFFER_MODULES.basic).toContain(ModuleKey.FEEDBACK);
  });

  it('should have PREMIUM offer with 9 modules', () => {
    expect(OFFER_MODULES.premium).toHaveLength(9);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.WEBINAR);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.REPLAY);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.RECORDING);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.WHITEBOARD);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.ETHERPAD);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.TRANSCRIPTION);
  });

  it('should include core modules in both offers', () => {
    expect(OFFER_MODULES.basic).toContain(ModuleKey.VISIO_JITSI);
    expect(OFFER_MODULES.premium).toContain(ModuleKey.VISIO_JITSI);
  });
});

import { generateRoomName } from "../helpers/roomNameGenerator";

describe("generateRoomName", () => {
  it("should generate a non-empty string", () => {
    const name = generateRoomName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  it("should respect the prefix and size from configs if set", () => {
    jest.resetModules();
    const configsModule = require("../../configs");
    const configs = configsModule.configs || configsModule;
    const originalPrefix = configs.room_name_prefix;
    const originalSize = configs.room_name_size;
    configs.room_name_prefix = "testprefix";
    configs.room_name_size = 20;

    const { generateRoomName } = require("../helpers/roomNameGenerator");
    const name = generateRoomName();
    expect(name.startsWith("testprefix-")).toBe(true);
    expect(name.length).toBe(20);
    configs.room_name_prefix = originalPrefix;
    configs.room_name_size = originalSize;
  });

  it("should generate a structured name when prefix is 'alea_name'", () => {
    jest.resetModules();
    const configsModule = require("../../configs");
    const configs = configsModule.configs || configsModule;
    const originalPrefix = configs.room_name_prefix;
    configs.room_name_prefix = "alea_name";
    const { generateRoomName } = require("../helpers/roomNameGenerator");
    const name = generateRoomName();
    expect(name).toMatch(/.+-.{7,10}$/);
    configs.room_name_prefix = originalPrefix;
  });
});

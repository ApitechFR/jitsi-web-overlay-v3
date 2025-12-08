import roomData from "../utils/roomData.json";

function randomAlphanumString(length) {
  return _randomString(length, roomData.ALPHANUM);
}
function _randomString(length, characters) {
  let result = "";

  for (let i = 0; i < length; ++i) {
    result += randomElement(characters);
  }

  return result;
}
function randomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Select a random element from an array.
 * @param arr - The array to select from.
 * @returns A random element from the array.
 */
function randomElementFlush<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a professional room name.
 * @returns A room name.
 */
export function generateRoomName(): string {
  const configsModule = require("../../configs");
  const configs = configsModule.configs || configsModule;
  const prefix = configs.room_name_prefix ?? "alea_name";
  const totalSize = configs.room_name_size ?? 30;

  // Mode alea_name = nom structuré
  if (prefix === "alea_name") {
    const place = randomElementFlush(roomData.PLACE);
    const noun = randomElementFlush(roomData.PLURALNOUN);
    const verb = randomElementFlush(roomData.VERB);
    const alphanum = randomAlphanumString(randomInt(7, 10));
    return `${place}${noun}${verb}-${alphanum}`;
  }

  // Sinon : calculer la longueur restante
  const finalPrefix = prefix.trim();
  let base = finalPrefix;
  if (finalPrefix.length > 0) {
    base += "-";
  }
  const suffixLength = Math.max(totalSize - base.length, 0);
  const suffix = randomAlphanumString(suffixLength);

  return `${base}${suffix}`;
}

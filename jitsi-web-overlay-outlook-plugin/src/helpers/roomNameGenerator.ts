

import roomData from "../utils/roomData.json";
const vars = require("../../vars.json");

// Charger dotenv si disponible (utile pour tests ou exécution directe Node)
try {
  require('dotenv').config();
} catch (e) { }

function getEnvOrVar(key, fallback) {
  return process.env[key] || vars[key] || fallback;
}

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
function randomElementFlush(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Génération classique (frontend/backend)
function generateClassicRoomName() {
  const minLength = Number(getEnvOrVar('ROOM_NAME_LENGTH', 10));
  const maxLength = Number(getEnvOrVar('ROOM_NAME_LENGTH', 10));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let name = "";
  do {
    const len = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    name = Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  } while (!/^[A-Z0-9]+$/.test(name));
  return name;
}

// Génération plugin (structurée)
function generatePluginRoomName() {
  const prefix = getEnvOrVar('ROOM_NAME_PREFIX', 'alea_name');
  const totalSize = Number(getEnvOrVar('ROOM_NAME_LENGTH', 30));
  if (prefix === "alea_name" || !prefix) {
    const place = randomElementFlush(roomData.PLACE);
    const noun = randomElementFlush(roomData.PLURALNOUN);
    const verb = randomElementFlush(roomData.VERB);
    const alphanum = randomAlphanumString(randomInt(7, 10));
    return `${place}${noun}${verb}-${alphanum}`;
  }
  const finalPrefix = prefix.trim();
  let base = finalPrefix;
  if (finalPrefix.length > 0) {
    base += "-";
  }
  const suffixLength = Math.max(totalSize - base.length, 0);
  const suffix = randomAlphanumString(suffixLength);
  return `${base}${suffix}`;
}

// Fonction principale avec choix du mode
export function generateRoomName() {
  const mode = getEnvOrVar('ROOM_NAME_MODE', 'plugin');
  if (mode === "classic") {
    return generateClassicRoomName();
  }
  return generatePluginRoomName();
}

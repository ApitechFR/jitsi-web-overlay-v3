
export const roomNameConfig = {
  regex: new RegExp(
    import.meta.env.VITE_CONFERENCE_NAME_REGEX ||
      '^[a-zA-Z0-9_-]'
  ),
};

export function validateRoomName(roomName: string | undefined): boolean {
  if (!roomName) return false;
  return roomNameConfig.regex.test(roomName);
}


export function generateRoomName(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = '';
  do {
    name = Array.from({ length: 10 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  } while (!validateRoomName(name));
  return name;
}


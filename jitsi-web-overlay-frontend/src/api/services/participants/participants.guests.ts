export function saveGuestParticipant(conferenceUid: string, participantUid: string, ttlHours = 24) {
  const localKey = `guest-participant-${conferenceUid}`;

  const expires = Date.now() + ttlHours * 60 * 60 * 1000;

  const data = {
    uid: participantUid,
    expires
  };

  localStorage.setItem(localKey, JSON.stringify(data));
}

export function getStoredGuestParticipant(conferenceUid: string): string | null {
  const localKey = `guest-participant-${conferenceUid}`;
  const saved = localStorage.getItem(localKey);

  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);

    if (!parsed.expires || parsed.expires < Date.now()) {
      console.log("Stored guest expired → removing...");
      localStorage.removeItem(localKey);
      return null;
    }

    return parsed.uid;
  } catch {
    localStorage.removeItem(localKey);
    return null;
  }
}

export function cleanupExpiredGuests() {
  const now = Date.now();

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("guest-participant")) return;

    try {
      const data = JSON.parse(localStorage.getItem(key)!);

      if (!data.expires || data.expires < now) {
        console.log(`Cleaning expired key: ${key}`);
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  });
}
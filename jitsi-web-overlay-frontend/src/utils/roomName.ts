// Utilitaire de validation et génération de nom de salle

/**
 * Vérifie si un nom de salle est valide (au moins une lettre, 3 chiffres, min 10 caractères, alphanumérique)
 */
export function validateRoomName(roomName: string | undefined): boolean {
  if (!roomName) return false;
  const regex =
    /^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*\d){3})[a-zA-Z0-9]{10,}$/;
  return regex.test(roomName);
}

/**
 * Génère un nom de salle alphanumérique avec au moins 3 chiffres et 10 caractères
 */
export function generateRoomName(): string {
  let name = '';
  while (!validateRoomName(name)) {
    name = Math.random().toString(36).slice(2, 12).toUpperCase();
    // Ajoute 3 chiffres aléatoires si besoin
    while ((name.match(/\d/g) || []).length < 3) {
      name += Math.floor(Math.random() * 10);
    }
    // Complète à 10 caractères si besoin
    if (name.length < 10) {
      name += Math.random()
        .toString(36)
        .slice(2, 12)
        .toUpperCase()
        .slice(0, 10 - name.length);
    }
  }
  return name;
}

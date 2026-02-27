const transformDate = (date: any) => {
  const date1 = date.split('T')[0].split('-').reverse().join('/');
  const time = date.split('T')[1];
  return date1 + ' ' + time;
};

export const formatForInput = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const buildClipboardText = ({ meetingUrl, dateTimeStart, formattedEnd, phoneNumber, pin, voxApiUrl }: {
  meetingUrl: string;
  dateTimeStart?: string;
  formattedEnd?: string;
  phoneNumber?: string;
  pin?: string;
  voxApiUrl?: string;
}) => {
  const phonePart =
    voxApiUrl && phoneNumber && pin
      ? `
    Coordonnées téléphoniques de la conférence :
      - Numéro de téléphone: ${phoneNumber}
      - PIN: ${pin}
    `
      : '';

  return `
    Lien vers la conférence: ${meetingUrl}
    date de début: ${dateTimeStart
      ? transformDate(dateTimeStart.substring(0, 16))
      : ''
    }
    date de fin: ${formattedEnd
      ? transformDate(formattedEnd.substring(0, 16))
      : ''
    }
    ${phonePart}
  `;
};

export const buildCalendarEvent = ({ appTemplate, roomName, meetingUrl, dateTimeStart, dateTimeEnd, phoneNumber, pin, voxApiUrl }: any) => ({
  title: `${appTemplate === 'webconf' ? "Webconférence de l'État" : "Visio by Apitech"} : ${roomName}`,
  description:
    String.raw`${appTemplate === 'webconf'
      ? "Webconférence de l'État"
      : "Visio by Apitech"}\n\n` +
    String.raw`Rejoindre la réunion :\n${meetingUrl}\n\n` +
    (voxApiUrl && phoneNumber && pin
      ? String.raw`Téléphone : ${phoneNumber}\nPIN : ${pin}`
      : ""),

  startTime: dateTimeStart,
  endTime: dateTimeEnd,
  location: meetingUrl
});
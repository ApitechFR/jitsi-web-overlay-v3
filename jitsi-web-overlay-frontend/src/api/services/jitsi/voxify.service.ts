import axios from "axios";

const VOX_API_URL = import.meta.env.VITE_VOXAPI_URL;
const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN;

export const VoxifyService = {
  async getConferenceCode(roomName: string) {
    const conference = `${roomName}@conference.${JITSI_DOMAIN}`;
    const url = `https://${JITSI_DOMAIN}/${roomName}`;

    const response = await axios.get(
      `${VOX_API_URL}/api/v1/conn/jitsi/conference/code`,
      {
        params: {
          conference,
          url
        }
      }
    );

    return response.data.id;
  },

  async getPhoneNumbers(roomName: string) {
    const conference = `${roomName}@conference.${JITSI_DOMAIN}`;

    const response = await axios.get(
      `${VOX_API_URL}/api/v1/conn/jitsi/phoneNumbers`,
      {
        params: { conference }
      }
    );

    return response.data.numbers.FR[0];
  }
};
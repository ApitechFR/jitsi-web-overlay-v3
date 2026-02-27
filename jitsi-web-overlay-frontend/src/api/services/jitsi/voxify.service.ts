import { getHttp } from "../../http";

export const VoxifyService = {
  async getConferenceCode(roomName: string) {

    const http = await getHttp();
    const response = await http.get("/voxify/code", {
      params: { roomName }
    });

    return response.data.id;
  },

  async getPhoneNumbers(roomName: string) {

    const http = await getHttp();
    const response = await http.get("/voxify/number", {
      params: { roomName }
    });

    return response.data.numbers.FR[0];
  },

  async getConferenceInfo(roomName: string) {
    const [pin, phone] = await Promise.all([
      VoxifyService.getConferenceCode(roomName),
      VoxifyService.getPhoneNumbers(roomName)
    ]);

    return { pin, phone };
  }
};
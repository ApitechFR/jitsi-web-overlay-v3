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
  }
};
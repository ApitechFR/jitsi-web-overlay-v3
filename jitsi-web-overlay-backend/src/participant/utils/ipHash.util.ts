import * as bcrypt from 'bcrypt';

export async function hashIp(ip: string): Promise<string> {
  const saltRounds = await bcrypt.genSalt();
  return await bcrypt.hash(ip, saltRounds);
}

export async function compareIp(ip: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(ip, hash);
}
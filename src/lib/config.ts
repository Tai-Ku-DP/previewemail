import { getV2ConfigDB, saveV2ConfigDB, clearV2ConfigDB } from './db';
import type { V2Config } from '@/types';

export async function getV2Config(): Promise<V2Config | null> {
  return getV2ConfigDB();
}

export async function saveV2Config(config: V2Config): Promise<void> {
  return saveV2ConfigDB(config);
}

export async function clearV2Config(): Promise<void> {
  return clearV2ConfigDB();
}

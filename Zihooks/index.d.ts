import { Client } from "discord.js";

export function useDB(DB?: any): any;
export function useClient(Client?: Client): Client;
export function useConfig(Config?: Object): Object;
export function useCommands(Commands?: any): Map;
export function useFunctions(Functions?: any): Map;
export function useCooldowns(Cooldowns?: any): Map;
export function useGiveaways(Giveaways?: any): any;

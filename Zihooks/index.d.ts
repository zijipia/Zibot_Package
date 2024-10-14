import { Client } from "discord.js";

declare class ZCollection extends Map {
	constructor();
}

export function useDB(DB?: any): any;
export function useClient(Client?: Client): Client;
export function useCommands(Commands?: any): ZCollection;
export function useFunctions(Functions?: any): ZCollection;
export function useCooldowns(Cooldowns?: any): ZCollection;
export function useGiveaways(Giveaways?: any): any;

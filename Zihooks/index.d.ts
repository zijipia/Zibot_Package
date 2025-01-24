import { Client } from "discord.js";
import { Logger } from "winston";
class customMap extends Map {
	constructor() {
		super();
	}
}

export function useDB(DB?: any): any;
export function useUtils(Utils?: any): any;
export function useClient(Client?: Client): Client;
export function useConfig(Config?: Object): Object;
export function useUntil(Until?: any): any;
export function useGiveaways(Giveaways?: any): any;
export function useStatus(Status?: Object): Object;
export function useLogger(Logger?: Logger): Logger;
export function useWelcome(Welcome?: any): customMap;
export function useCommands(Commands?: any): customMap;
export function useFunctions(Functions?: any): customMap;
export function useCooldowns(Cooldowns?: any): customMap;
export function useResponder(Responder?: any): customMap;

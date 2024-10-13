declare module "Zihooks/index" {
	type FunctionsType = any;
	type CommandsType = any;
	type CooldownsType = any;
	type ClientType = any;

	export const useFunctions: (Functions?: FunctionsType) => FunctionsType;
	export const useCommands: (Commands?: CommandsType) => CommandsType;
	export const useCooldowns: (Cooldowns?: CooldownsType) => CooldownsType;
	export const useClient: (Client?: ClientType) => ClientType;
}

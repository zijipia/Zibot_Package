type FunctionsType = any;
type CommandsType = any;
type CooldownsType = any;
type ClientType = any;

const useFunctions: (Functions?: FunctionsType) => FunctionsType;
const useCommands: (Commands?: CommandsType) => CommandsType;
const useCooldowns: (Cooldowns?: CooldownsType) => CooldownsType;
const useClient: (Client?: ClientType) => ClientType;

export = { useFunctions, useCommands, useCooldowns, useClient };

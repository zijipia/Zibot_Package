function createSingleton(name) {
	let instance = null;

	return (value) => {
		if (!instance) {
			if (value) {
				instance = value;
			} else {
				console.error(`${name} has not been initialized. Please provide ${name} when calling for the first time.`);
				return false;
			}
		}
		return instance;
	};
}
const useDB = createSingleton("Database");
const useClient = createSingleton("Client");
const useConfig = createSingleton("Config");
const useUntil = createSingleton("Until");
const useStatus = createSingleton("Status");
const useLogger = createSingleton("Logger");
const useWelcome = createSingleton("Welcome");
const useCommands = createSingleton("Commands");
const useFunctions = createSingleton("Functions");
const useCooldowns = createSingleton("Cooldowns");
const useGiveaways = createSingleton("Giveaways");
const useResponder = createSingleton("Responder");

module.exports = {
	useDB,
	useClient,
	useConfig,
	useUntil,
	useStatus,
	useLogger,
	useWelcome,
	useCommands,
	useFunctions,
	useCooldowns,
	useGiveaways,
	useResponder,
};

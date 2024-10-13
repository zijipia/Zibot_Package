function createSingleton(initializationError) {
	let instance = null;

	return (value) => {
		if (!instance) {
			if (value) {
				instance = value;
			} else {
				throw new Error(initializationError);
			}
		}
		return instance;
	};
}

const useFunctions = createSingleton(
	"Functions has not been initialized. Please provide Functions when calling for the first time.",
);

const useCommands = createSingleton(
	"Commands has not been initialized. Please provide Commands when calling for the first time.",
);

const useCooldowns = createSingleton(
	"Cooldowns has not been initialized. Please provide Cooldowns when calling for the first time.",
);

const useClient = createSingleton("Client has not been initialized. Please provide Client when calling for the first time.");

module.exports = {
	useFunctions,
	useCommands,
	useCooldowns,
	useClient,
};

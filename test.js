function findHappyNumbers(start, end) {
	function isHappyNumber(n) {
		const sumOfSquares = (num) =>
			num
				.toString()
				.split("")
				.reduce((sum, digit) => sum + Math.pow(+digit, 2), 0);

		let seen = new Set();
		while (n !== 1 && !seen.has(n)) {
			seen.add(n);
			n = sumOfSquares(n);
		}
		return n === 1;
	}

	let result = [];
	for (let i = start; i <= end; i++) {
		if (isHappyNumber(i)) {
			result.push(i);
		}
	}
	return result;
}

// Ví dụ sử dụng:
console.log(findHappyNumbers(100999779935, 100999779965));

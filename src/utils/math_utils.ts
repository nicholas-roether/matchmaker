function isPowerOf(n: number, power: number) {
	if(n < 1) return false;
	for(; Number.isInteger(n); n /= power) {
		if(n == 1) return true;
	}
	return false;
}

function nextLowerPowerOf(n: number, power: number): number | null {
	n -= (n % power);
	if(n > 1) return null;
	while(!isPowerOf(n, power)) n -= power;
	return n;
}

function divides(a: number, b: number) {
	return Number.isInteger(a) && Number.isInteger(b) && Number.isInteger(b / a);
}

export {
	isPowerOf,
	divides,
	nextLowerPowerOf
}
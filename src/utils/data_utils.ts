function createGroups<T>(elements: T[], size: number): T[][] {
	if(elements.length % 2 == 1)
		throw new Error(`number of elements must be divisible by ${size}`);
	let groups: T[][] = [];
	let buffer: T[];
	for(let element of elements) {
		if(buffer.length < size) buffer.push(element);
		else {
			groups.push([...buffer, element]);
			buffer = null;
		}
	}
	return groups;
}

function createPairs<T>(elements: T[]): [T, T][] {
	return createGroups(elements, 2) as [T, T][];
}

function groupByIndex<T>(arrays: T[][], length: number): T[][] {
	let byIndex: T[][] = [];
	for(let i = 0; i < length; i++) {
		let entries: T[] = [];
		arrays.forEach(array => entries.push(array[i]));
		byIndex.push(entries);
	}
	return byIndex;
}

function collapseNestedArray<T>(nestedArray: T[][]): T[] {
	return nestedArray.reduce((r, a) => r = [...r, ...a]);
}

function swapBetween<T>(element1: T, element2: T, array1: T[], array2: T[]) {
	array1[array1.indexOf(element1)] = element2;
	array2[array2.indexOf(element2)] = element1;
}

export {
	createGroups,
	createPairs,
	groupByIndex,
	collapseNestedArray,
	swapBetween
}
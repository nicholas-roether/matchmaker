function cls(...classes: (string | [string, boolean])[]): string {
	return classes.filter(e => typeof e === "string" || e[1]).map(e => typeof e === "string" ? e : e[0]).join(" ");
}

export {
	cls
}
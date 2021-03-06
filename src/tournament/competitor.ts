abstract class Competitor {
	public readonly name: string;

	constructor(name: string) {
		this.name = name;
	}
}

class Player extends Competitor {
	constructor(name: string) {
		super(name);
	}
}

class Team extends Competitor {
	public readonly players: Player[];

	constructor(name: string, players: Player[]) {
		super(name);
		this.players = players;
	}
}

export {
	Competitor,
	Player,
	Team
}
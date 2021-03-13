import ChangeNotifier from "../utils/classes/change_notifier";

export enum CompetitorType {
	PLAYER = "player",
	TEAM = "team"
}

abstract class Competitor extends ChangeNotifier {
	public readonly id?: string;
	public readonly type: CompetitorType
	private _name: string;

	constructor(name: string, type: CompetitorType, id?: string) {
		super();
		this.id = id;
		this._name = name;
		this.type = type;
	}

	public get name() { return this._name; }

	public set name(value) {
		this._name = value;
		this.notify("name");
	}

}

class Player extends Competitor {
	constructor(name: string, id?: string) {
		super(name, CompetitorType.PLAYER, id);
	}
}

class Team extends Competitor {
	private _players: Player[];

	constructor(name: string, players: Player[], id?: string) {
		super(name, CompetitorType.TEAM, id);
		this._players = players;
	}

	public get players() { return this._players; }

	public set players(value) {
		this._players = value;
		this.notify("players");
	}

	public addPlayer(player: Player) {
		this.players = [...this.players, player];
	}

	public removePlayer(player: Player) {
		if(!this.players.some(p => p.name === player.name)) return;
		let players = this.players;
		players.splice(players.findIndex(p => p.name === player.name), 1);
		this.players = players;
	}
}

export {
	Competitor,
	Player,
	Team
}
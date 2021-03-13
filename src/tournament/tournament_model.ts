import ChangeNotifier from "../utils/classes/change_notifier";
import { collapseNestedArray, swapBetween } from "../utils/data_utils";
import { Competitor } from "./competitor";
import TournamentLayout from "./tournament_layout";
import { TournamentState } from "./tournament_state";

export interface TournamentUserInit {
	id: string;
	name: string;
	image?: string;
	isStreamer?: boolean;
	isModerator?: boolean;
	hidden?: boolean;
}

class TournamentUser extends ChangeNotifier {
	public readonly id: string;
	public readonly name: string;
	public readonly image: string;
	private _isStreamer: boolean;
	private _isModerator: boolean;
	private _hidden: boolean;

	constructor({id,
		name,
		image,
		isStreamer = false,
		isModerator = false,
		hidden = false
	}: TournamentUserInit) {
		super();
		this.id = id;
		this.name = name;
		this.image = image;
		this._isStreamer = isStreamer;
		this._isModerator = isModerator;
		this._hidden = hidden;
	}

	public get isStreamer() { return this._isStreamer; }

	public set isStreamer(newIsStreamer) {
		this._isStreamer = newIsStreamer;
		this.notify("isStreamer");
	}

	public get isModerator() { return this._isModerator; }

	public set isModerator(newIsModerator) {
		this._isModerator = newIsModerator;
		this.notify("isModerator");
	}

	public get hidden() { return this._hidden; }

	public set hidden(value) {
		this._hidden = value;
		this.notify("hidden");
	}
}

export enum TournamentPhase {
	PLANNED = "planned",
	QUALIFICATION = "qualification",
	POST_QUALIFICATION = "post-qualification",
	GROUP = "group",
	MAIN = "main",
	FINISHED = "finished"
}

export interface TournamentInit<C extends Competitor> {
	id?: string;
	owner: string;
	name: string;
	description?: string;
	logo?: string;
	time?: Date;
	qualificationTime?: Date;
	competitors: C[];
	layout: TournamentLayout;
	phase?: TournamentPhase;
	state?: TournamentState<C>;
	startingMatchups?: C[][],
	users?: TournamentUser[]
}

class TournamentModel<C extends Competitor> extends ChangeNotifier {
	public readonly id?: string;
	public readonly name: string;
	public readonly description?: string;
	public readonly logo?: string;
	public readonly time?: Date;
	public readonly qualificationTime?: Date;
	public readonly competitors: C[];
	public readonly layout: TournamentLayout;
	public readonly state: TournamentState<C> = null;
	private _owner: string;
	private _startingMatchups?: C[][];
	private _phase: TournamentPhase;
	private _users: TournamentUser[];

	constructor({
		id,
		owner,
		name,
		description,
		logo,
		competitors,
		layout,
		phase = TournamentPhase.FINISHED,
		state = new TournamentState<C>(),
		startingMatchups = null,
		users = []
	}: TournamentInit<C>) {
		super();
		this.id = id;
		this.name = name;
		this.description = description;
		this.logo = logo;
		this.competitors = competitors;
		this.layout = layout;
		this.state = state;
		this._startingMatchups = startingMatchups;
		this._owner = owner;
		this._phase = phase;
		this._users = users;
		this.pass(state);
		if(this.startingMatchups) this.checkCompetitorValidity(...collapseNestedArray(this.startingMatchups));
	}

	public get owner() { return this._owner; }

	public set owner(value) {
		this._owner = value;
		this.notify("owner");
	}
	
	public get phase() { return this._phase; }

	public set phase(newPhase) {
		this._phase = newPhase;
		this.notify("phase");
	}

	public get startingMatchups() { return this._startingMatchups; }

	public set startingMatchups(value) {
		if(!this.canModifyStartingPositions())
			throw new Error("Starting matchups can't be modified during this group phase");
		this.checkCompetitorValidity(...collapseNestedArray(value));
		this._startingMatchups = value;
		this.notify("startingMatchups");
	}

	public swapInMatchup(competitor1, competitor2) {
		if(!this.startingMatchups) throw new Error("This tournament has no starting matchups defined");
		const matchup1 = this.getStartingMatchupOf(competitor1);
		const matchup2 = this.getStartingMatchupOf(competitor2);
		if(!matchup1 || !matchup2) throw new Error("Could not find competitor");
		swapBetween(competitor1, competitor2, matchup1, matchup2);
	}

	public get users() { return this._users; }

	public set users(value) {
		this._users = value;
		this.notify("users");
	}

	public addUser(user: TournamentUser) {
		this.users = [...this.users, user];
	}

	private canModifyStartingPositions() {
		return (this.phase == "planned" && !this.layout.hasQualificationPhase) || this.phase == "post-qualification";
	}


	private getStartingMatchupOf(competitor: C) {
		if(!this.startingMatchups) return null;
		return this.startingMatchups.find(matchup => matchup.includes(competitor));
	}

	private checkCompetitorValidity(...competitors: C[]) {
		competitors.forEach(competitor => {
			if(!this.competitors.includes(competitor))
				throw new Error(`Competitor '${competitor.name}' is not specified in competitor list`);
		})
	}
}

export {
	TournamentUser
}
export default TournamentModel;
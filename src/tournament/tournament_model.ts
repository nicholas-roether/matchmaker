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

export type TournamentPhase = "planned" | "qualification" | "post-qualification" | "group" | "main" | "finished";

export interface TournamentInit<C extends Competitor> {
	id: string;
	name: string;
	description?: string;
	logo?: string;
	time?: Date;
	qualificationTime?: Date;
	competitors: C[];
	layout: TournamentLayout;
	phase?: TournamentPhase;
	state?: TournamentState<C>;
	groups?: C[][],
	startingMatchups?: C[][],
	users?: TournamentUser[]
}

class TournamentModel<C extends Competitor> extends ChangeNotifier {
	public readonly id: string;
	public readonly name: string;
	public readonly description?: string;
	public readonly logo?: string;
	public readonly time?: Date;
	public readonly qualificationTime?: Date;
	public readonly competitors: C[];
	public readonly layout: TournamentLayout;
	private _groups?: C[][];
	private _startingMatchups?: C[][];
	private _phase: TournamentPhase;
	private _state: TournamentState<C> = null;
	private _isInitialState: boolean;
	private _users: TournamentUser[];

	constructor({
		id,
		name,
		description,
		logo,
		competitors,
		layout,
		phase = "planned",
		state,
		groups = null,
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
		if(this.layout.hasGroupPhase)
			this._groups = groups;
		if(!this.layout.hasGroupPhase)
			this._startingMatchups = startingMatchups;
		this._phase = phase;
		this._state = state;
		this._users = users;
		this.pass(state);
		this.addListener(evt => {
			if(evt.property == "state") this.pass(this._state);
		});
		if(this.groups) this.checkCompetitorValidity(...collapseNestedArray(this.groups));
		if(this.startingMatchups) this.checkCompetitorValidity(...collapseNestedArray(this.startingMatchups));
	}
	
	public get phase() { return this._phase; }

	public set phase(newPhase) {
		this._phase = newPhase;
		this.notify("phase");
	}

	public get state() { return this._state; }

	public set state(newState) {
		this._state = newState;
		this.notify("state");
	}

	public get isInitialState() { return this._isInitialState; }

	public set isInitialState(newIsInitialState) {
		this._isInitialState = newIsInitialState;
		this.notify("isInitialState");
	}

	public get groups() { return this._groups; }

	public set groups(value) {
		if(!this.layout.hasGroupPhase)
			throw new Error("This tournament doesn't have a group phase");
		if(!this.canModifyStartingPositions())
			throw new Error("Groups can't be modified during this tournament phase");
		this.checkCompetitorValidity(...collapseNestedArray(value));
		this._groups = value;
		this.notify("groups");
	}

	public swapInGroups(competitor1: C, competitor2: C) {
		if(!this.groups) throw new Error("This tournament has no groups defined");
		const group1 = this.getGroupOf(competitor1);
		const group2 = this.getGroupOf(competitor2);
		if(!group1 || !group2) throw new Error("Could not find competitor");
		swapBetween(competitor1, competitor2, group1, group2);
	}

	public get startingMatchups() { return this._startingMatchups; }

	public set startingMatchups(value) {
		if(this.layout.hasGroupPhase)
			throw new Error("The matchups for this tournament are determined by the group phase and cannot be modified");
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

	private getGroupOf(competitor: C) {
		if(!this.groups) return null;
		return this.groups.find(group => group.includes(competitor));
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

export default TournamentModel;
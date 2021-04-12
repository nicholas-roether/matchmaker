import ChangeNotifier from "../utils/classes/change_notifier";
import { collapseNestedArray, swapBetween } from "../utils/data_utils";
import { Competitor, CompetitorType, Player, Team } from "./competitor";
import TournamentLayout from "./tournament_layout";
import { FinishedTournamentState, GroupTournamentState, MainTournamentState, Match, MatchTreeNode, MatchTreeNodeState, QualificationTournamentState, Scoreboard, ScoreboardEntry, ScoredCompetitor, TournamentGroup, TournamentState } from "./tournament_state";

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

interface TournamentOptionsInit {
	liveTracking?: boolean;
}

class TournamentOptions extends ChangeNotifier {
	private _liveTracking: boolean;

	constructor({liveTracking = false}: TournamentOptionsInit) {
		super();
		this._liveTracking = liveTracking;
	}

	public get liveTracking() { return this._liveTracking; }

	public set liveTracking(value) {
		this._liveTracking = value;
		this.notify("liveTracking");
	}
}

interface TournamentMetaInit {
	name: string;
	description?: string;
	logo?: string;
}

class TournamentMeta extends ChangeNotifier {
	private _name: string;
	private _description: string;
	private _logo: string;

	constructor({name, description = "", logo}: TournamentMetaInit) {
		super();
		this._name = name;
		this._description = description;
		this._logo = logo;
	}

	public get name() { return this._name; }

	public set name(value) {
		this._name = value;
		this.notify("name");
	}

	public get description() { return this._description; }

	public set description(value) {
		this._description = value;
		this.notify("description");
	}

	public get logo() { return this._logo; }

	public set logo(value) {
		this._logo = value;
		this.notify("logo");
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

export type RawMatch = {
	competitor: string;
	score: number;
}[]

export interface RawTournamentGroup {
	scoreboard: {
		entries: {
			competitor: string,
			wins: number,
			score: number
		}[]
	};
	currentMatches: RawMatch[];
}

export interface RawTournamentTreeNode {
	state: MatchTreeNodeState;
	match: RawMatch;
	children?: [RawTournamentTreeNode, RawTournamentTreeNode];
}

export interface RawTournament {
	id: string;
	owner: string;
	meta: {
		name: string,
		description: string,
		logo: string,
	};
	options: {
		liveTracking: boolean
	};
	time?: Date;
	competitorType: CompetitorType;
	competitors: string[] | {name: string, members: string[]}[];
	layout: TournamentLayout;
	phase: TournamentPhase;
	startingMatchups: string[][];
	users: {
		id: string,
		name: string,
		image: string,
		isStreamer: boolean,
		isModerator: boolean,
		hidden: boolean
	}[];
	state: {
		qualificationState?: RawTournamentGroup,
		groupState?: {
			groups: RawTournamentGroup[]
		},
		mainState?: {
			tree: RawTournamentTreeNode
		},
		finishedState?: {
			winner: string
		}
	}
}

export interface TournamentInit<C extends Competitor> {
	id?: string;
	owner: string;
	meta: TournamentMeta;
	options: TournamentOptions;
	time?: Date;
	competitors: C[];
	layout: TournamentLayout;
	phase?: TournamentPhase;
	state?: TournamentState<C>;
	startingMatchups?: C[][],
	users?: TournamentUser[]
}

class TournamentModel<C extends Competitor> extends ChangeNotifier {
	public id: string;
	public readonly meta: TournamentMeta;
	public readonly options: TournamentOptions;
	public readonly competitors: C[];
	public readonly layout: TournamentLayout;
	public readonly state: TournamentState<C> = null;
	private _time: Date;
	private _owner: string;
	private _startingMatchups?: C[][];
	private _phase: TournamentPhase;
	private _users: TournamentUser[];

	constructor({
		id = null,
		owner,
		meta,
		options,
		time,
		competitors,
		layout,
		phase = TournamentPhase.PLANNED,
		state = new TournamentState<C>(),
		startingMatchups = null,
		users = [],
	}: TournamentInit<C>) {
		super();
		this.id = id;
		this.meta = meta;
		this.options = options;
		this.competitors = competitors;
		this.layout = layout;
		this.state = state;
		this._time = time;
		this._startingMatchups = startingMatchups;
		this._owner = owner;
		this._phase = phase;
		this._users = users;
		this.pass(meta);
		this.pass(options);
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

	public get time() { return this._time; }

	public set time(value) {
		this._time = value;
		this.notify("time");
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

	private toRawMatch(match: Match<C>) {
		return [
			{
				competitor: match.entry1.competitor.name,
				score: match.entry1.score
			},
			{
				competitor: match.entry2.competitor.name,
				score: match.entry2.score
			}
		];
	}

	private toRawGroup(group: TournamentGroup<C>) {
		return {
			scoreboard: {
				entries: group.scoreboard.entries.map(e => ({
					competitor: e.competitor.name,
					wins: e.wins,
					score: e.score
				})),
			},
			currentMatches: group.currentMatches.map(m => this.toRawMatch(m)),
		};
	}

	private toRawTreeNode(node: MatchTreeNode<C>) {
		return {
			state: node.state,
			match: node.match ? this.toRawMatch(node.match) : null,
			children: node.children?.map(c => this.toRawTreeNode(c))
		}
	}

	public toRaw(): RawTournament {
		return {
			id: this.id,
			owner: this.owner,
			meta: {
				name: this.meta.name,
				description: this.meta.description,
				logo: this.meta.logo
			},
			options: {
				liveTracking: this.options.liveTracking
			},
			time: this.time,
			// This is stupid
			competitorType: "players" in this.competitors[0] ? CompetitorType.TEAM : CompetitorType.PLAYER,
			competitors: this.competitors.map(c => {
				if(c instanceof Team) return {name: c.name, members: c.players.map(p => p.name)};
				return c.name;
			}) as string[] | {name: string, members: string[]}[],
			layout: this.layout,
			phase: this.phase,
			startingMatchups: this.startingMatchups?.map(m => m.map(c => c.name)),
			users: this.users.map(u => ({
				id: u.id,
				name: u.name,
				image: u.image,
				isStreamer: u.isStreamer,
				isModerator: u.isModerator,
				hidden: u.hidden
			})),
			state: {
				qualificationState: this.state.qualificationState ? this.toRawGroup(this.state.qualificationState) : null,
				groupState: this.state.groupState ? {
					groups: this.state.groupState.groups.map(group => this.toRawGroup(group))
				} : null,
				mainState: this.state.mainState ? {
					tree: this.toRawTreeNode(this.state.mainState.tree)
				} : null,
				finishedState: this.state.finishedState ? {
					winner: this.state.finishedState.winner.name
				} : null
			}
		}
	}

	private static findCompetitor<C extends Competitor>(competitors: C[], name: string): C {
		return competitors.find(c => c.name === name);
	}

	private static fromRawMatch<C extends Competitor>(rawMatch: RawMatch, competitors: C[]) {
		return new Match<C>(
			new ScoredCompetitor(this.findCompetitor(competitors, rawMatch[0].competitor), rawMatch[0].score),
			new ScoredCompetitor(this.findCompetitor(competitors, rawMatch[1].competitor), rawMatch[1].score)
		);
	}

	private static fromRawGroup<C extends Competitor>(rawGroup: RawTournamentGroup, numWinners: number, competitors: C[]) {
		return new TournamentGroup(
			new Scoreboard(rawGroup.scoreboard.entries.map(e => new ScoreboardEntry(this.findCompetitor(competitors, e.competitor), e.wins, e.score))),
			numWinners,
			rawGroup.currentMatches.map(m => this.fromRawMatch(m, competitors))
		);
	}

	private static fromRawQualificationState<C extends Competitor>(rawGroup: RawTournamentGroup, numWinners: number, competitors: C[]) {
		return new QualificationTournamentState(
			new Scoreboard(rawGroup.scoreboard.entries.map(e => new ScoreboardEntry(this.findCompetitor(competitors, e.competitor), e.wins, e.score))),
			numWinners,
			rawGroup.currentMatches.map(m => this.fromRawMatch(m, competitors))
		);
	}

	private static fromRawTreeNode<C extends Competitor>(rawNode: RawTournamentTreeNode, competitors: C[]): MatchTreeNode<C> {
		return new MatchTreeNode(rawNode.children.map(c => this.fromRawTreeNode(c, competitors)) as [MatchTreeNode<C>, MatchTreeNode<C>], rawNode.state, this.fromRawMatch(rawNode.match, competitors))
	}

	public static fromRaw<C extends Competitor>(raw: RawTournament) {
		const competitors = raw.competitors.map(c => {
			if(raw.competitorType === CompetitorType.TEAM)
				return new Team(c.name, c.members.map(m => new Player(m.name)), c.id);
			return new Player(c.name, c.id);
		}) as C[];
		return new TournamentModel<C>({
			id: raw.id,
			owner: raw.owner,
			meta: new TournamentMeta({
				name: raw.meta.name,
				description: raw.meta.description,
				logo: raw.meta.logo
			}),
			options: new TournamentOptions({
				liveTracking: raw.options.liveTracking
			}),
			time: raw.time,
			competitors,
			layout: new TournamentLayout(raw.layout),
			phase: raw.phase,
			startingMatchups: raw.startingMatchups.map(m => m.map(c => this.findCompetitor(competitors, c))),
			users: raw.users.map(u => new TournamentUser(u)),
			state: new TournamentState([
				raw.state.qualificationState ? this.fromRawQualificationState(
					raw.state.qualificationState,
					raw.layout.competitorsAfterQualification,
					competitors
				) : null,
				raw.state.groupState ? new GroupTournamentState(
					raw.state.groupState.groups.map(g => this.fromRawGroup(g, raw.layout.winnersPerGroup, competitors)),
					raw.layout.winnersPerGroup
				) : null,
				raw.state.mainState ? new MainTournamentState(this.fromRawTreeNode(raw.state.mainState.tree, competitors)) : null,
				raw.state.finishedState ? new FinishedTournamentState(this.findCompetitor(competitors, raw.state.finishedState.winner)) : null
			])
		});
	}
}

export {
	TournamentUser,
	TournamentOptions,
	TournamentMeta
}
export default TournamentModel;
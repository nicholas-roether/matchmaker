import ChangeNotifier from "../utils/classes/change_notifier";
import { Competitor } from "./competitor";

class InvalidTournamentStateError extends Error {
	public readonly cause: string;

	constructor(cause: string) {
		super("The tournament has invalid state: " + cause);
		this.cause = cause;
	}
}


class ScoreboardEntry<C extends Competitor> extends ChangeNotifier {
	public readonly competitor: C;
	private _score: number;

	constructor(competitor: C, score: number = 0) {
		super();
		this.competitor = competitor;
		this._score = score;
	}

	public get score() { return this._score; }

	public set score(newScore) {
		this._score = newScore;
		this.notify("score");
	}
}

class Scoreboard<C extends Competitor> extends ChangeNotifier {
	public readonly entries: ScoreboardEntry<C>[];

	constructor(entries: ScoreboardEntry<C>[]) {
		super();
		this.entries = entries;
		this.passAll(this.entries);
	}

	public getTop(number: number): ScoreboardEntry<C>[] {
		return this.entries.sort((a, b) => a.score - b.score).slice(0, number);
	}

	public getScore(competitor: C): number | null {
		const scoredCompetitor = this.findScoredCompetitor(competitor);
		return scoredCompetitor.score;
	}

	public setScore(competitor: C, setter: number | ((prev: number) => number)): void {
		const scoredCompetitor = this.findScoredCompetitor(competitor);
		if(typeof setter == "number") scoredCompetitor.score = setter;
		else scoredCompetitor.score = setter(scoredCompetitor.score);
	}

	public get competitors(): C[] { return this.entries.map(e => e.competitor); }

	public hasCompetitor(competitor: C): boolean {
		return this.competitors.includes(competitor);
	}

	public static from<C extends Competitor>(competitors: C[], initialScore: number = 0): Scoreboard<C> {
		return new Scoreboard(competitors.map(c => new ScoreboardEntry(c, initialScore)));
	}

	private findScoredCompetitor(competitor: C): ScoreboardEntry<C> | null {
		const scoredCompetitor = this.entries.find(sc => sc.competitor.name == competitor.name);
		if(scoredCompetitor === undefined) return null;
		return scoredCompetitor;
	}
}

class Match<C extends Competitor> extends Scoreboard<C> {
	constructor(entry1: ScoreboardEntry<C>, entry2: ScoreboardEntry<C>) {
		super([entry1, entry2]);
	}

	public getWinner(): ScoreboardEntry<C> {
		return this.getTop(1)[0];
	}

	public getLoser(): ScoreboardEntry<C> {
		return this.getTop(2)[1];
	}

	public get entry1() { return this.entries[0] }

	public get entry2() { return this.entries[1] }

	public get competitors(): [C, C] { return this.entries.map(e => e.competitor) as [C, C]; }

	public static create<C extends Competitor>(competitor1: C, competitor2: C, initialScore?: number): Match<C> {
		return new Match(new ScoreboardEntry(competitor1, initialScore), new ScoreboardEntry(competitor2, initialScore));
	}
}

class TournamentGroup<C extends Competitor> extends ChangeNotifier {
	public readonly scoreboard: Scoreboard<C>;
	public readonly numWinners: number;
	private _currentMatches: Match<C>[];

	constructor(scoreboard: Scoreboard<C>, numWinners: number, matches: Match<C>[] = []) {
		super();
		this.scoreboard = scoreboard;
		this.numWinners = numWinners;
		this._currentMatches = matches;
		this.pass(scoreboard);
	}

	public get currentMatches() { return this._currentMatches; }

	public set currentMatches(newCurrentMatches) {
		this.currentMatches = newCurrentMatches;
		this.notify("currentMatches");
	}

	public addMatch(match: Match<C>) {
		this.currentMatches = [...this.currentMatches, match];
	}

	public removeMatch(match: Match<C>) {
		if(!this.currentMatches.includes(match)) return;
		let matches = this.currentMatches;
		matches.splice(matches.indexOf(match), 1);
		this.currentMatches = matches;
	}

	public getWinners() {
		return this.scoreboard.getTop(this.numWinners);
	}

	public isMember(competitor: C) {
		return this.scoreboard.hasCompetitor(competitor);
	}
}

class QualificationTournamentState<C extends Competitor> extends TournamentGroup<C> {
	constructor(scoreboard: Scoreboard<C>, competitorsAfterQualification: number) {
		super(scoreboard, competitorsAfterQualification);
		if(scoreboard.entries.length < competitorsAfterQualification) throw new InvalidTournamentStateError("More competitors must pass than exist");
	}

	public get competitorsAfterQualification() { return this.numWinners; }
}


class GroupTournamentState<C extends Competitor> extends ChangeNotifier {
	public readonly groups: TournamentGroup<C>[];
	public readonly winnersPerGroup: number;

	constructor(groups: TournamentGroup<C>[], winnersPerGroup: number) {
		super();
		this.winnersPerGroup = winnersPerGroup;
		for(let group of groups)
			if(group.scoreboard.entries.length < winnersPerGroup) throw new InvalidTournamentStateError("More group winners than group members");
		this.groups = groups;
		this.passAll(groups);
	}

	public getResult(): ScoreboardEntry<C>[][] {
		return this.groups.map(group => group.scoreboard.getTop(this.winnersPerGroup));
	}
}

export type MatchTreeNodeState = "inactive" | "ready" | "active" | "finished";

class MatchTreeNode<C extends Competitor> extends ChangeNotifier {
	private _state: MatchTreeNodeState;
	private _match?: Match<C>;
	public readonly children: [MatchTreeNode<C>, MatchTreeNode<C>] | null;

	constructor(children?: [MatchTreeNode<C>, MatchTreeNode<C>], state: MatchTreeNodeState = "inactive", match?: Match<C>) {
		super();
		this.children = children;
		this.state = state;
		this.passAll(children);
	}
 
	public get state() { return this._state; }

	public set state(newState: MatchTreeNodeState) {
		this._state = newState;
		this.notify("state");
	}

	public get match() { return this._match; }
	
	public set match(newMatch) {
		this._match = newMatch;
		this.notify("match");
	}
}

class StartingMatchTreeNode<C extends Competitor> extends MatchTreeNode<C> {
	constructor(match: Match<C>) {
		super(null, "ready", match);
	}
}

class MainTournamentState<C extends Competitor> extends ChangeNotifier {
	public readonly tree: MatchTreeNode<C>;

	constructor(tree: MatchTreeNode<C>) {
		super();
		this.tree = tree;
		this.pass(tree);
	}
}

class FinishedTournamentState<C extends Competitor> {
	public readonly winner: C;

	constructor(winner: C) {
		this.winner = winner;
	}
}

// export type TournamentState<C extends Competitor> = QualificationTournamentState<C> | GroupTournamentState<C> | MainTournamentState<C> | null;

type _TournamentStateTuple<C extends Competitor> = [
	QualificationTournamentState<C>,
	GroupTournamentState<C>,
	MainTournamentState<C>,
	FinishedTournamentState<C>
];

class TournamentState<C extends Competitor> extends ChangeNotifier {
	private readonly states: _TournamentStateTuple<C>
	
	constructor(states: _TournamentStateTuple<C> = [null, null, null, null]) {
		super();
		this.states = states;
	}

	public get qualificationState() { return this.states[0]; }

	public set qualificationState(value) {
		this.updateState(value, 0, "qualification")
	}

	public get groupState() { return this.states[1]; }

	public set groupState(value) {
		this.updateState(value, 1, "group");
	}

	public get mainState() { return this.states[2]; }

	public set mainState(value) {
		this.updateState(value, 2, "main");
	}

	public get finishedState() { return this.states[3]; }

	public set finishedState(value) {
		this.updateState(value, 3, "finished");
	}

	public get current() {
		return this.states.reverse().find(s => s !== null);
	}

	private updateState(value: any, index: number, property: string) {
		const newCurrent = this.states[index] != value;
		this.states[index] = value;
		this.pass(value);
		if(newCurrent) this.notify(property, "current");
		else this.notify(property);
	}
}

export {
	InvalidTournamentStateError,
	ScoreboardEntry,
	Scoreboard,
	Match,
	QualificationTournamentState,
	TournamentGroup,
	GroupTournamentState,
	MatchTreeNode,
	StartingMatchTreeNode,
	MainTournamentState,
	FinishedTournamentState,
	TournamentState
}
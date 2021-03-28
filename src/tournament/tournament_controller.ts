import Database from "../database/database";
import { collapseNestedArray, createGroups, createPairs, groupByIndex } from "../utils/data_utils";
import { isPowerOf } from "../utils/math_utils";
import { Competitor } from "./competitor";
import TournamentDBAdapter from "./tournament_db_adapter";
import TournamentLayout from "./tournament_layout";
import TournamentModel, { TournamentPhase } from "./tournament_model";
import {
	FinishedTournamentState,
	GroupTournamentState,
	MainTournamentState,
	Match,
	MatchTreeNode,
	QualificationTournamentState,
	Scoreboard,
	ScoreboardEntry,
	StartingMatchTreeNode,
	TournamentGroup
} from "./tournament_state";
import TournamentSyncAdapter from "./tournament_sync_adapter";

export enum TournamentSyncType {
	DATABASE,
	REST,
	NONE
}

export interface TournamentCreationArgs<C extends Competitor> {
	owner: string;
	name: string;
	description?: string;
	logo?: string;
	time?: Date;
	qualificationTime?: Date;
	competitors: C[];
	layout: TournamentLayout;
	startingMatchups?: C[][];
}

class TournamentController<C extends Competitor> {
	public readonly tournament: TournamentModel<C>;
	private readonly adapter?: TournamentSyncAdapter<C>;

	constructor(tournament: TournamentModel<C>, syncType: TournamentSyncType, db?: Database) {
		this.tournament = tournament;
		if(syncType == TournamentSyncType.DATABASE)
			this.adapter = new TournamentDBAdapter(tournament, db);
	}

	public advancePhase() {
		switch(this.tournament.phase) {
			case TournamentPhase.PLANNED:
				if(this.tournament.layout.hasQualificationPhase)
					this.advanceToQualification();
				else if(this.tournament.layout.hasGroupPhase) {
					this.advanceToGroup(this.tournament.startingMatchups);
				} else
					this.advanceToMain(collapseNestedArray(this.tournament.startingMatchups));
				break;
			case TournamentPhase.QUALIFICATION:
				this.tournament.phase = TournamentPhase.POST_QUALIFICATION;
				const winners = this.tournament.state.qualificationState.getWinners().map(w => w.competitor);
				if(this.tournament.layout.hasGroupPhase)
					this.tournament.startingMatchups = createGroups(winners, this.tournament.layout.groupSize);
				else
					this.tournament.startingMatchups = createGroups(winners, 2);
				break;
			case TournamentPhase.POST_QUALIFICATION:
				if(this.tournament.layout.hasGroupPhase)
					this.advanceToGroup(this.tournament.startingMatchups);
				else
					this.advanceToMain(collapseNestedArray(this.tournament.startingMatchups));
				break;
			case TournamentPhase.GROUP:
				const result = this.tournament.state.groupState.getResult();
				const matchups = this.matchupsFromGroupResult(result);
				const competitors = collapseNestedArray(matchups);
				this.advanceToMain(competitors);
				break;
			case TournamentPhase.FINISHED:
				this.advanceToFinished(this.tournament.state.mainState.tree.match.getWinner().competitor);
		}
		this.save();
	}

	public disconnect() {
		this.adapter?.disconnect();
	}

	private save() {
		this.adapter?.save();
	}

	private matchupsFromGroupResult(result: ScoreboardEntry<C>[][]) {
		const winners: C[][] = result.map(r => r.map(s => s.competitor));
		const byPlacement: C[][] = groupByIndex(winners, this.tournament.layout.winnersPerGroup);
		byPlacement[1] = [...byPlacement[1].slice(1), byPlacement[1][0]];
		const matchups = groupByIndex(byPlacement, this.tournament.layout.numGroups);
		return matchups;
	}

	private advanceToQualification() {
		this.tournament.phase = TournamentPhase.QUALIFICATION;
		this.tournament.state.qualificationState = TournamentController.createQualificationState(
			this.tournament.competitors,
			this.tournament.layout.competitorsAfterQualification
		);
	}

	private advanceToGroup(groups: C[][]) {
		this.tournament.phase = TournamentPhase.GROUP;
		this.tournament.state.groupState = TournamentController.createGroupState(
			groups,
			this.tournament.layout.winnersPerGroup
		);
	}

	private advanceToMain(competitors: C[]) {
		this.tournament.phase = TournamentPhase.MAIN;
		this.tournament.state.mainState = TournamentController.createMainState(competitors);
	}

	private advanceToFinished(winner: C) {
		this.tournament.phase = TournamentPhase.FINISHED;
		this.tournament.state.finishedState = new FinishedTournamentState(winner);
	}

	public static async createTournament<C extends Competitor>(init: TournamentCreationArgs<C>, db?: Database): Promise<[TournamentModel<C>, TournamentController<C>]> {
		const model = new TournamentModel(init);
		const controller = new TournamentController(model, TournamentSyncType.DATABASE, db);
		await controller.save();
		return [model, controller];
	} 

	private static createScoreboard<C extends Competitor>(competitors: C[]) {
		return new Scoreboard<C>(competitors.map(c => new ScoreboardEntry<C>(c, 0)));
	}

	private static createMatch<C extends Competitor>(competitors: [C, C]) {
		return new Match<C>(new ScoreboardEntry<C>(competitors[0], 0), new ScoreboardEntry<C>(competitors[1], 0));
	}

	private static createMatchTree<C extends Competitor>(competitors: C[]): MatchTreeNode<C> {
		if(!isPowerOf(competitors.length, 2))
			throw new Error("number of competitors must be a power of 2 to create match tree");
		let nodes: MatchTreeNode<C>[] = createPairs(competitors).map(pair => new StartingMatchTreeNode<C>(this.createMatch(pair)));
		while(nodes.length > 1)
			nodes = createPairs(nodes).map(pair => new MatchTreeNode<C>(pair, "inactive"));
		return nodes[0];
	}

	protected static createQualificationState<C extends Competitor>(competitors: C[], competitorsAfterQualification: number) {
		return new QualificationTournamentState<C>(this.createScoreboard(competitors), competitorsAfterQualification);
	}

	protected static createGroupState<C extends Competitor>(groups: C[][], winnersPerGroup) {
		const scoredGroups = groups.map(g => new TournamentGroup<C>(this.createScoreboard(g), winnersPerGroup));
		return new GroupTournamentState<C>(scoredGroups, winnersPerGroup);
	}

	protected static createMainState<C extends Competitor>(competitors: C[]) {
		const tree = this.createMatchTree(competitors);
		return new MainTournamentState<C>(tree);
	}
}

export {
	TournamentSyncAdapter
};

export default TournamentController;
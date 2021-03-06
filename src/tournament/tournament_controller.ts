import { group } from "console";
import { collapseNestedArray, createGroups, createPairs, groupByIndex } from "../utils/data_utils";
import { isPowerOf } from "../utils/math_utils";
import { Competitor } from "./competitor";
import TournamentModel from "./tournament_model";
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

class TournamentController<C extends Competitor> {
	public readonly tournament: TournamentModel<C>;

	constructor(tournament: TournamentModel<C>) {
		this.tournament = tournament;
	}

	public advancePhase() {
		switch(this.tournament.phase) {
			case "planned":
				this.tournament.isInitialState = true;
				if(this.tournament.layout.hasQualificationPhase)
					this.advanceToQualification();
				else if(this.tournament.layout.hasGroupPhase) {
					const groups: C[][] = this.tournament.groups || createGroups(this.tournament.competitors, this.tournament.layout.groupSize);
					this.advanceToGroup(groups);
				} else
					this.advanceToMain(this.tournament.competitors);
				break;
			case "qualification":
				this.tournament.isInitialState = true;
				const winners = this.tournament.state.qualificationState.getWinners().map(w => w.competitor);
				if(this.tournament.layout.hasGroupPhase)
					this.advanceToGroup(createGroups(this.tournament.competitors, this.tournament.layout.groupSize));
				else
					this.advanceToMain(winners);
				break;
			case "group":
				this.tournament.isInitialState = false;
				const result = this.tournament.state.groupState.getResult();
				const matchups = this.matchupsFromGroupResult(result);
				const competitors = collapseNestedArray(matchups);
				this.advanceToMain(competitors);
				break;
			case "main":
				this.tournament.isInitialState = false;
				this.advanceToFinished(this.tournament.state.mainState.tree.match.getWinner().competitor);
		}
	}
	
	public swapCompetitorStarts(competitor1: C, competitor2: C) {
		
	}

	private matchupsFromGroupResult(result: ScoreboardEntry<C>[][]) {
		const winners: C[][] = result.map(r => r.map(s => s.competitor));
		const byPlacement: C[][] = groupByIndex(winners, this.tournament.layout.winnersPerGroup);
		byPlacement[1] = [...byPlacement[1].slice(1), byPlacement[1][0]];
		const matchups = groupByIndex(byPlacement, this.tournament.layout.groups);
		return matchups;
	}

	private advanceToQualification() {
		this.tournament.phase = "qualification";
		this.tournament.state.qualificationState = TournamentController.createQualificationState(
			this.tournament.competitors,
			this.tournament.layout.competitorsAfterQualification
		);
	}

	private advanceToGroup(groups: C[][]) {
		this.tournament.phase = "group";
		this.tournament.state.groupState = TournamentController.createGroupState(
			groups,
			this.tournament.layout.winnersPerGroup
		);
	}

	private advanceToMain(competitors: C[]) {
		this.tournament.phase = "main";
		this.tournament.state.mainState = TournamentController.createMainState(this.tournament.competitors);
	}

	private advanceToFinished(winner: C) {
		this.tournament.phase = "finished";
		this.tournament.state.finishedState = new FinishedTournamentState(winner);
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

export default TournamentController;
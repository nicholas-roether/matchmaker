import mongoose from "mongoose";
import Database, { MongooseModel } from "../database/database";
import { createPairs } from "../utils/data_utils";
import { Competitor, CompetitorType, Player, Team } from "./competitor";
import TournamentSyncAdapter from "./tournament_sync_adapter";
import TournamentLayout from "./tournament_layout";
import TournamentModel, { TournamentMeta, TournamentOptions } from "./tournament_model";
import { FinishedTournamentState, GroupTournamentState, MainTournamentState, Match, MatchTreeNode, QualificationTournamentState, Scoreboard, ScoreboardEntry, ScoredCompetitor, StartingMatchTreeNode, TournamentGroup, TournamentState } from "./tournament_state";

class TournamentDBAdapter<C extends Competitor> extends TournamentSyncAdapter<C>{
	private readonly db: Database;
	private readonly ready: Promise<any>;

	private competitorDocuments: mongoose.Document[];
	private tournamentDocument: mongoose.Document;

	constructor(tournament: TournamentModel<C>, db?: Database, tournamentDocument?: mongoose.Document, competitorDocuments?: mongoose.Document[]) {
		super(tournament);
		this.db = db || new Database();
		const getDocuments = () => this.getDocuments(tournamentDocument, competitorDocuments).catch(e => {throw e});
		this.ready = this.db.connected ? getDocuments() : this.db.connect().then(() => getDocuments());
		this.init();
	}

	private async init() {
		await this.ready;
		this.tournament.addListener(property => {
			switch(property) {
				case "owner":
					this.tournamentDocument.set("owner", mongoose.Types.ObjectId.createFromHexString(this.tournament.owner));
					break;
				case "phase":
					this.tournamentDocument.set("phase", this.tournament.phase);
				case "startingMatchups":
					this.tournamentDocument.set("startingMatchups", this.tournament.startingMatchups?.map(m => m.map(c => this.getCompetitorId(c))));
					break;
				case "users":
					this.tournamentDocument.set("users", this.tournament.users.map(user => ({
						user: mongoose.Types.ObjectId.createFromHexString(user.id),
						isStreamer: user.isStreamer,
						isModerator: user.isModerator,
						hidden: user.hidden
					})));
			}
		});
		this.tournament.state.addListener(property => {
			switch(property) {
				case "qualificationState":
					if(!this.tournament.state.qualificationState) break;
					this.tournamentDocument.get("state").set("qualificationState", {
						scoreboard: this.scoreboardToDocument(this.tournament.state.qualificationState.scoreboard),
						currentMatches: this.tournament.state.qualificationState.currentMatches.map(match => {
							return this.matchToDocument(match);
						})
					});
					break;
				case "groupState":
					if(!this.tournament.state.groupState) break;
					this.tournamentDocument.get("state").set("groupState", {
						groups: this.tournament.state.groupState.groups.map(group => ({
							scoreboard: this.scoreboardToDocument(group.scoreboard),
							currentMatches: group.currentMatches.map(match => this.matchToDocument(match))
						}))
					});
					break;
				case "mainState":
					if(!this.tournament.state.mainState) break;
					this.tournamentDocument.get("state").set("mainState", {
						nodes: this.treeToNodeDocumentArray(this.tournament.state.mainState.tree)	
					});
					break;
				case "finishedState":
					if(!this.tournament.state.finishedState) break;
					this.tournamentDocument.get("state").set("finishedState", {
						winner: this.getCompetitorId(this.tournament.state.finishedState.winner)
					})
			};
			this.tournament.competitors.forEach((competitor, i) => competitor.addListener(property => {
				const doc = this.competitorDocuments[i];
				switch(property) {
					case "name":
						doc.set("name", competitor.name);
						break;
					case "players":
						if(competitor instanceof Team)
							doc.set("members", competitor.players);
				}
			}))
		})
	}

	public async save() {
		await this.ready;
		Promise.all([
			this.tournamentDocument.save(),
			...this.competitorDocuments.map(c => c.save())
		]);
	}

	public disconnect() {
		this.db.disconnect();
	}

	private async getDocuments(tournamentDocument?: mongoose.Document, competitorDocuments?: mongoose.Document[]) {
		this.competitorDocuments = competitorDocuments || await this.getCompetitorDocuments().catch(e => {throw e});
		this.tournamentDocument = tournamentDocument || await this.getTournamentDocument().catch(e => {throw e});
	}

	private async getCompetitorDocuments() {
		return await Promise.all(this.tournament.competitors.map(c => this.getCompetitorDocument(c))).catch(e => {throw e});
	}

	private async getCompetitorDocument(competitor: C) {	
		let data: any = {type: competitor.type, name: competitor.name};
		let id = (await this.db.models.Competitor.findOne({
			type: competitor.type,
			name: competitor.name,
			members: (competitor as any).members ?? []
		}).select("_id").exec()).id ?? competitor.id;
		if(competitor instanceof Team)
			data.members = competitor.players;
		return await this.getDocument(
			this.db.models.Competitor,
			data,
			id ? mongoose.Types.ObjectId.createFromHexString(id) : null
		).catch(e => {throw e});
	}

	private async getTournamentDocument() {
		return await this.getDocument(
			this.db.models.Tournament,
			{
				owner: mongoose.Types.ObjectId.createFromHexString(this.tournament.owner),
				meta: this.tournament.meta,
				options: this.tournament.options,
				time: this.tournament.time,
				competitors: this.competitorDocuments.map(doc => doc._id),
				layout: this.tournament.layout,
				startingMatchups: this.tournament.startingMatchups?.map(m => m.map(c => this.getCompetitorId(c))),
				phase: this.tournament.phase,
				users: this.tournament.users.map(user => ({
					user: mongoose.Types.ObjectId.createFromHexString(user.id),
					isStreamer: user.isStreamer,
					isModerator: user.isModerator,
					hidden: user.hidden
				})),
				state: {
					qualificationState: this.tournament.state.qualificationState ? {
						scoreboard: this.scoreboardToDocument(this.tournament.state.qualificationState.scoreboard),
						currentMatches: this.tournament.state.qualificationState.currentMatches.map(match => {
							return this.matchToDocument(match);
						})
					} : null,
					groupState: this.tournament.state.groupState ? {
						groups: this.tournament.state.groupState.groups.map(group => ({
							scoreboard: this.scoreboardToDocument(group.scoreboard),
							currentMatches: group.currentMatches.map(match => this.matchToDocument(match))
						}))
					} : null,
					mainState: this.tournament.state.mainState ? {
						nodes: this.treeToNodeDocumentArray(this.tournament.state.mainState.tree)
					} : null,
					finishedState: this.tournament.state.finishedState ? {
						winner: this.getCompetitorId(this.tournament.state.finishedState.winner)
					} : null
				}
			},
			this.tournament.id ? mongoose.Types.ObjectId.createFromHexString(this.tournament.id) : null
		).catch(e => {throw e})
	}

	private treeToNodeDocumentArray(tree: MatchTreeNode<C>) {
		let layers: MatchTreeNode<C>[][];
		const findLayers = (node: MatchTreeNode<C>, startAt: number = 0) => {
			if(!layers[startAt]) layers[startAt] = [];
			layers[startAt].push(node);
			if(node.children) node.children.forEach(c => findLayers(c, startAt + 1));
		}
		findLayers(tree);
		const nodes = layers.reverse().reduce((a, p) => a = [...a, ...p]);
		return nodes.map(node => ({
			match: node.match ? this.matchToDocument(node.match) : null,
			state: node.state
		}));
	}

	private scoreboardEntryToDocument(scoreboardEntry: ScoreboardEntry<C>) {
		return {
			competitor: this.getCompetitorId(scoreboardEntry.competitor),
			score: scoreboardEntry.score,
			wins: scoreboardEntry.wins
		};
	}

	private scoreboardToDocument(scoreboard: Scoreboard<C>) {
		return scoreboard.entries.map(entry => this.scoreboardEntryToDocument(entry));
	}

	private scoredCompetitorToDocument(scoredCompetitor: ScoredCompetitor<C>) {
		return {
			competitor: this.getCompetitorId(scoredCompetitor.competitor),
			score: scoredCompetitor.score
		}
	}

	private matchToDocument(match: Match<C>) {
		return {
			entry1: this.scoredCompetitorToDocument(match.entry1),
			entry2: this.scoredCompetitorToDocument(match.entry2)
		}
	}

	private async getDocument(Model: MongooseModel, data: any, id?: mongoose.Types.ObjectId) {
		let doc: mongoose.Document;
		if(id) {
			doc = await Model.findById(id).exec();
			if(doc) return doc;
			throw new Error(`${Model.name} document with id ${id.toHexString()} not found`);
		}
		doc = new Model(data);
		return doc;
	}

	private getCompetitorId(competitor: C) {
		// FIXME Also here; not good to rely on array index synchronosity
		return this.competitorDocuments[this.tournament.competitors.findIndex(c => {
			if(c.name !== competitor.name || c.type !== competitor.type) return false;
			if(c instanceof Team && competitor instanceof Team)
				return c.players.every((player, i) => player.name === competitor.players[i].name)
		})]._id;
	}

	public static async getTournament<C extends Competitor>(id: string) {
		const db = new Database();
		const tournamentDoc = await db.models.Tournament.findById(mongoose.Types.ObjectId.createFromHexString(id)).exec();
		if(!tournamentDoc) throw new Error(`Tournament '${id}' could not be found`);
		const competitorDocuments = await Promise.all<mongoose.Document>(tournamentDoc.get("competitor").map(id => {
			const competitor = db.models.Competitor.findById(mongoose.Types.ObjectId.createFromHexString(id));
			if(!competitor) throw new Error(`Tournament contains invalid competitor ${id}`);
			return competitor;
		})).catch(e => { throw e; });
		const tournament = new TournamentModel({
			id,
			owner: tournamentDoc.get("owner"),
			meta: new TournamentMeta(tournamentDoc.get("meta")),
			options: new TournamentOptions(tournamentDoc.get("options")),
			time: tournamentDoc.get("time"),
			competitors: competitorDocuments.map(competitorDoc => {
				switch(competitorDoc.get("type")) {
					case CompetitorType.PLAYER:
						return new Player(competitorDoc.get("name"), competitorDoc.id);
					case CompetitorType.TEAM:
						return new Team(
							competitorDoc.get("name"),
							competitorDoc.get("members"),
							competitorDoc.id
						)
				}
			}),
			layout: new TournamentLayout({
				numCompetitors: tournamentDoc.get("layout").numCompetitors,
				hasGroupPhase: tournamentDoc.get("layout").hasGroupPhase,
				numGroups: tournamentDoc.get("layout").numGroups,
				winnersPerGroup: tournamentDoc.get("layout").winnersPerGroup,
				hasQualificationPhase: tournamentDoc.get("layout").hasQualificationPhase,
				competitorsAfterQualification: tournamentDoc.get("layout").competitorsAfterQualification
			}),
			phase: tournamentDoc.get("phase"),
			state: (() => {
				const qualificationDoc = tournamentDoc.get("state").qualificationState;
				const groupDoc = tournamentDoc.get("state").groupState;
				const mainDoc = tournamentDoc.get("state").mainState;
				const finishedState = tournamentDoc.get("state").finishedState;
				return new TournamentState<C>([
					qualificationDoc ? new QualificationTournamentState(
						this.createScoreboard<C>(qualificationDoc.scoreboard),
						qualificationDoc.currentMatches.map(m => this.createMatch<C>(m)),
						qualificationDoc.competitorsAfterQualification
					) : null,
					groupDoc ? new GroupTournamentState(
						groupDoc.groups.map(group => this.createTournamentGroup(group, tournamentDoc.get("layout").winnersPerGroup)),
						tournamentDoc.get("layout").winnersPerGroup
					) : null,
					mainDoc ? new MainTournamentState(this.createMatchTree(mainDoc.nodes)) : null,
					finishedState ? new FinishedTournamentState(finishedState.winner) : null
				]);
			})()
		});
	}

	private static createMatchTree<C extends Competitor>(nodes: any[]) {
		const numStartingNodes = Math.log2(nodes.length + 1) - 1;
		let lastLayer: MatchTreeNode<C>[] = nodes.slice(0, numStartingNodes).map(node => {
			return new StartingMatchTreeNode<C>(this.createMatch(node.match));
		});
		const createTree = (startingIndex: number) => {
			if(lastLayer.length >= 1) return;
			lastLayer = createPairs(lastLayer).map((pair, i) => new MatchTreeNode<C>(
				pair,
				nodes[startingIndex + i].state
			));
		};
		createTree(numStartingNodes);
		return lastLayer[0];
	}

	private static createScoredCompetitor<C extends Competitor>(document: any): ScoredCompetitor<C> {
		return new ScoredCompetitor(this.createCompetitor(document.competitor), document.score);
	}

	private static createMatch<C extends Competitor>(document: any): Match<C> {
		return new Match(
			this.createScoredCompetitor(document.entry1),
			this.createScoredCompetitor(document.entry2)
		)
	}

	private static createCompetitor<C extends Competitor>(document: any): C {
		switch(document.get("type")) {
			case CompetitorType.PLAYER:
				return new Player(document.name, document.id) as C;
			case CompetitorType.TEAM:
				return new Team(document.name, document.members?.map(m => new Player(m)), document.id) as unknown as C;
		}
	}

	private static createScoreboardEntry<C extends Competitor>(document: any): ScoreboardEntry<C> {
		return new ScoreboardEntry(this.createCompetitor(document.competitor), document.wins, document.score);
	}

	private static createScoreboard<C extends Competitor>(document: any): Scoreboard<C> {
		return new Scoreboard(document?.entries.map(e => this.createScoreboardEntry(e)) || []);
	}
	
	private static createTournamentGroup<C extends Competitor>(document: any, numWinners: number): TournamentGroup<C> {
		return new TournamentGroup(
			this.createScoreboard(document.scoreboard),
			numWinners,
			document.currentMatches?.map(match => this.createMatch(match))
		);
	}
} 

export default TournamentDBAdapter;
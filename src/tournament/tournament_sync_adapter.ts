import { Competitor } from "./competitor";
import TournamentModel from "./tournament_model";

abstract class TournamentSyncAdapter<C extends Competitor> {
	public readonly tournament: TournamentModel<C>;

	constructor(tournament: TournamentModel<C>) {
		this.tournament = tournament;
	}

	public abstract save(): void;

	public abstract disconnect(): void;
}

export default TournamentSyncAdapter;
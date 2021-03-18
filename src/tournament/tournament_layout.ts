import { divides, isPowerOf, nextLowerPowerOf } from "../utils/math_utils";

export interface TournamentLayoutInit {
	numCompetitors: number;
	hasGroupPhase: boolean;
	numGroups?: number;
	winnersPerGroup?: number;
	hasQualificationPhase: boolean;
	competitorsAfterQualification?: number;
}

class InvalidTournamentError extends Error {
	public readonly invalidLayout: TournamentLayout;

	constructor(invalidLayout: TournamentLayout) {
		super("This tournament layout is invalid:\n" + JSON.stringify(invalidLayout, null, 3));
		this.invalidLayout = invalidLayout;
	}
}

class TournamentLayout {
	public readonly numCompetitors: number;
	public readonly hasGroupPhase: boolean;
	public readonly numGroups?: number;
	public readonly winnersPerGroup?: number;
	public readonly hasQualificationPhase: boolean;
	public readonly competitorsAfterQualification?: number;

	constructor({
		numCompetitors,
		hasGroupPhase,
		numGroups,
		winnersPerGroup,
		hasQualificationPhase,
		competitorsAfterQualification
	}: TournamentLayoutInit) {
		this.numCompetitors = numCompetitors;
		this.hasGroupPhase = hasGroupPhase;
		this.numGroups = numGroups;
		this.winnersPerGroup = winnersPerGroup;
		this.hasQualificationPhase = hasQualificationPhase;
		this.competitorsAfterQualification = competitorsAfterQualification;

		if(!this.isValid()) throw new InvalidTournamentError(this);
	}


	private isValid(): boolean {
		if(this.hasGroupPhase) {
			if(!isPowerOf(this.numGroups, 2)) return false;
			if(!isPowerOf(this.winnersPerGroup, 2)) return false;
		} else if(!isPowerOf(this.numCompetitors, 2)) {
			return false;
		}

		const beforeGroups = this.hasQualificationPhase 
			? this.competitorsAfterQualification
			: this.numCompetitors;
		if(!divides(this.numGroups, beforeGroups)) return false;
		if(beforeGroups / this.numGroups >= this.winnersPerGroup) return false;
		return true;
	}

	public get groupSize() {
		if(this.numGroups !== null)
			return this.numCompetitors / this.numGroups;
	}

	/**
	 * This function checks whether a tournament without a qualification
	 * phase can be created for a number of competitors with group sizes of
	 * 4 or 5.
	 * 
	 * This means checking whether the number is a power of two, or a
	 * power of two multiplied with five which is not five itself.
	 * 
	 * @param number The number of competitors to check.
	 */
	public static isGoodCompetitorNumber(number: number): boolean {
		return isPowerOf(number, 2) || (number > 5 && isPowerOf(number / 5, 2));
	}

	public static nextGoodCompetitorNumber(number: number): number {
		if(number % 2 == 1) number++;
		while(!this.isGoodCompetitorNumber(number)) number += 2;
		return number;
	}

	public static prevGoodCompetitorNumber(number: number): number | null {
		if(number < 2) return null;
		if(number % 2 == 1) number--;
		while(!this.isGoodCompetitorNumber(number)) number -= 2;
		return number;
	}

	public static idealTournamentLayout(competitors: number): TournamentLayout | null {
		if(competitors % 2 == 1) return null;
		let hasQualificationPhase = false;
		let competitorsAfterQualification = null;
		if(!this.isGoodCompetitorNumber(competitors)) {
			hasQualificationPhase = true;
			competitorsAfterQualification = this.prevGoodCompetitorNumber(competitors);
		}
		const hasGroupPhase = competitors > 4;
		return new TournamentLayout({
			numCompetitors: competitors,
			hasGroupPhase: hasGroupPhase,
			numGroups: hasGroupPhase ? nextLowerPowerOf(competitors / 4, 2) : null,
			winnersPerGroup: 2,
			hasQualificationPhase,
			competitorsAfterQualification
		});
	}
}

export default TournamentLayout;

export {
	InvalidTournamentError
}
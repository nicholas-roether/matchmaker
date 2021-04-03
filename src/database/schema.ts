import mongoose from "mongoose";
import { CompetitorType } from "../tournament/competitor";
import { TournamentPhase } from "../tournament/tournament_model";
import { isPowerOf } from "../utils/math_utils";

const CompetitorSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		enum: Object.values(CompetitorType),
		required: true
	},
	members: [{
		name: {
			type: String,
			required: true
		}
	}]
});

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: String,
	image: String,
	createdAt: {
		type: Date,
		default: new Date()
	},
	updatedAt: {
		type: Date,
		default: new Date()
	}
});

const TournamentLayoutSchemaType = {
	numCompetitors: {
		type: Number,
		required: true
	},
	hasGroupPhase: {
		type: Boolean,
		required: true
	},
	numGroups: Number,
	winnersPerGroup: Number,
	hasQualificationPhase: {
		type: Boolean,
		required: true
	},
	competitorsAfterQualification: Number
}

const ScoreboardEntrySchemaType = {
	competitor: {
		type: mongoose.Types.ObjectId,
		ref: "competitor",
		required: true
	},
	score: {
		type: Number,
		default: 0
	},
	wins: {
		type: Number,
		default: 0
	}
}

const ScoreboardSchemaType = [ScoreboardEntrySchemaType];

const ScoredCompetitorSchemaType = {
	competitor: {
		type: mongoose.Types.ObjectId,
		ref: "competitor",
		required: true
	},
	score: {
		type: Number,
		default: 0
	}
}

const MatchSchemaType = {
	entry1: {
		type: ScoredCompetitorSchemaType,
		required: true
	},
	entry2: {
		type: ScoredCompetitorSchemaType,
		required: true
	}
}

const TournamentGroupSchemaType = {
	scoreboard: {
		type: ScoreboardSchemaType,
		required: true,
	},
	currentMatches: [MatchSchemaType]
}

const GroupStateSchemaType = {
	groups: {
		type: [TournamentGroupSchemaType],
		required: true
	}
}

const MatchTreeNodeSchemaType = {
	match: MatchSchemaType,
	state: {
		type: String,
		enum: [
			"ready",
			"active",
			"finished"
		]
	}
}

const MainStateSchemaType = {
	nodes: {
		type: [MatchTreeNodeSchemaType],
		required: true,
		validate: [val => isPowerOf(val.length + 1, 2), "Number of nodes is invalid"]
	}
}

const TournamentStateSchemaType = {
	qualificationState: TournamentGroupSchemaType,
	groupState: GroupStateSchemaType,
	mainState: MainStateSchemaType,
	finishedState: {
		winner: {
			type: String,
			required: true
		}
	}
}

const TournamentMetaSchemaType = {
	name: {
		type: String,
		default: "Unnamed Tournament"
	},
	description: {
		type: String,
		default: ""
	},
	logo: String
}

const TournamentOptionsSchemaType = {
	liveTracking: {
		type: Boolean,
		default: false
	}
}

const TournamentSchema = new mongoose.Schema({
	owner: {
		type: mongoose.Types.ObjectId,
		ref: "user",
		required: true
	},
	meta: TournamentMetaSchemaType,
	options: TournamentOptionsSchemaType,
	time: Date,
	competitors: {
		type: [mongoose.Types.ObjectId],
		ref: "competitor",
		required: true
	},
	layout: {
		type: TournamentLayoutSchemaType,
		required: true
	},
	startingMatchups: {
		type: [[mongoose.Types.ObjectId]],
		ref: "competitor"
	},
	phase: {
		type: String,
		enum: Object.values(TournamentPhase),
		required: true
	},
	users: {
		type: [{
			user: {
				type: mongoose.Types.ObjectId,
				ref: "user",
				required: true
			},
			isStreamer: {
				type: Boolean,
				default: false
			},
			isModerator: {
				type: Boolean,
				default : false
			},
			hidden: {
				type: Boolean,
				default: false
			}
		}],
		default: []
	},
	state: {
		type: TournamentStateSchemaType,
		default: {}
	}
});

export {
	UserSchema,
	CompetitorSchema,
	TournamentSchema
}
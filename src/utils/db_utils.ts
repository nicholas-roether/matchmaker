import Hashids from "hashids";
import * as mongoose from "mongoose";

function encodeObjectId(id: string | mongoose.Types.ObjectId): string {
	if(!id) return;
	const hashids = new Hashids();
	const hexString = typeof id === "string" ? id : id.toHexString();
	return hashids.encodeHex(hexString);
}

function decodeObjectId(id: string): mongoose.Types.ObjectId {
	if(!id) return;
	const hashids = new Hashids();
	const hexString = hashids.decodeHex(id);
	return mongoose.Types.ObjectId.createFromHexString(hexString);
}

export {
	encodeObjectId,
	decodeObjectId
}
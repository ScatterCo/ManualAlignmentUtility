'use strict'
const math = require('mathjs');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length !== 2) {
	console.error("Requires two metadata files as input");
	process.exit(1);
}

console.log("Processing input files:");
console.log("Aligned Metadata: " + args[0]);
console.log("    Raw Metadata: " + args[1]);

// The modified metadata with matrices from meshlab
var alignedMetadata = JSON.parse(fs.readFileSync(args[0], 'utf8'));

// The raw metadata from depthkit, should only be the depth to color transformations
var rawMetadata = JSON.parse(fs.readFileSync(args[1], 'utf8'));

if (alignedMetadata.perspectives.length !== rawMetadata.perspectives.length) {
	console.error("Number of perspectives in aligned and raw metadata must be identical");
	process.exit(1);
}

for (let perspectiveId = 0; perspectiveId < alignedMetadata.perspectives.length; perspectiveId++) {
	console.log(`Processing perspective ${perspectiveId}`);

	let exAligned = alignedMetadata.perspectives[perspectiveId].extrinsics;
	let exRaw = rawMetadata.perspectives[perspectiveId].extrinsics;
	let m1 = math.matrix([
		[exAligned.e00, exAligned.e01, exAligned.e02, exAligned.e03],
		[exAligned.e10, exAligned.e11, exAligned.e12, exAligned.e13],
		[exAligned.e20, exAligned.e21, exAligned.e22, exAligned.e23],
		[exAligned.e30, exAligned.e31, exAligned.e32, exAligned.e33]
	]);

	// Apply the inverse of whatever baked in extrinsics exist in the OBJs, as defined by the raw exported metadata
	let m2 = math.inv(math.matrix([
		[exRaw.e00, exRaw.e01, exRaw.e02, exRaw.e03],
		[exRaw.e10, exRaw.e11, exRaw.e12, exRaw.e13],
		[exRaw.e20, exRaw.e21, exRaw.e22, exRaw.e23],
		[exRaw.e30, exRaw.e31, exRaw.e32, exRaw.e33]
	]));

	// Account for the fact that Depthkit flips the Y axis when exporting OBJs
	let mirrorY = math.matrix([
		[1, 0, 0, 0],
		[0, -1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);

	// Apply the transformations, constructing a new extrinsic matrix
	let m1m2 = math.multiply(mirrorY, math.multiply(math.multiply(m1, m2), mirrorY));

	// Store the result
	alignedMetadata.perspectives[perspectiveId].extrinsics = {
		e00: m1m2.subset(math.index(0, 0)),
		e01: m1m2.subset(math.index(0, 1)),
		e02: m1m2.subset(math.index(0, 2)),
		e03: m1m2.subset(math.index(0, 3)),
		e10: m1m2.subset(math.index(1, 0)),
		e11: m1m2.subset(math.index(1, 1)),
		e12: m1m2.subset(math.index(1, 2)),
		e13: m1m2.subset(math.index(1, 3)),
		e20: m1m2.subset(math.index(2, 0)),
		e21: m1m2.subset(math.index(2, 1)),
		e22: m1m2.subset(math.index(2, 2)),
		e23: m1m2.subset(math.index(2, 3)),
		e30: m1m2.subset(math.index(3, 0)),
		e31: m1m2.subset(math.index(3, 1)),
		e32: m1m2.subset(math.index(3, 2)),
		e33: m1m2.subset(math.index(3, 3))
	};
}

console.log("Saving output file");

// Save the modified output
fs.writeFileSync('./output_metadata.txt', JSON.stringify(alignedMetadata, null, 4))
console.log("Done");

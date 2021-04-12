# ManualAlignmentUtility

A utility script to merge two metadata files for use with a manual alignment workflow.

## Installation

- [NodeJS v10](https://nodejs.org/download/release/latest-v10.x/)

Clone the repo, then install the dependencies using npm:

```
npm -i
```

## Usage

This script takes two Depthkit metadata files as input: first, the metadata containing the manually aligned extrinsic matrices from MeshLab. Second, the raw metadata file from Depthkit.

```
node index.js "path/to/aligned_metadata.txt" "path/to/raw_metadata.txt"
```

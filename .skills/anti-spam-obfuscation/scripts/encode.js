// Utility script for local testing or CI validation to verify Base64 string correctness
const fs = require('fs');
const encodeTarget = (str) => Buffer.from(str).toString('base64');
console.log("Obfuscated string output: ", encodeTarget(process.argv[2] || ""));

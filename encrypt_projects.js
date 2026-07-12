#!/usr/bin/env node
/*
 * encrypt_projects.js
 * -------------------------------------------------------------------------
 * Encrypts _projects_source.html and bakes the ciphertext into projects.html
 * so the Projects page can only be read with the correct password.
 *
 * Usage:
 *   node encrypt_projects.js "<your-password>"
 *
 * Crypto: AES-256-GCM, key = PBKDF2-SHA256(password, salt, 200000 iterations).
 * Output payload (base64): [16-byte salt][12-byte IV][ciphertext + 16-byte tag]
 * This exactly matches the Web Crypto decryption in projects.html.
 * -------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ITERATIONS = 200000;
const SOURCE = path.join(__dirname, "_projects_source.html");
const PAGE = path.join(__dirname, "projects.html");
const MARKER = /var ENCRYPTED_PAYLOAD = "[^"]*";/;

const password = process.argv[2];
if (!password) {
  console.error('Error: no password provided.\nUsage: node encrypt_projects.js "<your-password>"');
  process.exit(1);
}

const plaintext = fs.readFileSync(SOURCE, "utf8");

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");

const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();

const payload = Buffer.concat([salt, iv, ciphertext, tag]).toString("base64");

let page = fs.readFileSync(PAGE, "utf8");
if (!MARKER.test(page)) {
  console.error("Error: could not find ENCRYPTED_PAYLOAD marker in projects.html");
  process.exit(1);
}
page = page.replace(MARKER, 'var ENCRYPTED_PAYLOAD = "' + payload + '";');
fs.writeFileSync(PAGE, page, "utf8");

console.log("Encrypted " + plaintext.length + " chars -> " + payload.length + " base64 chars.");
console.log("Baked payload into projects.html. Remember your password: it is NOT stored anywhere.");

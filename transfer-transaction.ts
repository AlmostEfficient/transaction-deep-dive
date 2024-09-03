import fetch from 'node-fetch';
import bs58 from "bs58";
import * as ed from '@noble/ed25519';
import fs from 'fs/promises';

const cluster = "https://api.devnet.solana.com";
const KEYPAIR_FILE = 'sender_keypair.json';

class PublicKey {
	key: Uint8Array;

	constructor(key: Uint8Array) {
		this.key = key;
	}

	static fromBase58(str: string): PublicKey {
		return new PublicKey(bs58.decode(str));
	}

	toBase58(): string {
		return bs58.encode(this.key);
	}

	toBuffer(): Buffer {
		return Buffer.from(this.key);
	}
}

class Keypair {
	secretKey: Uint8Array;
	publicKey: PublicKey;

	constructor(secretKey: Uint8Array, publicKey: PublicKey) {
		this.secretKey = secretKey;
		this.publicKey = publicKey;
	}

	static async generate(): Promise<Keypair> {
		const secretKey = ed.utils.randomPrivateKey();
		const publicKey = new PublicKey(await ed.getPublicKeyAsync(secretKey));

		return new Keypair(secretKey, publicKey);
	}

	static fromSecretKey(secretKey: Uint8Array): Keypair {
		const publicKey = new PublicKey(ed.utils.getExtendedPublicKey(secretKey).slice(0, 32));
		return new Keypair(secretKey, publicKey);
	}

	toJSON(): string {
		return JSON.stringify({
			secretKey: bs58.encode(this.secretKey),
			publicKey: this.publicKey.toBase58()
		});
	}

	static fromJSON(json: string): Keypair {
		const { secretKey, publicKey } = JSON.parse(json);
		return new Keypair(bs58.decode(secretKey), PublicKey.fromBase58(publicKey));
	}
}

(async function main() {
	try {
		console.log("Starting script...");

		// Get or create sender keypair
		const senderKeypair = await getOrCreateKeypair();
		console.log("Sender public key:", senderKeypair.publicKey.toBase58());

		// Check sender balance
		let senderBalance = await getBalance(senderKeypair.publicKey);
		console.log("Sender balance:", senderBalance);

		// Request airdrop if balance is low
		if (senderBalance < 500000000) { // Less than 0.5 SOL
			console.log("Requesting airdrop...");
			const airdropResult = await requestAirdrop(senderKeypair.publicKey, 1000000000); // 1 SOL
			console.log("Airdrop result:", airdropResult);

			console.log("Waiting for airdrop to be processed...");
			await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

			senderBalance = await getBalance(senderKeypair.publicKey);
			console.log("Updated sender balance:", senderBalance);
		}

		// Generate a recipient keypair
		const recipientKeypair = await Keypair.generate();
		console.log("Recipient public key:", recipientKeypair.publicKey.toBase58());

		// The program we want to interact with. For SOL transfers, we use the System Program
		const systemProgram = PublicKey.fromBase58("11111111111111111111111111111111");

		// Get a recent blockhash
		const blockhash = await getLatestBlockhash();
		const amount = 100000000; // 0.1 SOL
		const amountBuffer = Buffer.alloc(8);
		
		// A buffer is 8 bytes, so we can fit the amount in a 64 bit little endian integer
		amountBuffer.writeBigUInt64LE(BigInt(amount));

		// Build the transaction
		console.log("Building transaction...");
		const addresses = [
			0x03, // Number of addresses
			...senderKeypair.publicKey.toBuffer(),
			...recipientKeypair.publicKey.toBuffer(),
			...systemProgram.toBuffer(), // this program is hardcoded for SOL transfers
		];

		const header = [
			0x01, // Required signatures count - sender
			0x00, // Read-only signed accounts count
			0x01, // Read-only unsigned accounts count - system program
		];

		const instructions = [
			0x01, // Number of instructions
			
			// Instruction 1 details
			0x02, // Program index - think of this like a function selector (we want function #2)

			// Account indices involved in this instruction
			0x02, // Number of accounts
			0x00, // Account index 0 (source)
			0x01, // Account index 1 (destination)

			// Instruction data
			0x0c, // Length of instruction data (12 bytes)

			// Instruction type 
			// the number 2 as a 4-byte little endian integer
			0x02, 0x00, 0x00, 0x00, // 2 = Transfer instruction
			// this could also be
			// 0x01, 0x00, 0x00, 0x00, // 1 = TransferChecked instruction
			// 0x00, 0x00, 0x00, 0x00, // 0 = TransferCheckedWithFee instruction

			// Instruction parameters
			...amountBuffer // Amount in lamports (8-byte little-endian)
		];

		const message = [
			...header,
			...addresses,
			...blockhash,
			...instructions,
		];

		// Sign the message
		const sig1 = await ed.signAsync(Buffer.from(message), senderKeypair.secretKey.subarray(0, 32));
		const signatures = [
			0x01, // Number of signatures
			...sig1,
		];

		// Put it all together into a single transaction
		const tx = [
			...signatures,
			...message,
		];

		// Send the transaction to the blockchain
		console.log("Transaction result:", await sendTransaction(Buffer.from(tx)));
		// Wait for transaction to be processed
		console.log("Waiting for transaction to be processed...");
		await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

		// Check balances after transfer
		console.log("Checking balances...");
		const finalSenderBalance = await getBalance(senderKeypair.publicKey);
		const recipientBalance = await getBalance(recipientKeypair.publicKey);
		console.log("Final sender balance:", finalSenderBalance);
		console.log("Recipient balance:", recipientBalance);

		console.log("Script completed successfully.");

	} catch (error) {
		console.error("Error:", error);
	}
})();


// API for interacting with the blockchain
async function rpc(method: string, params: any): Promise<any> {
	const res = await fetch(cluster, {
		method: "post",
		body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
		headers: { 'Content-Type': 'application/json' }
	});
	const json = await res.json();
	if (json.error) {
		throw new Error(`RPC error: ${JSON.stringify(json.error)}`);
	}
	return json;
}

// API for getting free native tokens
async function requestAirdrop(address: PublicKey, amount: number): Promise<any> {
	return await rpc("requestAirdrop", [address.toBase58(), amount]);
}

// API for getting a recent blockhash
async function getLatestBlockhash(): Promise<Buffer> {
	const { result } = await rpc("getLatestBlockhash", [{ "commitment": "processed" }]);
	if (!result || !result.value || !result.value.blockhash) {
		throw new Error(`Invalid getLatestBlockhash response: ${JSON.stringify(result)}`);
	}
	return Buffer.from(bs58.decode(result.value.blockhash));
}

// API for sending a transaction
async function sendTransaction(tx: Buffer): Promise<any> {
	return await rpc("sendTransaction", [
		tx.toString("base64"),
		{ "skipPreflight": true, "encoding": "base64" }
	]);
}

// API for getting account balance
async function getBalance(address: PublicKey): Promise<number> {
	const { result } = await rpc("getBalance", [address.toBase58()]);
	return result.value;
}

// Helper functions for saving and loading keypair to avoid airdrop limits
async function saveKeypair(keypair: Keypair): Promise<void> {
	await fs.writeFile(KEYPAIR_FILE, keypair.toJSON());
}

async function loadKeypair(): Promise<Keypair | null> {
	try {
		const data = await fs.readFile(KEYPAIR_FILE, 'utf8');
		return Keypair.fromJSON(data);
	} catch (error) {
		return null;
	}
}

async function getOrCreateKeypair(): Promise<Keypair> {
	const savedKeypair = await loadKeypair();
	if (savedKeypair) {
		console.log("Loaded existing keypair");
		return savedKeypair;
	}
	const newKeypair = await Keypair.generate();
	await saveKeypair(newKeypair);
	console.log("Created and saved new keypair");
	return newKeypair;
}
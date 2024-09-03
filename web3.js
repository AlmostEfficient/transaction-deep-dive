const web3 = require('@solana/web3.js');
const bs58 = require('bs58');

function bufferToHex(buffer) {
	return buffer.toString('hex');
}

const connection = new web3.Connection('https://api.devnet.solana.com');

// Create sender and receiver keypairs 
const sender = web3.Keypair.generate();
const receiver = web3.Keypair.generate();

console.log("Sender public key:", sender.publicKey.toBase58());
console.log("Receiver public key:", receiver.publicKey.toBase58());

const transferAmount = 0.1;

// Create a transfer instruction
const instruction = web3.SystemProgram.transfer({
	fromPubkey: sender.publicKey,
	toPubkey: receiver.publicKey,
	lamports: web3.LAMPORTS_PER_SOL * transferAmount
});

// Create a transaction and add the instruction
const transaction = new web3.Transaction().add(instruction);

const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;

// Sign the transaction
transaction.sign(sender);

console.log('\n## Transaction Structure');
console.log('Signatures:');
transaction.signatures.forEach((sig, index) => {
	console.log(`  ${index}: ${bufferToHex(sig.signature)}`);
});

console.log('\nMessage:');
const message = transaction.compileMessage();
console.log(`  Header: ${JSON.stringify(message.header)}`);
console.log('  Account Keys:');
message.accountKeys.forEach((key, index) => {
	console.log(`    ${index}: ${key.toBase58()}`);
});
console.log(`  Recent Blockhash: ${message.recentBlockhash}`);
console.log('  Instructions:');
message.instructions.forEach((ix, index) => {
	console.log(`    ${index}: {`);
	console.log(`      Program ID Index: ${ix.programIdIndex}`);
	console.log(`      Accounts: ${JSON.stringify(ix.accounts)}`);
	console.log(`      Data (hex): ${bufferToHex(ix.data)}`);
	console.log('    }');
});

console.log('\n## Raw Transaction');
const rawTransaction = transaction.serialize();
console.log(`Serialized Transaction (hex): ${bufferToHex(rawTransaction)}`);

console.log('\n## Instruction detail');
console.log('  Instructions:');
message.instructions.forEach((ix, index) => {
	console.log(`    ${index}: {`);
	console.log(`      Program ID Index: ${ix.programIdIndex}`);
	console.log(`      Accounts: ${JSON.stringify(ix.accounts)}`);
	console.log(`      Data (hex): ${ix.data}`);

	// Decode the instruction data
	const dataString = ix.data.toString();

	console.log('      Decoded Data:');

	// Try to parse the data if it's base58 encoded
	try {
		const decodedData = bs58.decode(dataString);
		console.log(`        Decoded Base58: ${Buffer.from(decodedData).toString('hex')}`);

		if (decodedData.length >= 12) {
			const instructionIndex = decodedData[0];
			// Create a Buffer from the lamports bytes
			const lamportsBuffer = Buffer.from(decodedData.slice(4, 12));
			// Read the lamports value as a little-endian 64-bit unsigned integer
			const lamports = lamportsBuffer.readBigUInt64LE(0);

			console.log(`        Instruction Index: ${instructionIndex}`);
			console.log(`        Instruction Type: ${getInstructionType(instructionIndex)}`);
			console.log(`        Lamports: ${lamports} (${Number(lamports) / web3.LAMPORTS_PER_SOL} SOL)`);
		} else {
			console.log(`        Instruction data too short to decode`);
		}
	} catch (error) {
		console.log(`        Unable to decode as Base58: ${error.message}`);
	}

	console.log('      Account Meanings:');
	ix.accounts.forEach((accountIndex, i) => {
		const accountPubkey = message.accountKeys[accountIndex];
		console.log(`        ${i}: ${accountPubkey.toBase58()} (${getAccountRole(i)})`);
	});

	console.log('    }');
});

// Helper function to get instruction type
function getInstructionType(index) {
	const instructionTypes = {
		0: 'CreateAccount',
		1: 'Assign',
		2: 'Transfer',
		3: 'CreateAccountWithSeed',
		// ... other instruction types ...
	};
	return instructionTypes[index] || 'Unknown';
}

// Helper function to get account role
function getAccountRole(index) {
	switch (index) {
		case 0:
			return 'Source (from)';
		case 1:
			return 'Destination (to)';
		default:
			return 'Unknown';
	}
}
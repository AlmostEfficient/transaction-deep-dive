// This code has not been run/tested
const web3 = require('@solana/web3.js');

let payer = web3.Keypair.generate();
let receiver = new web3.PublicKey('RECEIVER_PUBLIC_KEY');
let connection = new web3.Connection(web3.clusterApiUrl("devnet"));

async function legacyTx() {
    let transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: receiver,
            lamports: web3.LAMPORTS_PER_SOL, // Sending 1 SOL
        }),
    );

    let signature = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [payer],
    );

    console.log('Transaction signature', signature);
}

async function versionedTransaction() {
	let blockhash = await connection
		.getLatestBlockhash()
		.then(res => res.blockhash);

	const instructions = [
		web3.SystemProgram.transfer({
			fromPubkey: payer.publicKey,
			toPubkey: receiver.publicKey,
			lamports: web3.LAMPORTS_PER_SOL,
		}),
	];

	const messageV0 = new web3.TransactionMessage({
		payerKey: payer.publicKey,
		recentBlockhash: blockhash,
		instructions,
	}).compileToV0Message();
	
	const transaction = new web3.VersionedTransaction(messageV0);

	// sign your transaction with the required `Signers`
	transaction.sign([payer]);

	const txid = await connection.sendTransaction(transaction);
	console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);	
}
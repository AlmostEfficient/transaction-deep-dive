// This code belongs to 
// https://twitter.com/zelimirfedoran
// https://github.com/zfedoran

import fetch from 'node-fetch';
import bs58 from "bs58";
import * as ed from '@noble/ed25519';

const cluster = "https://api.testnet.solana.com";

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
}

(async function main() {
    // User keypair, this is the account that will pay for the transaction fee
    const keypair = await Keypair.generate();

    // Request some free SOL, only works on devnet/testnet
    console.log(await requestAirdrop(keypair.publicKey, 10000000)); // 0.01 SOL

    // Wait for the transaction to be processed by the blockchain so that our
    // next transaction doesn't fail
    await new Promise(resolve => setTimeout(resolve, 1000));

    // The program we want to interact with. The memo program is a simple
    // program that lets you store a string of data on the blockchain. It's a
    // good example program to start with.
    // https://github.com/solana-labs/solana-program-library/tree/master/memo
    const program = PublicKey.fromBase58("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

    // A recent blockhash (Solana requires a recent blockhash for every
    // transaction in order to prevent replay attacks and to limit its cache
    // size)
    const blockhash = await getLatestBlockhash();

    // A message that we're going to send to the blockchain. In this case, lets
    // send a sha256 hash of a message I received to prove publicly that I have
    // seen it.
    const msg = Buffer.from('754d83e11643565264e7e8b564c503aac7c5fb5037e608bbf22bb701c5ff3d0f', "utf-8");

    // Lets build the transaction. (usually, you'd use `npm install
    // @solana/web3.js` for this)

    // Here is what we're aiming for:
    // https://github.com/solana-labs/solana/blob/987e8eeeaf441e2cbf5285d3a3a8add36d658127/sdk/src/transaction/mod.rs#L150-L190

    // Doing this by hand so you can see how simple transactions are.
    const addresses = [
        0x02, // Number of addresses

        ...keypair.publicKey.toBuffer(),
        ...program.toBuffer(),
    ];

    const header = [
        // 3 byte header
        0x01, // Required signatures count
        0x00, // Read-only signed accounts count
        0x01, // Read-only unsigned accounts count
    ]

    const instructions = [
        0x01, // Number of instructions

        ...[ // Memo instruction
            0x01, // Program index

            0x00, // Empty array of addresses

            ...[ // Opaque Data
                msg.length,
                ...msg,
            ]
        ],

        // We can add more instructions here if we want, but we only need one.
        // We can call multiple programs in a single transaction.

        // Some programs require addresses to be passed to them. Here is an example
        // of how to do that. The memo program doesn't require any addresses, so
        // we don't need to do this for this example.

        /*
        ...[ // Memo instruction with addresses array... for some reason
            0x01, // Program index
            ...[  // List of addresses provided to the instruction
                0x02, // Number of addresses
                0x00, // Address
                0x00, // Address
            ],
            ...[ // Opaque Data
                msg.length,
                ...msg,
            ]
        ],
        */
    ]

    // Put it all together into a single message
    const message = [
        ...header,
        ...addresses,
        ...blockhash,
        ...instructions
    ]

    // Sign the message
    const sig1 = await ed.signAsync(Buffer.from(message), keypair.secretKey.subarray(0, 32));
    const signatures = [
        0x01, // Number of signatures
        ...sig1,
    ]

    // Put it all together into a single transaction
    const tx = [
        ...signatures,
        ...message,
    ]

    // Send the transaction to the blockchain
    console.log(tx.length);
    console.log(await sendTransaction(Buffer.from(tx)));
})();

// API for interacting with the blockchain
async function rpc(method:string, params:any) : Promise<any> {
    const res = await fetch(cluster, {
        method: "post",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params, }),
        headers: {'Content-Type': 'application/json'}
    });
    const json = await res.json();
    return json;
}

// API for getting free native tokens
async function requestAirdrop(address: PublicKey, amount: number) : Promise<any> {
    return await rpc("requestAirdrop", [ address.toBase58(), amount ]);
}

// API for getting a recent blockhash
async function getLatestBlockhash() : Promise<Buffer> {
    const { result } = await rpc("getRecentBlockhash", [{ "commitment":"processed" }]);
    return Buffer.from(bs58.decode(result.value.blockhash))
}

// API for sending a transaction
async function sendTransaction(tx: Buffer) : Promise<any> {
    return await rpc("sendTransaction", [
        tx.toString("base64"),
        { "skipPreflight": true, "encoding": "base64" }
    ]);
}

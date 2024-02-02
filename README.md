# transaction-deep-dive
A deep dive into Solana transactions and how they work

![image](https://github.com/AlmostEfficient/transaction-deep-dive/assets/42661870/c8066219-ddc2-47af-ae3c-d764c1ba53d7)

## Table of contents
What is a transaction?  
Lifecycle of a transaction  
Parts of a transaction  
Fees + how they're calculated  
Different versions of transactions  
Why transactions fail & how to retry them  
Handling tx sends in your apps - retries etc.  
Barebones tx build  

## Transaction failure vs rejection 
Bots spam 1000 MEV transactions to make $1, cost of 1000 transactions is <$1, net positive.

"Failed" transaction = transaction was invalid, was not added to the chain.

Failed transactions are still confirm by the chain, still pay a fee to block producers. 

"Failed" in this case means the smart contract logic didn't execute as the sender desired (example: wanted to swap 1 SOL for $102 instead of $100, but the price shot up). 

With low transaction fees, lots of people (and bots) run txns with a chance they might fail. 

A true transaction "failure" is when a user clicks submit on a wallet but never gets confirmation. 

Reasons a tx may fail:
- wallet didn't send it to the RPC
- RPC didn't broadcast it to the chain
- txn didn't make it to a block producer before the blockhash expired (congestion/routing issue)
- Exceeded compute unit

## Buildspace explanation
Going back to Transaction Town.

All modifications to data on the Solana network happen through transactions. All transactions interact with programs on the network - these can be system programs or user built programs. Transactions tell the program what they want to do with a bunch of instructions, and if they're valid, the program does the things!

Wtf do these instructions look like? They contain:

- an identifier of the program you intend to invoke
- an array of accounts that will be read from and/or written to
- data structured as a byte array that is specified to the program being invoked

If this feels like a lot, don't worry, it'll all click as we get things going!

The last argument is an array of signers. These are keypairs that "sign" the transaction so the Solana runtime and the program you're sending it to know who has authorized the transaction. Certain transactions require signatures from multiple parties so it's not always one address here.


### ix explanation
In essence, an instruction contains:

An array of keys of type AccountMeta
The public key/address of the program you're calling
Optionally - a Buffer containing data to pass to the program
Starting with keys - each object in this array represents an account that will be read from or written to during a transaction's execution. This way the nodes know which accounts will be involved in the transaction, which speeds things up! This means you need to know the behavior of the program you are calling and ensure that you provide all of the necessary accounts in the array.

Each object in the keys array must include the following:

pubkey - the public key of the account
isSigner - a boolean representing whether or not the account is a signer on the transaction
isWritable - a boolean representing whether or not the account is written to during the transaction's execution
The programId field is fairly self explanatory: it’s the public key associated with the program you want to interact with. Gotta know who you want to talk to!

The main thing to note is that the first signer included in the array of signers on a transaction is always the one responsible for paying the transaction fee. What happens if you don't have enough SOL? The transaction is dropped!


## AI Gen
I. Introduction
A. Brief overview of Solana as a blockchain platform <-- cringe
B. Importance of understanding Solana transactions <-- cringe
C. Objectives of the blog post <-- cringe

II. Understanding the Basics of Transactions
A. Definition of a Transaction in the Blockchain Context <-- cringe, what other context bro
B. Specific Characteristics of Solana Transactions <-- you're either a tx or ur not wtf are characteristics
C. Comparison with Transactions in Other Blockchain Systems <-- why? mental state bloat

III. The Lifecycle of a Solana Transaction
A. Initiation: How Transactions are Created
B. Propagation: Transmission to the Solana Network
C. Verification: Role of Validators in Transaction Processing <-- not necessary
D. Confirmation: Achieving Consensus and Recording on the Ledger <-- why do I care
E. Finality: Ensuring Irreversibility of Transactions

IV. Anatomy of a Solana Transaction
A. Essential Components of a Solana Transaction
1. Inputs: Sender's Details
2. Outputs: Recipient's Details
3. Signatures: Ensuring Security and Authenticity
B. Smart Contracts and Instructions
C. Metadata and Additional Fields

V. Transaction Fees in Solana
A. Factors Influencing Transaction Fees
B. Fee Calculation Mechanism
C. Comparison with Fee Structures in Other Blockchains
D. Tips for Minimizing Transaction Fees

VI. Understanding Versioned Transactions
A. Definition and Purpose of Versioned Transactions
B. How Versioned Transactions Work in Solana
C. Benefits and Limitations of Versioned Transactions
D. Use Cases and Real-World Examples

VII. Advanced Topics
A. Cross-Chain Transactions and Solana
B. Scalability Solutions and Their Impact on Transactions
C. Security Considerations in Transaction Processing
D. Future Developments and Upgrades in Solana Transaction Technology

VIII. Conclusion
A. Recap of Key Points Covered
B. The Significance of Transactions in the Solana Ecosystem
C. Encouragement for Further Learning and Exploration

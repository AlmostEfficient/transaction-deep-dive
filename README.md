# transaction-deep-dive
A deep dive into Solana transactions and how they work. Video walkthrough + further exlanation: [Everything you need to know about Solana transactions](https://www.youtube.com/watch?v=cu5GNWnN7IU)

## Scripts
- **`memo-transaction.ts`**: A legacy Solana tx that interacts with the memo program, built from scratch without any Solana libraries.
- **`transfer-transaction.ts`**: Transfers SOL from one wallet to another, built from scratch without any Solana libraries.
-  **`legacy-vs-versioned.js`**: An untested script that shows the difference between how legacy and versioned transactions are created.
-  **`web3.js`**: prints out a bunch of info for a transfer tx created with web3.js. Use this to figure out what your raw transactions should look like

## Suggested reading
[Deep dive into versioned transactions (with fancy graphics) - Anvit Mangal](https://anvit.hashnode.dev/versioned-transactions)   
[Jito - Solana Validator 101 transaction processing](https://www.jito.wtf/blog/solana-validator-101-transaction-processing/)   
[Umbra Research - Lifecycle of a Solana transaction](https://www.umbraresearch.xyz/writings/lifecycle-of-a-solana-transaction)   

![image](https://github.com/AlmostEfficient/transaction-deep-dive/assets/42661870/c8066219-ddc2-47af-ae3c-d764c1ba53d7)


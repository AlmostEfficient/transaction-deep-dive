# transaction-deep-dive
A deep dive into Solana transactions and how they work. Video walkthrough + further exlanation: [Everything you need to know about Solana transactions](https://www.youtube.com/watch?v=cu5GNWnN7IU)

![image](https://github.com/AlmostEfficient/transaction-deep-dive/assets/42661870/3d1bc50d-ae9f-4f91-8997-a16c24d20823)

## Scripts
- **`transaction.ts`**: A legacy Solana transaction that interacts with the memo program, built from scratch without any Solana libraries.
-  **`legacy-vs-versioned.js**: An untested script that shows the difference between how legacy and versioned transactions are created.

## Suggested reading
[Deep dive into versioned transactions (with fancy graphics) - Anvit Mangal](https://anvit.hashnode.dev/versioned-transactions)
[Jito - Solana Validator 101 transaction processing](https://www.jito.wtf/blog/solana-validator-101-transaction-processing/)
[Umbra Research - Lifecycle of a Solana transaction](https://www.umbraresearch.xyz/writings/lifecycle-of-a-solana-transaction)
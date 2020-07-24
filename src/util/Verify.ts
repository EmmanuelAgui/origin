import { Block } from '../interface/block';
import { TransctionsInBlock } from '../interface/transcation_in_block';
import md5 from 'md5';
// 验证交易
export function transactionVerify(transactions: TransctionsInBlock[], block: Block) {
    let { numbersOfTransactions, height, merkle } = block;
    let merkleRaw = '';
    let transactionsLength = transactions.length;
    if (numbersOfTransactions !== transactionsLength) {
        return false
    } else {
        for (let index = 0; index < transactionsLength; index++) {
            merkleRaw = md5(merkleRaw + JSON.stringify(transactions[index]))
        }
        return merkleRaw === merkle ? true : false
    }
}
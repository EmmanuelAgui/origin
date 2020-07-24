import { TransctionsInBlock } from './transcation_in_block';

/**
 * 区块模型
 */
export interface Block {
    /**
     * 高度
     */
    height: number;
    /**
     * 签名
     */
    signature: string;
    
    /**
     * 时间戳
     */
    timestamp: number;

    /**
     * 随机数
     */
    nonce: number;

    /**
     * 前块签名
     */
    previousBlockSignature: string;

    /**
     * 区块交易数量
     */
    numbersOfTransactions: number;

    /**
     * 区块交易
     */
    transactions: TransctionsInBlock[]

    /**
     * 默克尔根
     */
    merkle: string;
    
}
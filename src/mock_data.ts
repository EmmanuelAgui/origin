/**
 * 这里为了简单模拟区块头和事件的下载及验证，仅用简单逻辑生成部分区块数据
 * 
 * 打块逻辑：区块签名signature = md5(height+nonce+previousBlockSignature)
 * 区块交易生成逻辑：随机获取一个0-100的整数，作为区块交易数,生成对应笔数的交易
 */
// import {Block} from './src/model/block';
// let blockNum = Math.ceil(Math.random() * 1000)
// indexedDB.open()
// for (let i = 0; i < blockNum; i++) {
//     let block = new Block();
// }
import md5 from 'md5';
import { TransctionsInBlock } from './interface/transcation_in_block';
import { Block } from './interface/block';
import { openDBAndInitStore } from './util/IndexDBUtil'

export class MockData {
    transactions: TransctionsInBlock[] = []
    dbName: string;
    /**
     * 数据库初始化
     * @param name 数据库名
     */
    async init(name: string) {
        this.dbName = name;
        console.log('初始化数据库 开始')
        await openDBAndInitStore(name);
        console.log('初始化数据库 结束')
    }

    /**
     * 生成区块
     */
    async mockBlock() {
        console.log('开始生成区块')
        let that = this;
        // 打开新数据库
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open(this.dbName);
            request.onsuccess  = function(event) {
                let db = (event.target as IDBRequest<IDBDatabase> & {result:any}).result;
                let blockObjectStore = db.transaction('Blocks','readwrite').objectStore('Blocks');                
                // 生成随机数，用以指代链上区块个数
                let blockNum = Math.ceil(Math.random() * 1000);
                console.log('要生成的区块数', blockNum)
                let previousBlockSignature = ''
                for (let height = 1; height <= blockNum; height++) {
                    let block: Block;
                    /**
                     * 时间戳
                     */
                    let timestamp = Date.now();
                    /**
                     * 当前区块交易数量
                     */
                    let numbersOfTransactions = Math.ceil(Math.random() * 10);
                    /**
                     * 区块内交易
                     */
                    let transactions: TransctionsInBlock[] = []
                    /**
                     * 默克尔根
                     */
                    let merkle: string = '';

                    for (let index = 0; index < numbersOfTransactions; index++) {
                        let transaction = { 
                            height: height,
                            index: index
                        }
                        merkle = md5(merkle + JSON.stringify(transaction))
                        transactions.push(transaction)
                        that.transactions.push(transaction)
                        // transactionObjectStore.add(transactions);
                    }
                    /**
                     * 随机数
                     */
                    let nonce = Math.ceil(Math.random() * 100000);

                    let signatureOrigin = `${height}${nonce}${previousBlockSignature}`;
                    /**
                     * 签名
                     */
                    let signature = md5(signatureOrigin)
                    block = {
                        height,
                        signature,
                        timestamp,
                        nonce,
                        previousBlockSignature,
                        numbersOfTransactions,
                        transactions,
                        merkle
                    }
                    previousBlockSignature = signature;
                    blockObjectStore.add(block);                     
                }
                console.log('区块生成结束')
                resolve(true);
            }
        })   
    }

    mockOneBlock() {
        let that = this;
        return new Promise((resolve) => {
            let request = window.indexedDB.open('MiniBlockChain01');
            request.onsuccess  = function(event) {
                let db = (event.target as IDBRequest<IDBDatabase> & {result:any}).result;
                let blockObjectStore = db.transaction('Blocks','readwrite').objectStore('Blocks');
                let request2 = blockObjectStore.getAllKeys();
                request2.onsuccess = () => {
                    let height = request2.result.length;
                    let request3= blockObjectStore.get(height)
                    console.log('request3', request3);
                    request3.onsuccess = () => {
                        that.generateBlock(height + 1, that.transactions, request3.result, blockObjectStore)
                        resolve(true);
                    }
                }
            }
        })
        
    }


    generateBlock(height: number, transactionsInMockBlock: TransctionsInBlock[], previousBlockPropety: any, blockObjectStore: any) {
        let block: Block;
        /**
         * 时间戳
         */
        let timestamp = Date.now();
        /**
         * 当前区块交易数量
         */
        let numbersOfTransactions = Math.ceil(Math.random() * 10);

        /**
         * 区块内交易
         */
        let transactions: TransctionsInBlock[] = []
        /**
         * 默克尔根
         */
        let merkle: string = '';

        for (let index = 0; index < numbersOfTransactions; index++) {
            let transaction = { 
                height: height,
                index: index
            }
            merkle = md5(merkle + JSON.stringify(transaction))
            transactions.push(transaction)
            transactionsInMockBlock.push(transaction)
            // transactionObjectStore.add(transactions);
        }
        /**
         * 随机数
         */
        let nonce = Math.ceil(Math.random() * 100000);

        let signatureOrigin = `${height}${nonce}${previousBlockPropety.previousBlockSignature}`;
        /**
         * 签名
         */
        let signature = md5(signatureOrigin)
        block = {
            height,
            signature,
            timestamp,
            nonce,
            previousBlockSignature: previousBlockPropety.signature,
            numbersOfTransactions,
            transactions,
            merkle
        }
        previousBlockPropety.previousBlockSignature = signature;
        blockObjectStore.add(block);   
    }

    mockTransaction(transactions: TransctionsInBlock[]) {
        console.log('开始执行交易存储')
        return new Promise((resolve,reject) => {
            // 打开数据库
            let request = window.indexedDB.open(this.dbName);
            request.onerror = function(error) {
                console.log('error',error);
            }
            request.onsuccess = function(event) {
                let db = (event.target as IDBRequest<IDBDatabase> & {result:any}).result;
                let transactionObjectStore = db.transaction('Transactions','readwrite').objectStore('Transactions');              
                for (let i = 0; i < transactions.length; i++) {
                    transactionObjectStore.add(transactions[i])
                }
                console.log('交易存储完毕');
                resolve(true)
            }
        })
    }
}

// export class MockData2 {
//     createBlockStore() {
//         // 打开新数据库
//         let request = window.indexedDB.open('MiniBlockChain02');
//         request.onupgradeneeded  = function(event) {
//             let db = (event.target as IDBRequest<IDBDatabase> & {result:any}).result;
//             db.createObjectStore(["Blocks"], {keyPath: 'height'})       
//             let store2 = db.createObjectStore(["Transactions"], {autoIncrement:true})   
//             store2.createIndex('height', 'height', { unique: false });    
//         }
//     }

//     createTransactionStore() {

//     }
// }
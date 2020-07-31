import { Block } from '../interface/block';
import { TransctionsInBlock } from '../interface/transcation_in_block';

/**
 * 打开indexDB
 */
export function openDBAndInitStore(name: string, version: number = 1) {
    return new Promise((resolve,reject)=>{
        let request = indexedDB.open(name,version);
        request.onsuccess = function(event) {
            let db = (event.target as IDBRequest<IDBDatabase>).result;
            resolve(db);
        }
        request.onupgradeneeded  = function(event) {
            let db = (event.target as IDBRequest<IDBDatabase> & {result:any}).result;
            db.createObjectStore(["Blocks"], {keyPath: 'height'});
            db.createObjectStore(["CacheBlocks"], {keyPath: 'height'});  
            let cacheTransactionStore = db.createObjectStore(["CacheTransactions"], {autoIncrement:true});
            cacheTransactionStore.createIndex('height', 'height', { unique: false });
            let transactionStore = db.createObjectStore(["Transactions"], {autoIncrement:true});
            transactionStore.createIndex('height', 'height', { unique: false });
            resolve(db);
        }
    })
}

/**
 * 获取区块ObjectStore
 * @param name db名称 ，MiniBlockChain01  MiniBlockChain02
 */
export async function getBlockObjectStore(name: string, version: number = 1){
    let db = await openDBAndInitStore(name, version);
    let blockObjectStore = (db as IDBDatabase).transaction(['Blocks'],'readwrite').objectStore('Blocks');
    return blockObjectStore;
}

/**
 * 获取临时缓存区块ObjectStore
 * @param name db名称 ，MiniBlockChain01  MiniBlockChain02
 */
export async function getCacheBlockObjectStore(name: string, version: number = 1){
    let db = await openDBAndInitStore(name, version);
    let blockObjectStore = (db as IDBDatabase).transaction(['CacheBlocks'],'readwrite').objectStore('CacheBlocks');
    return blockObjectStore;
}

/**
 * 获取交易ObjectStore
 * @param name db名称 ，MiniBlockChain01  MiniBlockChain02
 */
export async function getTransactionObjectStore(name: string, version: number = 1){
    let db = await openDBAndInitStore(name, version);
    let transactionObjectStore = (db as IDBDatabase).transaction(['Transactions'],'readwrite').objectStore('Transactions');
    return transactionObjectStore
}

/**
 * 获取临时缓存交易ObjectStore
 * @param name db名称 ，MiniBlockChain01  MiniBlockChain02
 */
export async function getCacheTransactionObjectStore(name: string, version: number = 1){
    let db = await openDBAndInitStore(name, version);
    let transactionObjectStore = (db as IDBDatabase).transaction(['CacheTransactions'],'readwrite').objectStore('CacheTransactions');
    return transactionObjectStore
}
/**
 * 根据高度获取临时缓存的区块
 */
export async function getCacheBlockByHeight(height: number) :Promise<Block>{
    let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request = cacheBlockObjectStore.get(height);
        request.onsuccess = () => {
            resolve(request.result);
        }
    })
}


/**
 * 根据高度获取临时缓存的交易
 */
export async function getCacheTransactionsByHeight(height: number) :Promise<TransctionsInBlock[]>{
    let cacheTransactionObjectStore = await getCacheTransactionObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request = cacheTransactionObjectStore.getAll();
        request.onsuccess = () => {
            resolve(request.result.filter(tran => tran.height === height));
        }
    })
}

/**
 * 获取最高已同步的交易
 */
export async function getMaxTransaction() :Promise<TransctionsInBlock | undefined>{
    let transactionObjectStore = await getTransactionObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request = transactionObjectStore.openCursor(null, 'prev');
            request.onsuccess = function(){
                let cursor = request.result!;
            if (cursor) {
                console.log('最高已校验的交易', cursor.value);
                resolve(cursor.value);
            } else {
                resolve(undefined)
            }
        }
    })
}

/**
 * 根据高度获取本地已同步区块
 */
export async function getBlockByHeight(height: number) :Promise<Block | undefined>{
    let blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request= blockObjectStore.get(height)
        request.onsuccess = async () => {
            resolve(request.result)
        }
    })
}


/**
 * 获取本地缓存的未同步的最高区块
 */
export async function getMaxCacheBlock() :Promise<Block | undefined>{
    let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request = cacheBlockObjectStore.openCursor(null, 'prev');
        request.onsuccess = function() {
           let cursor = request.result!;
            if (cursor) {
                        resolve(cursor.value)
            } else {
                resolve(undefined)
            }
        }
    })
}


/**
 * 获取本地已同步的最大区块
 */
export async function getMaxBlockLocal() :Promise<Block | undefined>{
    let blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
    return new Promise((resolve) => {
        let request = blockObjectStore.openCursor(null, 'prev');
        request.onsuccess = function() {
            let cursor = request.result!;
            if (cursor) {
                resolve(cursor.value)
            } else {
                resolve(undefined)
            }
        }
    })
}

 /**
  * 获取链上最大区块高度
  */
export async function getBlockMaxHeight() : Promise<number>{
    let blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
    return new Promise((resolve) => {
        let request = blockObjectStore.getAllKeys();
        request.onsuccess = () => {
            resolve(request.result.length);
        }
    })
}

/**
 * 根据高度查找链上区块
 * @param height 区块高度
 */
export async function findBlockByHeight(height: number){
    let blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
    return new Promise((resolve) => {
        let request= blockObjectStore.get(height)
        request.onsuccess = async () => {
            // this.blockCache.push(request.result);
            let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
            cacheBlockObjectStore.add(request.result);
            resolve(request.result)
        }
    })
}

/**
 * 获取缓存交易的最新交易
 */
export async function getMaxCacheTransaction(): Promise<TransctionsInBlock | undefined> {
    let cacheTransactionObjectStore = await getCacheTransactionObjectStore('MiniBlockChain02');
    return new Promise((resolve)=> {
        let request = cacheTransactionObjectStore.openCursor(null, 'prev');
         request.onsuccess = function() {
                let cursor = request.result!;
            if (cursor) {
                    resolve(cursor.value)
            } else {
                resolve(undefined)
            }
        }
    })
}
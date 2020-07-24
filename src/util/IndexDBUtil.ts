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
            db.createObjectStore(["Blocks"], {keyPath: 'height'})       
            let transactionStore = db.createObjectStore(["Transactions"], {autoIncrement:true})   
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
 * 获取交易ObjectStore
 * @param name db名称 ，MiniBlockChain01  MiniBlockChain02
 */
export async function getTransactionObjectStore(name: string, version: number = 1){
    let db = await openDBAndInitStore(name, version);
    let transactionObjectStore = (db as IDBDatabase).transaction(['Transactions'],'readwrite').objectStore('Transactions');
    return transactionObjectStore
}


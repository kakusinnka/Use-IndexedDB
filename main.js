let db;

// 打开我们的数据库
const request = indexedDB.open("MyTestDatabase", 6);

// 打开失败时
request.onerror = (event) => {
  // 针对此数据库请求的所有错误的通用错误处理器！
  console.error(`数据库错误：${event.target.errorCode}`);
  console.dir(event.target);
};

// 打开成功时
request.onsuccess = (event) => {
  db = event.target.result;
};

// 该事件仅在最新的浏览器中实现
request.onupgradeneeded = (event) => {
  // 保存 IDBDatabase 接口
  const db = event.target.result;

  // 为数据库创建对象存储（objectStore）
  const objectStore = db.createObjectStore("name", { keyPath: "myKey" });
};

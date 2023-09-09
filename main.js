import { customerData } from "./data.js"

let db;
const dbName = "MyTestDatabase";

// 打开我们的数据库
export function openIndexedDB() {

  // 打开我们的数据库
  // open 请求不会立即打开数据库或者开始一个事务。
  // open 函数的 result 是一个 IDBDatabase 对象的实例。
  // open 方法的二个参数是数据库的版本号。
  // 数据库的版本决定了数据库模式（schema），即数据库的对象存储（object store）以及存储结构。
  // 如果数据库不存在，open 操作会创建该数据库，然后触发 onupgradeneeded 事件，你需要在该事件的处理器中创建数据库模式。
  // 如果数据库已经存在，但你指定了一个更高的数据库版本，会直接触发 onupgradeneeded 事件，允许你在处理器中更新数据库模式。
  const request = window.indexedDB.open(dbName, 1);
  // 返回结果类型 IDBOpenDBRequest
  console.dir(request)

  // 打开成功时
  request.onsuccess = (event) => {
    console.info("IndexedDB 被打开了！")

    console.dir(event)
    // 返回结果类型 IDBDatabase
    console.dir(request.result)
    // 返回结果类型 IDBDatabase
    console.dir(event.target.result)
    // 返回 true
    console.log(request.result === event.target.result)
    db = event.target.result;
  };

  // 打开失败时
  request.onerror = (event) => {
    console.error("IndexedDB 打开失败！")
  };

}

// 创建一个对象存储
export function creatObjStore() {
  db.close()
  // 打开我们的数据库
  const request = window.indexedDB.open(dbName, 2);
  console.log("打开新版本 IndexedDB")

  request.onblocked = (event) => {
    // 如果其他的一些页签加载了该数据库，在我们继续之前需要关闭它们。
    console.log("请关闭其他打开了该站点的标签页！");
  };

  // onupgradeneeded 是我们唯一可以修改数据库结构的地方。在这里面，我们可以创建和删除对象存储以及创建和删除索引。
  // 如果 onupgradeneeded 事件成功执行完成，打开数据库请求的 onsuccess 处理器接着会被触发。
  request.onupgradeneeded = (event) => {
    console.info("IndexedDB 版本升级了！")

    // 保存 IDBDatabase 接口
    db = event.target.result;

    // 创建一个对象存储来存储我们客户的相关信息，我们将“ssn”作为键路径
    // 因为 ssn 可以保证是不重复的——或至少在启动项目的会议上我们是这样被告知的。
    const objectStore = db.createObjectStore("customers", { keyPath: "ssn" });

    // 创建一个索引以通过姓名来搜索客户。名字可能会重复，所以我们不能使用 unique 索引。
    objectStore.createIndex("name", "name", { unique: false });

    // 使用邮箱建立索引，我们想确保客户的邮箱不会重复，所以我们使用 unique 索引。
    objectStore.createIndex("email", "email", { unique: true });

    // 使用事务的 oncomplete 事件确保在插入数据前对象存储已经创建完毕。
    objectStore.transaction.oncomplete = (event) => {
      // 将数据保存到新创建的对象存储中。
      // 你需要开启一个事务才能对你创建的数据库进行操作。
      // 事务提供了三种模式：readonly、readwrite 和 versionchange。
      // 定义作用域时，仅指定你需要用到的对象存储。这样，你可以同时运行多个不含互相重叠作用域的事务。
      // 只在必要时指定 readwrite 事务。你可以同时执行多个 readonly 事务，哪怕它们的作用域有重叠；但对于在一个对象存储上你只能运行一个 readwrite 事务。
      const transaction = db.transaction("customers", "readwrite")
      const customerObjectStore = transaction.objectStore("customers");

      customerData.forEach((customer) => {
        // 调用 add() 方法产生的请求的 result 是被添加的数据的键。
        const request = customerObjectStore.add(customer);
        request.onsuccess = (event) => {
          // event.target.result === customer.ssn;
          console.dir(event.target.result)
        };
      });

      // 在所有数据添加完毕后的处理
      transaction.oncomplete = (event) => {
        console.log("事务全部完成了！");
      };

      // 
      transaction.onerror = (event) => {
        // 不要忘记错误处理！
        console.log("事务处理失败了！");
      };
    };
  };
}

// 使用键生成器创建一个对象存储
export function creatObjStoreByAutoIncrement() {
  db.close()
  // 打开 indexedDB。
  const request = indexedDB.open(dbName, 3);

  request.onupgradeneeded = (event) => {
    db = event.target.result;

    // 创建另一个名为“names”的对象存储，并将 autoIncrement 标志设置为真。
    const objStore = db.createObjectStore("names", { autoIncrement: true });

    // 因为“names”对象存储拥有键生成器，所以它的键会自动生成。
    // 添加的记录将类似于：
    // 键：1 => 值："Bill"
    // 键：2 => 值："Donna"
    customerData.forEach((customer) => {
      objStore.add(customer.name);
    });
  };

}

// 从数据库中获取数据
export function getDataFromIndexedDB() {

  const transaction = db.transaction(["customers"]);
  const objectStore = transaction.objectStore("customers");
  const request = objectStore.get("444-44-4444");
  request.onerror = (event) => {
    // 错误处理！
  };
  request.onsuccess = (event) => {
    // 对 request.result 做些操作！
    console.log(`SSN 444-44-4444 对应的名字是 ${request.result.name}. SSN 444-44-4444 对应的年龄是 ${request.result.age}.`);
  };
}

// 更新数据库中的记录
export function updataData() {
  const objectStore = db
    .transaction(["customers"], "readwrite")
    .objectStore("customers");
  const request = objectStore.get("444-44-4444");
  request.onerror = (event) => {
    // 错误处理！
  };
  request.onsuccess = (event) => {
    // 获取我们想要更新的旧值
    const data = event.target.result;

    // 更新对象中你想修改的值
    data.age = 42;

    // 把更新过的对象放回数据库。
    const requestUpdate = objectStore.put(data);
    requestUpdate.onerror = (event) => {
      // 对错误进行处理
      console.info("数据更新失败！");
    };
    requestUpdate.onsuccess = (event) => {
      // 成功，数据已更新！
      console.info("数据已更新！");
    };
  };

}

// 从数据库中删除数据
export function deleteData() {

  const request = db
    .transaction(["customers"], "readwrite")
    .objectStore("customers")
    .delete("444-44-4444");

  request.onsuccess = (event) => {
    // 删除成功！
    console.info("数据删除成功")
  };
}

// 使用游标
export function useCursor() {
  const objectStore = db.transaction("customers").objectStore("customers");

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log(`SSN ${cursor.key} 对应的名字是 ${cursor.value.name}`);

      // 如果你想要继续，那么你必须调用游标上的 continue()。
      // 当你已经到达数据的末尾时（或者没有匹配 openCursor() 请求的条目）你仍然会得到一个成功回调，但是 result 属性是 undefined。
      cursor.continue();
    } else {
      console.log("没有更多记录了！");
    }
  };

}

// getAll 方法
export function getAll() {
  const objectStore = db.transaction("customers").objectStore("customers");

  objectStore.getAll().onsuccess = (event) => {
    console.log(`已获取的所有客户：${event.target.result}`);
    console.dir(event.target.result);
  };

  objectStore.getAllKeys().onsuccess = (event) => {
    console.log(`已获取的所有客户：${event.target.result}`);
    console.dir(event.target.result);
  };
}

// 使用索引
export function useIndex() {
  // 首先，确定你已经在 request.onupgradeneeded 中创建了索引：
  // objectStore.createIndex("name", "name");
  // 否则你将得到 DOMException。

  const objectStore = db.transaction("customers").objectStore("customers");
  const index = objectStore.index("name");

  index.get("Donna").onsuccess = (event) => {
    console.log(`Donna 的 SSN 是 ${event.target.result.ssn}`);
  };

  // 使用常规游标来获取所有客户记录的对象
  index.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      // cursor.key 是名字，如“Bill”，而 cursor.value 是整个对象。
      console.log(
        `名字：${cursor.key}，SSN：${cursor.value.ssn}，电子邮件：${cursor.value.email}`,
      );
      cursor.continue();
    }
  };

  // 使用键游标来获取客户记录的对象的键
  index.openKeyCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      // cursor.key 是名字，如“Bill”，而 cursor.value 是 SSN。
      // 无法直接获取存储对象的其余部分。
      console.log(`Name: ${cursor.key}, SSN: ${cursor.primaryKey}`);
      cursor.continue();
    }
  };

}
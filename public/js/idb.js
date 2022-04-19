// create a variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker'
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    // save reference to the database
    const db = event.target.result;
    
    // create an object store (table) called 'new_transaction' and set it to have an auto incrementing primary key
    db.createObjectstore('new_transaction', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event){
    // when db is successfully created with its object store or simply established a connection, save refernce to db in global variable
    db = event.target.result;

    // check if app is online-- if yes, run uploadExpense() function to send all local db data to api
    if (navigator.onLine){
        uploadTransaction();
    }
};

// upon an error
request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// function will be executed if we aattempt to submit a pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const pizzaObjectStore = transaction.objectStore('new_transaction');

    // add record to obejct store with add method 
    pizzaObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const pizzaObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there is data in indexedDB's store, send it to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type':'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message){
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_pizza'], 'readwrite');

                    // access the new_pizza object store
                    const pizzaObjectStore = transaction.objectStore('new_pizza');

                    // clear all items in your store
                    pizzaObjectStore.clear();

                    alert('All saved pizzas have been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);
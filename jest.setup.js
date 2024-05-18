const fakeIndexedDB = require('fake-indexeddb');

// Set up a global indexedDB mock
global.indexedDB = fakeIndexedDB;
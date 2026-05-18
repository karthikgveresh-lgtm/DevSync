const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const { LeveldbPersistence } = require('y-leveldb');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbPath = path.resolve(__dirname, 'yjs-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// Setup LevelDB persistence
const ldb = new LeveldbPersistence(dbPath);

setPersistence({
  bindState: async (docName, ydoc) => {
    // Load persisted state into the document
    const persistedYdoc = await ldb.getYDoc(docName);
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    ldb.storeUpdate(docName, newUpdates);
    
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    
    // Save new updates to LevelDB
    ydoc.on('update', update => {
      ldb.storeUpdate(docName, update);
    });
  },
  writeState: async (docName, ydoc) => {
    return new Promise(resolve => {
      resolve(); // Handled automatically by the 'update' listener above
    });
  }
});

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

const wss = new WebSocket.Server({ server });
const Y = require('yjs'); // require yjs for encode/apply updates

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Local Yjs WebSocket server running on port ${PORT} with LevelDB persistence`);
});

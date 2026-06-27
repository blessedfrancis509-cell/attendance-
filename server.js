import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

let globalAppState = {
  courses: null,
  registeredUsers: null,
  liveSessions: null
};

app.get('/api/state', (req, res) => {
  res.json(globalAppState);
});

app.post('/api/state', (req, res) => {
  globalAppState = { ...globalAppState, ...req.body };
  res.json({ success: true, timestamp: Date.now() });
});

// Serve static assets from the production build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Support client-side React routing by redirecting all page requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bind to 0.0.0.0 as required by container clouds (including Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server starting up and listening on port ${PORT}`);
});

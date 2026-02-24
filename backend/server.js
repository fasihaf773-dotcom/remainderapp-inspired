const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let tasks = [
    { _id: '1', title: 'ChatGPT ans', datetime: '2025-01-04T10:00', completed: false, starred: true, category: 'alert', createdAt: 1 },
    { _id: '2', title: 'Comp prjct', datetime: '2025-01-02T11:00', completed: false, starred: true, category: 'alert', createdAt: 2 },
    { _id: '3', title: 'Schedule posts', datetime: '2025-01-03T11:00', completed: false, starred: false, category: 'alert', createdAt: 3 },
    { _id: '4', title: 'Comp Surah baqrah tafsir', datetime: '', completed: false, starred: false, category: 'noAlert', createdAt: 4 },
    { _id: '5', title: 'Plan next week content', datetime: '', completed: true, starred: false, category: 'noAlert', createdAt: 5 },
    { _id: '6', title: 'Plan feb month', datetime: '', completed: false, starred: false, category: 'noAlert', createdAt: 6 }
];

let nextId = 7;

app.get('/api/tasks', (req, res) => res.json(tasks));

app.post('/api/tasks', (req, res) => {
    const newTask = { _id: String(nextId++), ...req.body };
    tasks.push(newTask);
    res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
    const idx = tasks.findIndex(t => t._id === req.params.id);
    if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...req.body };
        res.json(tasks[idx]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    tasks = tasks.filter(t => t._id !== req.params.id);
    res.json({ message: 'Deleted' });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
const express = require('express');
const app = express();
const port = 443; // HTTPS port

// Middleware to parse JSON bodies
app.use(express.json());


app.get('/users', async (req, res) => {
    let conn;
    try {
        const rows = [{
            id: 1,
            name: 'Alice',
            email: 'alice@example.com'
        },
        {
            id: 2,
            name: 'Bob',
            email: 'bob@example.com'
        }
        ];
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    } finally {
        if (conn) conn.release();
    }
});

// Define a route to add a new user
app.post('/users', async (req, res) => {
    let conn;
    try {
        console.log(req.body);
        res.status(201).send('User added successfully');
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Error adding user');
    } finally {
        if (conn) conn.release();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
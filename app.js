const express = require('express');
const app = express();

const Database = require('better-sqlite3');
const db = new Database('db.db');
const bcrypt = require("bcrypt");
const session = require('express-session');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

function log (req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
}
app.use(log);

function requireAuth (req, res, next) {
    let logged_in = req.session && req.session.user;
    if (!logged_in) {
        res.redirect('/login.html');
        return;
    }
    next();
};

app.get('/', requireAuth, (req, res) => {
    res.redirect('/index.html');
    //res.sendFile(__dirname + '/public/index.html');
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login.html');
    });
});

app.get('/getCurrentUser', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ username: req.session.user.username, id: req.session.user.id });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

app.get('/getUserProfile', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    const user = db.prepare('SELECT Users.ID, Users.Name, Users.Username, Users.Points, Family.Name as FamilyName, Users.Family as FamilyID FROM Users LEFT JOIN Family ON Users.Family = Family.ID WHERE Users.ID = ?').get(req.session.user.id);
    res.json(user);
});

app.get('/getFamilies', (req, res) => {
    const families = db.prepare('SELECT ID, Name FROM Family').all();
    res.json(families);
});

app.get('/getUserRecentTasks', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    const tasks = db.prepare(`
        SELECT Tasks.Name, Tasks.Points, TiD.Status, TiD.Date
        FROM TiD
        INNER JOIN Tasks ON Tasks.ID = TiD.TaskID
        WHERE TiD.UserID = ?
        ORDER BY TiD.Date DESC
        LIMIT 10
    `).all(req.session.user.id);
    res.json(tasks);
});

app.post('/updateUserProfile', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const { name, username, familyId } = req.body;
    
    // Update name if provided
    if (name) {
        db.prepare('UPDATE Users SET Name = ? WHERE ID = ?').run(name, req.session.user.id);
    }
    
    // Check if new username is already taken (if provided)
    if (username) {
        const existingUser = db.prepare('SELECT ID FROM Users WHERE Username = ? AND ID != ?').get(username, req.session.user.id);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        db.prepare('UPDATE Users SET Username = ? WHERE ID = ?').run(username, req.session.user.id);
        req.session.user.username = username;
    }
    
    // Update family if provided
    if (familyId !== undefined) {
        const familyValue = familyId === '' ? null : familyId;
        db.prepare('UPDATE Users SET Family = ? WHERE ID = ?').run(familyValue, req.session.user.id);
    }
    
    res.json({ success: true });
});

app.get('/getFamilyMembers/:familyId', (req, res) => {
    const familyId = req.params.familyId;
    const members = db.prepare('SELECT ID, Name FROM Users WHERE Family = ?').all(familyId);
    res.json(members);
});

app.post('/createFamily', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const { name } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Family name cannot be empty' });
    }
    
    // Check if family name already exists
    const existingFamily = db.prepare('SELECT ID FROM Family WHERE Name = ?').get(name);
    if (existingFamily) {
        return res.status(400).json({ error: 'Family already exists' });
    }
    
    try {
        db.prepare('INSERT INTO Family (Name) VALUES (?)').run(name);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error creating family' });
    }
});

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        return res.status(201).send("Missing username / password");
    }

    console.log(`Login attempt: ${username} / ${password}`);

    const user = db.prepare('SELECT Username, Password, ID FROM Users WHERE Username = ?').get(username);
    if (!user) {
        res.redirect('/login.html');
        return;
    }


    if (!bcrypt.compareSync(password, user.Password)) {
        res.redirect('/login.html');

        console.log(password, user.Password);
        return;
    }

    req.session.user = { username: user.Username, id: user.ID };
    res.redirect('/index.html');
});

app.post('/signin', (req, res) => {
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let password2 = req.body.password2;

    if (!name || !username || !password || !password2) {
        return res.status(201).send("Missing fields");
    }

    if (password !== password2) {
        return res.status(201).send("Passwords do not match");
    }

    console.log(`Sign in attempt: ${name} / ${username} / ${password} / ${password2}`);

    const existingUser = db.prepare('SELECT Username FROM Users WHERE Username = ?').get(username);
    if (existingUser) {
        return res.status(201).send("Username already taken");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO Users (Name, Username, Password, Points) VALUES (?, ?, ?, 0)')
    .run(name, username, hashedPassword);
    console.log(hashedPassword);
    res.redirect('/login.html');
});

app.get('/getTasksinDay', (req, res) => {
    const rows = db.prepare('SELECT Users.Name as User, Users.ID as UserID, Tasks.Name as Task, Tasks.Points as Points, Status, Date, TiD.ID \
FROM TiD \
INNER JOIN Users ON Users.ID = TiD.UserID \
INNER JOIN Tasks ON Tasks.ID = TiD.TaskID \
ORDER BY Date ASC').all();
    res.json(rows);
});

app.get('/getUsers', (req, res) => {
    const rows = db.prepare('SELECT Name, Points, ID, Username, Password FROM Users \
ORDER BY Points DESC, Name').all();
    res.json(rows);
});

app.get('/getTasks', (req, res) => {
    const rows = db.prepare('SELECT Name, Points, ID FROM Tasks').all();
    res.json(rows);
});

app.post('/addTask', (req, res) => {
    let { taskname, points } = req.body;
    taskname = taskname.toString().trim();
    points = parseInt(points);
    db.prepare('INSERT INTO Tasks (Name, Points) VALUES (?, ?)')
    .run(taskname, points);
    return res.sendStatus(201);
});

app.post('/addUser', (req, res) => {
    let { username } = req.body;
    username = username.toString().trim();
    db.prepare('INSERT INTO Users (Name, Points) VALUES (?, 0)')
    .run(username);
    return res.sendStatus(201);
});

app.post('/assignTask', (req, res) => {
    let { taskID, userID, date } = req.body;
    db.prepare('INSERT INTO TiD (TaskID, UserID, Date, Status) VALUES (?, ?, ?, ?)')
    .run(taskID, userID, date, 0);    
    return res.sendStatus(201);
});

app.post('/completeTask/:id', (req, res) => {
    let id = parseInt(req.params.id);
    let current = db.prepare('SELECT Status FROM TiD WHERE ID = ?').get(id);
    db.prepare('UPDATE TiD SET Status = ? WHERE ID = ?')
    .run(1 - current.Status, id);

    if (current.Status === 0) {
        let taskInfo = db.prepare('SELECT TaskID, UserID FROM TiD WHERE ID = ?').get(id);
        let taskPoints = db.prepare('SELECT Points FROM Tasks WHERE ID = ?').get(taskInfo.TaskID);
        db.prepare('UPDATE Users SET Points = Points + ? WHERE ID = ?')
        .run(taskPoints.Points, taskInfo.UserID);
    } else {
        let taskInfo = db.prepare('SELECT TaskID, UserID FROM TiD WHERE ID = ?').get(id);
        let taskPoints = db.prepare('SELECT Points FROM Tasks WHERE ID = ?').get(taskInfo.TaskID);
        db.prepare('UPDATE Users SET Points = Points - ? WHERE ID = ?')
        .run(taskPoints.Points, taskInfo.UserID);
    }  

    res.sendStatus(201);
});

app.delete('/deleteUser/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM TiD WHERE UserID = ?').run(id);
    db.prepare('DELETE FROM Users WHERE ID = ?').run(id);
    res.json({ success: true });
});

app.delete('/deleteTask/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM TiD WHERE TaskID = ?').run(id);
    db.prepare('DELETE FROM Tasks WHERE ID = ?').run(id);
    res.json({ success: true });
});


app.listen(3001, () => {
    console.log('Server kjører på http://localhost:3001');
});

const express = require('express');
const app = express();

const http = require('http').createServer(app);
const socket = require('socket.io');
const io = socket(http);

const sanitizeMarkdown = require('./markdown.js');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/profile/')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({storage});

const bcrypt = require('bcrypt');
const fs = require('fs');

const PORT = 8080;
const privateDir = `${__dirname}\\private`;

const users = [];
const chatMessages = [];

if(!fs.existsSync(privateDir)) fs.mkdirSync(privateDir);
if(!fs.existsSync(`${privateDir}\\users`)) fs.mkdirSync(`${privateDir}\\users`);

// load chat messages
if(fs.existsSync(`${privateDir}\\chat.json`)) {
    for(const msg of JSON.parse(fs.readFileSync(`${privateDir}\\chat.json`))) {
        chatMessages.push(msg);
    }
}
console.log(`Loaded ${chatMessages.length} chat messages`);

if(!fs.existsSync(`${privateDir}\\chat.json`)) fs.writeFileSync(`${privateDir}\\chat.json`, JSON.stringify(chatMessages));

let loadedUsers = [];
for(const file of fs.readdirSync(`${privateDir}\\users`)) {
    users.push(JSON.parse(fs.readFileSync(`${privateDir}\\users\\${file}`)));
    loadedUsers.push(`\"${file.replace(".json", "")}\"`);
}
console.log(`Loaded users: [${loadedUsers.join(", ")}]`);

app.use(express.json());
app.use(express.static('public'));

app.post('/api/user/register/', (req, res) => {
    const { username, password } = req.body;

    if(runChecks(username, password)) return;

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const user = {
        username,
        password: hash,
        profile: './profile/defualt.png'
    };

    if(users.find(u => u.username === username)) {
        res.status(409).send({ message: 'User already exists' });
        return;
    }

    fs.writeFile(`${privateDir}/users/${username}.json`, JSON.stringify(user), (err) => {
        if (err) {
            res.status(500).send({ message: 'Failed to create user' });
            console.log(err);
            return;
        }

        res.status(200).send({ message: `User "${username}" created`, user });
        users.push(user);
    });
});

app.post('/api/user/login/', (req, res) => {
    const { username, password } = req.body;

    if(runChecks(username, password)) return;

    const user = users.find(u => u.username === username);

    if (!user) {
        res.status(404).send({ message: 'User not found' });
        return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
        res.status(401).send({ message: 'Invalid password' });
        return;
    }

    res.status(200).send({ message: `Successful login to ${user.username}`, user });
});

app.post('/api/user/request/', (req, res) => {
    const { username, password } = req.body;

    if(runChecks(username, password)) return;

    return login(username, password, res);
});

app.post('/api/user/request/self', (req, res) => {
    const { username, password } = req.body;

    if(runChecks(username, password)) return;
    if(!login(username, password)) return res.status(401).send({ message: 'Invalid login' });

    const user = users.find(u => u.username === username);

    if(!user.profile) user.profile = './profile/defualt.png';

    return res.status(200).send({ user, status: 200 });
});

app.post('/api/user/profile/update', upload.single('profile'), (req, res) => {
    try {
        let { username, password } = req.body;
        let file = req.file;

        if(runChecks(username, password)) return;
        if(!login(username, password)) return res.status(401).send({ message: 'Invalid login' });

        // rename the file exactly where it is to the username
        fs.renameSync(file.path, `${file.destination}${username}.png`);

        let user = users.find(u => u.username === username);
        user.profile = `./profile/${username}.png`

        fs.writeFileSync(`${privateDir}\\users\\${username}.json`, JSON.stringify(user));
        return res.status(200).send({ message: 'Profile updated', user });
    } catch(e) {
        console.error(e)
        return res.status(500).send({ message: 'Failed to update profile' });
    }
});    

io.on('connection', (socket) => {

    let username, password;
    
    socket.on('login', (user) => {
        
        if(login(user.username, user.password)) {
            username = user.username;
            password = user.password;
            console.log(`${username} logged in`);

            return socket.emit('login', { message: `Successful login to ${username}`, user });
        }

        socket.emit('error', { type: "Auth", message: 'Invalid login' });
        socket.disconnect();
        return;
    });

    socket.on('requestOldMessages', () => {
        for(const msg of chatMessages) {
            socket.emit('messageReceived', msg.username, msg.msg, msg.profile, true);
        }
    });

    socket.on('message', (msg) => {

        if(!username || !password) {
            socket.emit('error', { type: "auth", message: 'Not logged in' });
            return;
        }

        if(!msg) {
            socket.emit('error', { type: "info", message: 'Missing message' });
            return;
        }

        let profile = users.find(u => u.username === username).profile;

        msg = sanitizeMarkdown(msg);

        chatMessages.push({ username, msg, profile: !profile ? './profile/defualt.png' : profile, created: Date.now() });
        fs.writeFile(`${privateDir}\\chat.json`, JSON.stringify(chatMessages), (err) => {
            if (err) {
                socket.emit('error', { type: "info", message: 'Failed to save message' });
                return;
            }
        });

        io.emit('messageReceived', username, msg, !profile ? './profile/defualt.png' : profile);
    });

    socket.on('disconnect', () => {
        if(!username || !password) {
            console.log("Anonymous disconnected");
            return;
        }

        console.log(`${username} disconnected`);
    });

});

function login(username, password, res) {
    const user = users.find(u => u.username === username);

    if (!user) {
        if(res) return res.status(404).send({ message: 'User not found' });
        return false;
    }

    if (user.password !== password) {
        if(res) return res.status(401).send({ message: 'Invalid password' });
        return false;
    }

    if(res) return res.status(200).send({ message: `Successful login to ${user.username}`, user });
    else return true;
}

function runChecks(username, password, res) {
    if(!username || !password) {
        return res.status(400).send({ message: 'Missing username or password' });
    }

    if(username.length < 3) {
        return res.status(400).send({ message: 'Username too short' });
    }

    if(username.match(/[^a-zA-Z0-9_!&]/)) {
        return res.status(400).send({ message: 'Username contains disallowed characters' });
    }
}

app.use((req, res) => res.status(404).sendFile(__dirname + '\\public\\404.html'));
http.listen(PORT, () => console.log(`Server listening on port ${PORT === 8080 ? 'http://localhost:8080' : PORT}`));
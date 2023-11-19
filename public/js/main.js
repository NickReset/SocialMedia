import { getCookie } from './cookieManager.js';

const socket = io();
const user = JSON.parse(getCookie('user'));
let justLaunched = true;

socket.on('connect', () => {
    socket.emit('login', user);

    console.log(justLaunched);
    if(justLaunched) {
        socket.emit('requestOldMessages');
        justLaunched = false;
    }
});

socket.on('error', (err) => {
    console.error(err);
});

socket.on('messageReceived', (user, msg, pic) => { 
    addMessage(user, msg, pic);
});

document.getElementById('message').addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
        if(e.target.value.trim() === '') return;

        socket.emit('message', e.target.value);
        e.target.value = '';
    }
});

function addMessage(user, msg, pic) {
    let messages = document.querySelector('.messages');
    let message = document.createElement('div');

    let profile = document.createElement('div');
    profile.classList.add('profile');
    profile.innerHTML = `<img src="${pic}" alt="profile">`;

    let username = document.createElement('div');
    username.classList.add('user');
    username.innerHTML = `${user}`;

    let content = document.createElement('div');
    content.classList.add('content');
    content.innerHTML = `${msg}`;
    username.appendChild(content);

    message.classList.add('message');
    message.appendChild(profile);
    message.appendChild(username);
    messages.appendChild(message);

    messages.scrollIntoView(false, { 
        behavior: 'smooth'
    });
}
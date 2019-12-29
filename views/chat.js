let userid = ''
$.get('/username', data => {
    console.log(data) 
    userid = data['username'];
    document.getElementById('chat-content').placeholder = `Username: ${userid}`;
})

function generateChatboxChild(element) {
    let chatboxChild = document.createElement('div');

    chatboxChild.classList.add('media');
    chatboxChild.classList.add('w-50');
    if (userid != element.username) {
        chatboxChild.classList.add('ml-auto');
    }
    chatboxChild.classList.add('mb-3');
    chatboxChild.appendChild('<img src="https://res.cloudinary.com/mhmd/image/upload/v1564960395/avatar_usae7z.svg" alt="user" width="50" class="rounded-circle">')

    let mediaBody = document.createElement('div');
    mediaBody.classList.add('media-body');

    let messageBox = document.createElement('div');
    if (userid === element.username) {
        messageBox.classList.add('bg-primary');
    }else messageBox.classList.add('bg-light');
    messageBox.classList.add('rounded');
    messageBox.classList.add('py-2');
    messageBox.classList.add('px-3');
    messageBox.classList.add('mb-2');

    let username = document.createElement('p');
    username.classList.add('mb-2');
    username.classList.add('username');
    username.appendChild(document.createTextNode(element.username));
    
    let content = document.createElement('p');
    content.classList.add('mb-0');
    content.classList.add('text-small');
    if (userid === element.username) {
        content.classList.add('text-white');
    }else content.classList.add('text-muted');
    content.appendChild(document.createTextNode(element.content));
    
    let time = document.createElement('p');
    time.classList.add('time');
    time.classList.add('small');
    time.classList.add('text-muted');
    time.appendChild(document.createTextNode(element.timestamp));
    
    if (element.content === '') {
        chatboxChild.classList.add('enter');
        messageBox.classList.add('enter');
        mediaBody.classList.add('enter');
        content.classList.add('enter');
        username.classList.add('center');
        time.classList.add('center');
    }

    messageBox.appendChild(username);
    messageBox.appendChild(content);

    mediaBody.appendChild(messageBox);
    mediaBody.appendChild(time);

    chatboxChild.appendChild(mediaBody);

    return chatboxChild;
}

function tweakHistoryElement(e) {
    const date = new Date(e.timestamp * 1000);
    e.timestamp = `${date.getHours() < 10 ? 0 : ''}${date.getHours()}:${date.getMinutes() < 10 ? 0 : ''}${date.getMinutes()}`

    return e;
}


let sock = new WebSocket('ws://' + window.location.host + '/ws');
let history = [];

sock.onopen = () => {
    sock.send(JSON.stringify({ 'type': 'history' }))
}

sock.onmessage = event => {
    const data = JSON.parse(event.data);
    console.log(data)

    if (data['type'] === 'history') {
        console.log(data['history'])
        history = data['history'].map(tweakHistoryElement);

        let chatbox = document.getElementById('chatbox')

        history.forEach(e => {
            chatbox.appendChild(generateChatboxChild(e))
        })

        chatbox.scrollTop = chatbox.scrollHeight;
    } else if (data['type'] === 'notification' || data['type'] === 'msg') {
        const tweakedData = tweakHistoryElement(data)
        
        history.push(tweakedData);
        
        let chatbox = document.getElementById('chatbox');
        chatbox.appendChild(generateChatboxChild(tweakedData));
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}

sock.onclose = event => {
    console.log('closed now');
    sock.send(JSON.stringify({'type': 'close'}))
}


function sendPost() {
    if (sock.readyState !== 1) return;

    const content = $('input:text').val()
    if (content === '') return;

    sock.send(JSON.stringify({'type': 'msg', content}));

    $('input:text').val('');
}

window.onbeforeunload = () => {
    sock.send(JSON.stringify({'type': 'close'}));

}

document.getElementById('button-addon2').addEventListener('click', sendPost);
document.getElementById('chat-content').addEventListener('keypress', event => {
    if (event.keyCode === 13) {
        event.preventDefault();

        sendPost();
    }
})
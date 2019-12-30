import aiohttp
import aiofiles
import aioredis
import asyncpg

from aiohttp import web
from aiohttp_session import get_session, redis_storage, setup

import time
import json
from random_username.generate import generate_username

async def home(request):
    session = await get_session(request)
    last_visit = session['username'] if 'username' in session else None
    if last_visit == None:
        session['username'] = generate_username(1)[0]

    async with aiofiles.open('./views/index.html', mode='r') as f:
        contents = await f.read()
        return web.Response(text=contents, content_type='text/html')

async def username(request):
    username = (await get_session(request))['username']

    return web.json_response({'username': username})

async def ws(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    redis_pool = request.app['redis_pool']
    conn = request.app['conn']

    username = (await get_session(request))['username']

    join_document = {
        'type': 'notification',
        'username': f'{username} has joined to the chatroom',
        'content': '',
        'timestamp': time.time()
    }

    if not ws in request.app['websockets']:
        for _ws in request.app['websockets']:
            await _ws.send_json(join_document)
        request.app['websockets'].append(ws)

    await conn.execute(f'''INSERT INTO log VALUES ('{join_document['username']}', '{join_document['content']}', '{join_document['timestamp']}')''')
    
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            json_msg = json.loads(msg.data)
            # request for history
            if json_msg['type'] == 'history':
                if not await redis_pool.execute('KEYS', 'AIOHTTP_SESSION_*'):
                    await conn.execute('''TRUNCATE "log"''')

                res = await conn.fetch('''SELECT * FROM log ORDER BY timestamp DESC LIMIT 10''')

                # show message history to the user
                await ws.send_json({'type': 'history', 'history': list(reversed([dict(x) for x in res]))})
            
            # request for post
            elif json_msg['type'] == 'msg':
                document = {
                    'type': 'msg',
                    'username': username,
                    'content': json_msg['content'],
                    'timestamp': time.time()
                }
                for _ws in request.app['websockets']:
                    # send the user message to everyone
                    await _ws.send_json(document)

                # add message to the database
                await conn.execute(f'''INSERT INTO log VALUES ('{document['username']}', '{document['content']}', '{document['timestamp']}')''')
            
            elif json_msg['type'] == 'close':
                await ws.close()
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print(ws.exception())

    request.app['websockets'].remove(ws)

    exit_document = {
        'type': 'notification',
        'username': f'{username} has left the room',
        'content': '',
        'timestamp': time.time()
    }
    for _ws in request.app['websockets']:
        # send message to everyone in the room that user has left the chat
        await _ws.send_json(exit_document)

    await conn.execute(f'''INSERT INTO log VALUES ('{exit_document['username']}', '', '{exit_document['timestamp']}')''')

    return ws


async def main():
    app = web.Application()

    app['websockets'] = []

    # setting up redis
    redis_pool = await aioredis.create_pool('redis://localhost')
    storage = redis_storage.RedisStorage(redis_pool, max_age=600)
    app['redis_pool'] = redis_pool

    # establishing connection to database named "chat"
    conn = await asyncpg.connect(user='miraliahmadli', database='chat', host='127.0.0.1') # user='miraliahmadli'
    app['conn'] = conn

    # clean up
    async def dispose_redis_pool(app):
        try:
            await redis_pool.execute('FLUSHALL')
        except RuntimeError:
            # when no keys are registered in redis
            pass

        # closing redis
        redis_pool.close()
        await redis_pool.wait_closed()

        # removes logs and closes connection to database
        await conn.execute('''TRUNCATE "log"''')
        await conn.close()

    setup(app, storage)
    app.on_cleanup.append(dispose_redis_pool)

    # add routes
    app.router.add_get('/', home)
    app.router.add_get('/username', username)
    app.router.add_get('/ws', ws)

    return app

if __name__ == "__main__":
    web.run_app(main())

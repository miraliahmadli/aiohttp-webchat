# WebChat using aiohttp, redis, PostgreSQL

#### Note: It has been implemented and tested on python 3.8.0, other versions may not work

## Installation and running guide:
Create virtual environment:  
```virtualenv -p python3 .  ```  

```source bin/activate ```

To install dependencies, run:

```pip install -r requirements.txt```

Before running server, `redis` and `postgresql` must be running in the background

### Install Redis
1. Download Redis
    - Using [Homebrew](http://brew.sh):
        ```
        brew install redis

        brew services start redis
        ```
        Brew permission errors? Try `sudo chown -R "$USER":admin /usr/local`

    - Direct [Download](http://redis.io/download)

2. Open & Test Redis:
    - open Terminal

    - **redis-cli ping**
        ```
        $ redis-cli ping
        PONG
        ```

    - **redis-server**
        ```
        $ redis-server
        86750:C 08 Nov 08:17:21.431 # Warning: no config file specified, using the default config. In order to specify a config file use redis-server /path/to/redis.conf
        86750:M 08 Nov 08:17:21.433 * Increased maximum number of open files to 10032 (it was originally set to 256).
                        _._                                                  
                   _.-``__ ''-._                                             
              _.-``    `.  `_.  ''-._           Redis 3.2.5 (00000000/0) 64 bit
          .-`` .-```.  ```\/    _.,_ ''-._                                   
         (    '      ,       .-`  | `,    )     Running in standalone mode
         |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
         |    `-._   `._    /     _.-'    |     PID: 86750
          `-._    `-._  `-./  _.-'    _.-'                                   
         |`-._`-._    `-.__.-'    _.-'_.-'|                                  
         |    `-._`-._        _.-'_.-'    |           http://redis.io        
          `-._    `-._`-.__.-'_.-'    _.-'                                   
         |`-._`-._    `-.__.-'    _.-'_.-'|                                  
         |    `-._`-._        _.-'_.-'    |                                  
          `-._    `-._`-.__.-'_.-'    _.-'                                   
              `-._    `-.__.-'    _.-'                                       
                  `-._        _.-'                                           
                      `-.__.-'                                               

        86750:M 08 Nov 08:17:21.434 # Server started, Redis version 3.2.5
        86750:M 08 Nov 08:17:21.434 * The server is now ready to accept connections on port 6379

        ```
        **Close Redis** with `control` + `c` to quit

### Install PostgreSQL
* Download PostgreSQL
    - Using [Homebrew](http://brew.sh):
        ```
        brew install postgresql

        postgres --version
        postgres (PostgreSQL) 11.1
        ```


### Run Redis and PostgreSQL
To run redis(by default):

`redis-server /usr/local/etc/redis.conf --daemonize yes`

To run postgresql(by default):

`pg_ctl -D /usr/local/var/postgres start`

Also, `postgresql` must have table `log` in database `chat`.  
To automate this particular task, run:  

`./pg.sh`

### Run application
Finally, `python app.py` to run app

Then access `localhost:8080` or `0.0.0.0:8080` to join chat room

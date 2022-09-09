# README

Have the repository cloned onto your **LINUX LAB Machine**.

`git clone git@gitlab.cs.st-andrews.ac.uk:cs3099group03/project-code.git`.

## Dependencies

### ES6 Support

This project is code in ES6. Assuming you are using Node.js version >= 13, which has included support for ES6 support.

> [Node.js v13.x] Experimental support for ES6 support:
> https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_enabling.

One way to do the above is the executing the following commands:

- `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`
- `source ~/.bashrc`
- `nvm install node`

### Packages Installations

#### Front End

- `cd src/back-end`
- `npm install`

#### Back End

- `cd src/front-end/client`
- `npm install`

### Connect to Database

Whether you connect to the database from on-campus or off-campus, you'd have to select a connection mode in `back-end/Database/dbAgent.js`:

```javascript
export let pool = POOL_OFF;     // POOL_ON / POOL_OFF
```

- `POOL_ON`: Connect to database from on-campus.

- `POOL_OFF`: Connect to database from off-campus.

If you connect to database from off campus:

- Run command below in terminal window:

  ```
  ssh -o ProxyCommand=none <username>@<username>.host.cs.st-andrews.ac.uk -L 3306:<username>.host.cs.st-andrews.ac.uk:3306 -N
  ```


  where `<username>` is your university CS account username.

- **DO NOT** terminate and select `POOL_OFF` mode.

> University CS Systems Wiki: [Accessing MySQL using SSH](https://systems.wiki.cs.st-andrews.ac.uk/index.php/Using_SSH#Example:_Tunneling_a_MySQL_connection_via_the_Linux_Host_servers).

## Test

- `cd src/back-end`
- `npm run test`

## Run

### Server

- `cd src/back-end`
- `npm run start` to start the server at port 5000.
- `npm run dev` to start the development mode server.

### Front End

- `cd src/front-end/client`
- `npm run start` to start the server at port 5000.
  - if this fails and gives you an error, try `npm run start_openssl` 
- `npm run dev` to start the development mode server.

For subsequent running of the server and client, you only have to do `npm run dev` in the `src/back-end` and `npm run start` in the `src/front-end/client` directories respectively.

Enjoy!


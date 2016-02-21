Installation
============

Create the postgres database if necessary.

Install packages:
```
npm install
```

Set the environment variables
```
PORT=8000
DATABASE_URL=postgres://localhost/chama_emote_development
```

Run the migrations
```
pg-migrate up
```

Run the server
```
npm start
```

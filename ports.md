This is a document describing where the port needs to change in what files if a port is in use.
This exists for the purpose of automating this process in the future.
The reason is simple and will be left as an exercise for the reader.

all:
- /host/cs3099user03/nginx.d/server.conf

backend:
- project-code/Deliverable2/src/back-end/Server/util.js

frontend:
- project-code/Deliverable2/src/front-end/client/package.json


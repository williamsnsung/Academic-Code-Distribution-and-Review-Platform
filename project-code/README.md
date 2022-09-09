# README

Team 3 Supergroup C

* Recommendations
* Installation and Running Guide
* Additional Instructions
* Dependencies

Source code for our project can be found in the `/src` directory.
Group report for Deliverable 4 can be found in the `/Deliverable4` directory.

## Recommendations

This project is designed to run on the linux lab machines, or a machine with equivalent configuration to that of the school of computer science pc7 and pc9 configurations.
As such, we **STRONGLY** recommend running the project on the school machine via SSH or otherwise as we cannot guarantee our project will work in an unknown environment.

To clone the whole project directory please use the command shown bellow.

`git clone git@gitlab.cs.st-andrews.ac.uk:cs3099group03/project-code.git.`

## Installation and Running Guide

This guide demonstartes the quickest and easiest way to setup and run our implementation, both locally on a linux lab machine (using localhost), and globally via school servers and nginx on https://cs3099user03.host.cs.st-andrews.ac.uk/
Setup and installation outside of the school ecosystem may require further steps not included in this guide. Please make sure you are using the correct group account or machines of type pc7 or pc9 for running locally.

### Local Setup

1. Clone or copy Directory into your own file space on a linux lab machine.
2. Navigate to the `/scripts` directory.
3. Run the Setup script using `./setup` and wait patiently for all dependencies to install. This could take several minutes.
4. Run the Startup script using `./startup` and wait patiently for the server and frontend to start. 
5. Proceed to http://localhost:3102/ where the application is now running. 

### Group Account Setup

1. Clone or copy Directory into your own file space on a linux lab machine.
2. Navigate to the `/scripts` directory.
3. Run `./klovia.sh <USERNAME>` replacing `<USERNAME>` with your own cs username and run the script. This will connect you to the klovia server. If this doesn't work, you may have to connect to klovia manually. Instructions for connecting to school servers can be found on the systems wiki.
4. Once in klovia, navigate back to the same `/scripts` directory and run `./cs3099user03`. This will connect you with our group account for this module. If this doesn't work, open the script and copy + paste the script contents directly into the terminal.
5. Once in the group account, run `cd ~` and then navigate back to the project root directory. **IMPORTANT!**
6. Run `git pull` to verify the contents in the group account are up to date with the project main branch.
7. Navigate to the `/scripts` directory.
8. Run the Startup script using `./startup -s` and wait patiently for the server and frontend to start. 
9. Proceed to https://cs3099user03.host.cs.st-andrews.ac.uk/ where the application is now running.

## Additional Instructions

This section contains additional instructions in the eventuality that a system update or some unforseen issue breaks our scripts or otherwise causes them to fail. If the steps provided in the Installation and Running Guide are enough to set up and run our implementation, DO NOT use these instructions, however if you are experiencing difficulities with our scripts, then these might help you get our project up and running.

### Frontend

Location: `/Deliverable4/src/front-end/client`

* `npm run start:local`: start the front end locally.
* `npm run start:localssl`: alternative start local command for openssl error.
* `npm run start:team3`: start the front end for the group account.
* `npm run start:team3ssl`: alternative start group command for openssl error.

### Server

Location: `/Deliverable4/src/back-end/Server`:

* `npm run start`: start the server in normal mode.
* `npm run start:off`: start the server in off-campus mode for thoose working via ssh.
* `npm run dev`: start the server using nodemon in development mode (will automatically restart the server whenever a file is updated).
* `npm run start:off`: start the server in both off-campus and development mode for thoose working via ssh.
* `npm test`: run our unit test suite.

### Recommender System

Location: `/Deliverable4/src/back-end/RecmdSys`:

* `make run`: retrain CS3099 journal system model
* `make test`: test the model using MovieLens dataset

### Scripts

Location: `/scripts`

* `backend.sh`: This launches the backend of the website.
* `cs3099user03.sh`: This is a template that will connect you to the group account once you are on klovia.
* `frontend.sh`: This launches the frontend of the website.
* `killSite.sh`: This kills the site if it is running in the background.
* `klovia.sh`: This is a template that will connect you to klovia.
* `nginx.sh`: Restarts nginx.
* `setup.sh`: This sets up your node modules and installs node on your machine if you don't have the latest version of it.
* `startup.sh`: This starts up the frontend and backend, with the backend in the foreground of your terminal by default. Adding the -o flag will make the site run in the background

## Dependencies

### Core Dependencies

* Python3 v 3.8
* Node.js v 1.17.10
* pip
* npm

### Front-End

* @codemirror/lang-cpp                    v 0.19.1
* @codemirror/lang-css                    v 0.19.3
* @codemirror/lang-html                   v 0.19.4
* @codemirror/lang-java                   v 0.19.1
* @codemirror/lang-javascript             v 0.19.7
* @codemirror/lang-jso                    v 0.19.2
* @codemirror/lang-markdown               v 0.19.6
* @codemirror/lang-php                    v 0.19.1
* @codemirror/lang-python                 v 0.19.4
* @codemirror/lang-rust                   v 0.19.2
* @codemirror/lang-sql                    v 0.19.4
* @codemirror/lang-xml                    v 0.19.2
* @testing-library/jest-dom               v 5.14.1
* @testing-library/react                  v 11.2.7
* @testing-library/user-event             v 12.8.3
* @uiw/react-codemirror                   v 4.5.1
* axios                                   v 0 .24.0
* bcrypt                                  v 5.0.1
* dotenv                                  v 16.0.0
* history                                 v 5.1.0
* intro.js                                v 5.0.0
* intro.js-react                          v 0.5.0
* react                                   v 17.0.2
* react-dom                               v 17.0.2
* react-router-dom                        v 5.3.0
* react-scripts                           v 4.0.3
* web-vitals                              v 1.1.2

### Server

* axios                     v 0.24.0
* bcrypt                    v 5.0.1
* body-parser               v 1.19.0
* cors                      v 2.8.5
* express                   v 4.17.3
* express-fileupload        v 1.2.1
* express-form-data         v 2.0.17
* fast-csv                  v 4.3.6
* is-image                  v 3.0.0
* jest                      v 27.3.1
* jsonwebtoken              v 8.5.1
* multer                    v 1.4.3
* mysql                     v 2.18.1
* node-schedule             v 2.1.0
* nodemailer                v 6.7.3
* python-shell              v 3.0.1
* socket.io                 v 4.4.1
* url                       v 0.11.0

### Python Recommender System

* numpy
* pandas
* matplotlib
* tensorflow
* tensorflow-recommenders
* tensorflow-datasets

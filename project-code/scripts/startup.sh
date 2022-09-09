#!/bin/bash
#startups both in parallel in the background if the -o (on) flag is in use
running=$(ps | grep 'npm' -c)
if [[ running -eq 2 ]]; then
        printf 'You have already started the site in the background!'
else
        source ~/.bashrc
        source ../bin/activate
        if [[ ${#} -eq 0 ]]; then
                if [[ $(ps | grep 'node' -c) -eq 0 ]]; then
                        nohup bash ./frontendlocal.sh &
                fi
                bash ./backend.sh && fg
        else
                while getopts ":os" optname; do
                        case "${optname}" in                            #https://www.computerhope.com/unix/bash/getopts.htm
                                o)
                                        if [[ $(ls | grep 'nohup.out' -c) -eq 1 ]]; then
                                                rm nohup.out
                                        fi
                                        nohup bash ./backend.sh &
                                        if [[ $(ps | grep 'node' -c) -eq 0 ]]; then
                                                nohup bash ./frontend.sh &
                                        fi
                                        ;;
                                s)
                                        if [[ $(ps | grep 'node' -c) -eq 0 ]]; then
                                                nohup bash ./frontend.sh &
                                        fi
                                        bash ./backend.sh && fg

                                        ;;

                                *)
                                        usage
                                        exit 1
                                        ;;
                        esac
                done
        fi
        exit 0
fi


#!/bin/bash

Xvfb :1 -screen 0 1280x720x24 &
PID_XVFB=$!
sleep 1

tmux split-window -v env DISPLAY=:1 selenium-server -port 1234
sleep 3

tmux split-window -h -t 1 \
  ffmpeg -video_size 1280x720 \
         -framerate 30 \
         -f x11grab \
         -i :1 \
         -vcodec libx264 \
         -f ismv \
         -y \
         record.mp4

python3 main.py -p 1234 "$@"

tmux send-keys -t 2 q
tmux send-keys -t 1 C-c
kill $PID_XVFB

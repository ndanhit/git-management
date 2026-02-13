#!/bin/bash

# Change directory to the script's directory
cd "$(dirname "$0")"

PORT=3333

function start_app() {
    # Check if port is already in use
    if lsof -i :$PORT > /dev/null; then
        echo "App is already running on port $PORT."
        exit 1
    fi

    echo "Starting Git Management Tool on port $PORT..."

    # Check dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    # Check build
    if [ ! -d ".next" ]; then
        echo "Building project..."
        npm run build
    fi

    # Open browser after delay
    (sleep 2 && open http://localhost:$PORT) &

    # Run server
    npm start -- -p $PORT
}

function stop_app() {
    echo "Stopping Git Management Tool on port $PORT..."
    
    # Find PID using lsof
    PID=$(lsof -t -i :$PORT)
    
    if [ -z "$PID" ]; then
        echo "No app found running on port $PORT."
    else
        kill $PID
        echo "Stopped process $PID."
    fi
}

case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 1
        start_app
        ;;
    *)
        # Default behavior if no argument is provided: start
        if [ -z "$1" ]; then
             start_app
        else
            echo "Usage: $0 {start|stop|restart}"
            exit 1
        fi
        ;;
esac

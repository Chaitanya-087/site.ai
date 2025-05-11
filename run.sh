#!/bin/bash

set -euo pipefail

log_info() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - INFO - $1"
}

API_PORT=8080  
UI_PORT=5173

if lsof -i:$API_PORT -t >/dev/null; then
  echo "Process on port $API_PORT is already running."
  exit 1
fi

if lsof -i:$UI_PORT -t >/dev/null; then
  echo "Process on port $UI_PORT is already running."
  exit 1
fi

log_info "Starting the Python API and Vite frontend servers..."

PROJECT_ROOT=$(pwd)
API_DIR="$PROJECT_ROOT/api"
UI_DIR="$PROJECT_ROOT/ui"

if [[ ! -d ".venv" ]]; then
  log_info "Python virtual environment not found. Please run setup.sh first."
  exit 1
fi

# Cleanup function to kill background jobs on script termination
cleanup() {
  log_info "Stopping servers..."
  [[ -n "${API_PID-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${UI_PID-}" ]] && kill "$UI_PID" 2>/dev/null || true
  wait
  log_info "Servers stopped."
}
trap cleanup SIGINT SIGTERM

cd "$API_DIR"
log_info "Starting Python API..."
python serve.py &
API_PID=$!

cd "$UI_DIR"
log_info "Starting Vite development server..."
npm run dev &
UI_PID=$!

log_info "Waiting for both servers to finish..."
wait

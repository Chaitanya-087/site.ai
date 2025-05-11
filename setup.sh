#!/bin/bash

# Define colors
COLOR_RESET="\033[0m"
COLOR_INFO="\033[1;34m"    # Blue for info
COLOR_SUCCESS="\033[1;32m" # Green for success
COLOR_ERROR="\033[1;31m"   # Red for errors

# Function to log info
log_info() {
  echo -e "$(date +"%Y-%m-%d %H:%M:%S") - ${COLOR_INFO}INFO${COLOR_RESET} - $1"
}

# Function to log success
log_success() {
  echo -e "$(date +"%Y-%m-%d %H:%M:%S") - ${COLOR_SUCCESS}SUCCESS${COLOR_RESET} - $1"
}

# Function to log error
log_error() {
  echo -e "$(date +"%Y-%m-%d %H:%M:%S") - ${COLOR_ERROR}ERROR${COLOR_RESET} - $1"
}

# Check if Python virtual environment exists
if [[ ! -d ".venv" ]]; then
  log_info "Creating Python virtual environment..."
  python3 -m venv .venv
  if [[ $? -ne 0 ]]; then
    log_error "Failed to create Python virtual environment. Please ensure Python 3.9 is installed."
    exit 1
  fi
fi

# Check if venv is active
if [[ -z "$VIRTUAL_ENV" ]]; then
  log_info "No virtual environment is active. Activating..."
  source .venv/bin/activate 
  wait
  if [[ $? -ne 0 ]]; then
    log_error "Failed to activate the virtual environment. Exiting..."
    exit 1
  fi
else
  log_info "Virtual environment is already active: $VIRTUAL_ENV"
fi

if [[ $? -ne 0 ]]; then
  log_error "Failed to activate Python virtual environment. Please check your setup."
  exit 1
fi

# Install Python dependencies
log_info "Installing Python dependencies..."
pip install -r api/requirements.txt
if [[ $? -ne 0 ]]; then
  log_error "Failed to install Python dependencies. Please check requirements.txt."
  exit 1
fi

# Install Node.js dependencies for the UI
log_info "Installing Node.js dependencies..."
npm install --prefix ui
if [[ $? -ne 0 ]]; then
  log_error "Failed to install Node.js dependencies. Please ensure Node.js and npm are installed."
  exit 1
fi

log_success "Setup completed successfully."

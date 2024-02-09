#!/bin/bash

# Check if the script is running with sudo
if [ "$(id -u)" != "0" ]; then
    echo "This script requires sudo access. Please run it with sudo."
    exit 1
fi

# Function to check if a package is installed
is_package_installed() {
    dpkg -s "$1" >/dev/null 2>&1
}

# Function for green color echo
green_echo() {
    echo -e "\e[32m$1\e[0m"
}

# Function for blue color echo
blue_echo() {
    echo -e "\e[34m$1\e[0m"
}

# Function for tick symbol
tick() {
    echo -e "\xE2\x9C\x94"
}

# Function for cross symbol
cross() {
    echo -e "\xE2\x9D\x8C"
}

# Function to display the installed package version in green
display_installed_version() {
    installed_version=$(dpkg -s "$1" | grep -i '^version:' | awk '{print $NF}')
    echo -e "\e[32m$1 is already installed (version: $installed_version)\e[0m"
}

# Function to install a package
install_package() {
    echo "$1 is not installed. Installing..."
    sudo apt-get install -y "$1"
    echo "$1 installation finished."
    installed_version=$(dpkg -s "$1" | grep -i '^version:' | awk '{print $NF}')
    echo -e "\e[32m$1 is now installed (version: $installed_version)\e[0m"
}

# Update package lists
echo "Running apt update..."
sudo apt-get update -y

# Check and install docker-compose
if is_package_installed "docker-compose"; then
    display_installed_version "docker-compose"
    docker_installed=true
else
    install_package "docker-compose"
    docker_installed=false
fi

# Check and install npm
# if is_package_installed "npm"; then
#     display_installed_version "npm"
#     npm_installed=true
# else
#     install_package "npm"
#     npm_installed=false
# fi

# Execute nvm installation script
echo "# Executing nvm installation script"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Set up nvm environment without restarting the shell
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
[ -s "${NVM_DIR}/bash_completion" ] && . "${NVM_DIR}/bash_completion"

# Install node
echo "# Installing nodeJS"
nvm install 20
nvm use 20

# Install development tools which are NPM dependencies
echo "# Installing nvm dependencies"
sudo apt -y install build-essential

# Check and install jq
if is_package_installed "jq"; then
    display_installed_version "jq"
    jq_installed=true
else
    install_package "jq"
    jq_installed=false
fi

# Check and install golang-go
if is_package_installed "golang-go"; then
    display_installed_version "golang-go"
    golang_installed=true
else
    install_package "golang-go"
    golang_installed=false
fi

# Check and install pm2 globally
if npm list -g --depth=0 | grep -q "^.* pm2@"; then
    display_installed_version "pm2"
    pm2_installed=true
else
    echo "pm2 is not installed. Installing..."
    sudo npm install -g pm2
    echo "pm2 installation finished."
    installed_version=$(npm list -g --depth=0 pm2 | grep -o "@[0-9.]*" | grep -o "[0-9.]*")
    green_echo "pm2 is now installed (version: $installed_version)"
    pm2_installed=false
fi

echo
echo
echo

# Summary
green_echo "---------------------"
blue_echo "Installation summary:"
green_echo "---------------------"
if $docker_installed; then
    blue_echo "$(cross) docker-compose was already installed."
else
    green_echo "$(tick) docker-compose is now installed."
fi

sudo usermod -aG docker "$(whoami)"

if $npm_installed; then
    blue_echo "$(cross) npm was already installed."
else
    green_echo "$(tick) npm is now installed."
fi

if $jq_installed; then
    blue_echo "$(cross) jq was already installed."
else
    green_echo "$(tick) jq is now installed."
fi

if $golang_installed; then
    blue_echo "$(cross) golang-go was already installed."
else
    green_echo "$(tick) golang-go is now installed."
fi

if $pm2_installed; then
    blue_echo "$(cross) pm2 was already installed."
else
    green_echo "$(tick) pm2 is now installed."
fi

tick
green_echo "$(tick) PLEASE LOGOUT AND RE-LOGIN."

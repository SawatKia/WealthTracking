#!/bin/bash

# Define the target relative path and workspace root
workspace_root=$(pwd)
target_path="backend/v0.2"

# Function to delete coverage and logs folders
clean_folders() {
    echo "Cleaning coverage and logs folders..."
    
    local coverage_path="$workspace_root/$target_path/coverage"
    local logs_path="$workspace_root/$target_path/logs"
    
    # Convert paths to use forward slashes
    coverage_path=$(echo "$coverage_path" | tr '\\' '/')
    logs_path=$(echo "$logs_path" | tr '\\' '/')
    
    # Remove coverage folder if exists
    if [ -d "$coverage_path" ]; then
        echo "Deleting coverage folder..."
        rm -rf "$coverage_path"
    fi
    
    # Remove logs folder if exists
    if [ -d "$logs_path" ]; then
        echo "Deleting logs folder..."
        rm -rf "$logs_path"
    fi
}

# Function to check if the target path is part of the current path
verify_path() {
    local current_path=$(pwd | tr '\\' '/') # Convert Windows backslashes to forward slashes
    if [[ "$current_path" == *"$target_path"* ]]; then
        return 0
    else
        return 1
    fi
}

# Function to locate and cd into the correct path, excluding node_modules
find_and_cd() {
    local base_dir=$(pwd)
    while true; do
        if verify_path; then
            return 0
        fi
        for dir in $(find "$base_dir" -type d -name "backend" \( ! -path "*/node_modules/*" \) 2>/dev/null); do
            if [[ "$dir" == *"$target_path"* ]]; then
                cd "$dir" || exit 1
                return 0
            fi
        done
        cd .. || break
    done
    return 1
}

echo "script starting at $(pwd)"

# Call the clean_folders function
clean_folders

# Check if we are in the correct workspace root, if so, cd directly to target path
if [[ $(pwd | tr '\\' '/') == "$workspace_root" ]]; then
    cd "$target_path" || exit 1
else
    # Attempt to locate the correct path
    if ! find_and_cd; then
        echo "Error: Could not find the '$target_path' directory."
        exit 1
    fi
fi

echo "Running tests in $(pwd)..."
npm test

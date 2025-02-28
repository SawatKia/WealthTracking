#!/bin/bash

# Common logging function for GitHub Actions
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo "::info::$timestamp - $message"
            ;;
        "WARNING")
            echo "::warning::$timestamp - $message"
            ;;
        "ERROR")
            echo "::error::$timestamp - $message"
            ;;
        "DEBUG")
            echo "::debug::$timestamp - $message"
            ;;
        "GROUP")
            echo "::group::$timestamp - $message"
            ;;
        "ENDGROUP")
            echo "::endgroup::"
            ;;
        *)
            echo "$timestamp - $message"
            ;;
    esac
}
#!/bin/bash

BLACKLIST_FILE="/home/sawat/WealthTracking/backend/v0.2/statics/blacklist.json"
NGINX_BLOCKED_FILE="/etc/nginx/conf.d/blocked.conf"

# Ensure the blacklist file exists and has a valid JSON structure
if [[ ! -f "$BLACKLIST_FILE" ]]; then
    echo "Blacklist file not found! Creating a valid empty JSON file..."
    echo '{"blocked_ips":[]}' > "$BLACKLIST_FILE"
fi

echo "Extracting IPs from $BLACKLIST_FILE..."

# Start writing to the Nginx config file
{
    echo "# Auto-generated blacklist"
    
    # Extract and write deny rules
    jq -r '.blocked_ips[] | "deny \(.);" ' "$BLACKLIST_FILE"
    
    # Ensure allow all comes **after** deny rules
    echo "allow all;"
    # overwrite the entire file
} > "$NGINX_BLOCKED_FILE"

# Reload Nginx to apply changes
nginx -t && sudo nginx -s reload

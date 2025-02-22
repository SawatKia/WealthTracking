!/bin/bash

# Define the target relative path and workspace root
WORKSPACE_ROOT=$(pwd)
BLACKLIST_FILE="/home/sawat/WealthTracking/backend/v0.2/statics/blacklist.json"
NGINX_BLOCKED_FILE="/etc/nginx/conf.d/blocked.conf"

# Ensure the blacklist file exists
if [[ ! -f "$BLACKLIST_FILE" ]]; then
    echo "Blacklist file not found!" >&2
    exit 1
fi

echo "Extracting IPs from $BLACKLIST_FILE..."

# extract ips and convert them to Nginx Deby rules
jq -r '.blocked_ips[] | "deny \(.);" ' $BLACKLIST_FILE > $NGINX_BLOCKED_FILE

# reload Nginx to apply changes
nginx -t && sudo nginx -s reload
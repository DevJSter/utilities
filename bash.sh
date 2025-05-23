#!/bin/bash
# Git commands with 5-second delay in an infinite loop

while true; do
    echo -e "\n===== NEW GIT PUSH CYCLE ====="
    echo "Executing Git commands in 5 seconds..."

    echo "Running Git commands now!"

    # Execute Git commands
    echo "Adding all changes..."
    git add .

    echo "Committing with message 'blocks update'..."
    git commit -m "blocks update"

    echo "Pushing to remote..."
    git push

    echo "Git operations complete!"
    echo "Waiting 2 seconds before next cycle..."

    # Wait between cycles - adjust time as needed
    sleep 2
done
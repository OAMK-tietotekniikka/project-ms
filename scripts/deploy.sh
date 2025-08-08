#!/bin/bash


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function for colored messages
print_message() {
    local message=$1
    local color=$2
    echo -e "${color}${message}${NC}"
}

# Check for version argument, default latest
VERSION=${1:-latest}

# Check for project argument
PROJECT_NAME=${2}
if [[ -z "$PROJECT_NAME" ]]; then
    print_message "Usage: $0 [version] <project-name>" "$YELLOW"
    print_message "Example: $0 1.2.3 my-project" "$YELLOW"
    exit 1
fi

REGISTRY="quay.io/<your-username>"

print_message "Deploying version: $VERSION to project: $PROJECT_NAME" "$GREEN"

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    print_message "Not logged in to OpenShift. Please run 'oc login' first." "$RED"
    exit 1
fi

# Switch to project
if ! oc project "$PROJECT_NAME" &> /dev/null; then
    print_message "Project '$PROJECT_NAME' not found or you don't have access." "$RED"
    exit 1
fi

# Update images
print_message "Updating deployment images..." "$YELLOW"
oc set image deployment/server server=$REGISTRY/project-ms-server:$VERSION || {
    print_message "Failed to update server image" "$RED"
    exit 1
}
oc set image deployment/frontend frontend=$REGISTRY/project-ms-frontend:$VERSION || {
    print_message "Failed to update frontend image" "$RED"
    exit 1
}

# Wait for rollout
print_message "Waiting for server rollout..." "$YELLOW"
if ! oc rollout status deployment/server; then
    print_message "Server deployment rollout failed." "$RED"
    exit 1
fi

print_message "Waiting for frontend rollout..." "$YELLOW"
if ! oc rollout status deployment/frontend; then
    print_message "Frontend deployment rollout failed." "$RED"
    exit 1
fi

print_message "Success!" "$GREEN"
print_message "Frontend URL: http://$(oc get route frontend -o jsonpath='{.spec.host}')" "$GREEN"
print_message "API URL: http://$(oc get route api -o jsonpath='{.spec.host}')" "$GREEN"

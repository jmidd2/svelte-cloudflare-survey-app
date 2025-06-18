#!/bin/bash
# validate-and-test.sh - Complete GitHub Actions Testing Validation Script

set -euo pipefail

# Colors and formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"
readonly TEST_DIR="$PROJECT_ROOT/.github/local-testing"
readonly WORKFLOWS_DIR="$PROJECT_ROOT/.github/workflows"
readonly TEST_WORKFLOWS_DIR="$PROJECT_ROOT/.github/workflows-test"

# Logging functions
log() { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
header() { echo -e "\n${BOLD}=== $* ===${NC}"; }

# Error handling
trap 'error "Script failed at line $LINENO"' ERR

# Check if running in the correct directory
check_project_structure() {
    header "Validating Project Structure"

    local required_files=(
        "package.json"
        "svelte.config.js"
        "wrangler.toml"
        ".github/workflows"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -e "$PROJECT_ROOT/$file" ]]; then
            error "Required file/directory not found: $file"
            return 1
        fi
    done

    success "Project structure validation passed"
}

# Install required tools
install_tools() {
    header "Installing Required Tools"

    # Check and install act
    if ! command -v act &> /dev/null; then
        log "Installing act (GitHub Actions local runner)..."
        if command -v brew &> /dev/null; then
            brew install act
        elif command -v curl &> /dev/null; then
            curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
        else
            error "Please install act manually: https://github.com/nektos/act"
            return 1
        fi
    fi

    # Check and install actionlint
    if ! command -v actionlint &> /dev/null; then
        log "Installing actionlint..."
        if command -v go &> /dev/null; then
            go install github.com/rhysd/actionlint/cmd/actionlint@latest
        else
            warning "Go not installed. Please install actionlint manually"
        fi
    fi

    # Check and install yamllint
    if ! command -v yamllint &> /dev/null; then
        log "Installing yamllint..."
        if command -v pip3 &> /dev/null; then
            pip3 install yamllint
        elif command -v pip &> /dev/null; then
            pip install yamllint
        else
            warning "pip not installed. Please install yamllint manually"
        fi
    fi

    success "Tool installation completed"
}

# Setup testing environment
setup_testing_environment() {
    header "Setting Up Testing Environment"

    # Create testing directory structure
    mkdir -p "$TEST_DIR"/{events,wiremock/mappings,mock-responses}
    mkdir -p "$TEST_WORKFLOWS_DIR"

    # Create .actrc configuration
    cat > "$TEST_DIR/.actrc" << 'EOF'
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
-P ubuntu-20.04=catthehacker/ubuntu:act-20.04
--secret-file .github/local-testing/.secrets
--eventpath .github/local-testing/events/
--artifact-server-path $PWD/.artifacts
--verbose
--container-architecture linux/amd64
EOF

    # Create secrets file if it doesn't exist
    if [[ ! -f "$TEST_DIR/.secrets" ]]; then
        log "Creating secrets template..."
        cat > "$TEST_DIR/.secrets" << 'EOF'
# Local testing secrets (DO NOT COMMIT)
#GITHUB_TOKEN=ghp_fake_token_for_local_testing
CLOUDFLARE_API_TOKEN=fake_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=fake_account_id
AUTH_SECRET_STAGING=fake_staging_secret
AUTH_SECRET_PRODUCTION=fake_production_secret
CODECOV_TOKEN=fake_codecov_token
SLACK_WEBHOOK_URL=http://localhost:8080/webhook
PRODUCTION_URL=http://localhost:3000
STAGING_URL=http://localhost:3001
DATABASE_URL=file:test-local.db
NODE_ENV=test
TESTING_MODE=true
DRY_RUN=true
EOF
        warning "Please review and update .github/local-testing/.secrets with appropriate values"
    fi

    # Create sample event files
    create_event_files

    # Create gitignore entries
    add_gitignore_entries

    success "Testing environment setup completed"
}

# Create sample event files
create_event_files() {
    log "Creating sample event files..."

    # Push event for main branch
    cat > "$TEST_DIR/events/push-main.json" << 'EOF'
{
  "ref": "refs/heads/main",
  "before": "abc123def456",
  "after": "def456abc123",
  "repository": {
    "name": "feedback-system",
    "full_name": "your-username/feedback-system",
    "default_branch": "main"
  },
  "pusher": {
    "name": "test-user",
    "email": "test@example.com"
  },
  "head_commit": {
    "id": "def456abc123",
    "message": "test: add new feature",
    "author": {
      "name": "test-user",
      "email": "test@example.com"
    }
  }
}
EOF

    # Push event for develop branch
    cat > "$TEST_DIR/events/push-develop.json" << 'EOF'
{
  "ref": "refs/heads/develop",
  "before": "abc123def456",
  "after": "def456abc123",
  "repository": {
    "name": "feedback-system",
    "full_name": "your-username/feedback-system",
    "default_branch": "main"
  }
}
EOF

    # Pull request event
    cat > "$TEST_DIR/events/pull_request.json" << 'EOF'
{
  "action": "opened",
  "number": 1,
  "pull_request": {
    "id": 123456789,
    "number": 1,
    "title": "Test Pull Request",
    "body": "This is a test pull request for local testing",
    "head": {
      "ref": "feature/test-branch",
      "sha": "def456abc123"
    },
    "base": {
      "ref": "main",
      "sha": "abc123def456"
    }
  },
  "repository": {
    "name": "feedback-system",
    "full_name": "your-username/feedback-system"
  }
}
EOF

    # Schedule event
    cat > "$TEST_DIR/events/schedule.json" << 'EOF'
{
  "schedule": "0 2 * * *",
  "repository": {
    "name": "feedback-system",
    "full_name": "your-username/feedback-system"
  }
}
EOF

    # Tag/release event
    cat > "$TEST_DIR/events/tag.json" << 'EOF'
{
  "ref": "refs/tags/v1.0.0",
  "ref_type": "tag",
  "repository": {
    "name": "feedback-system",
    "full_name": "your-username/feedback-system"
  },
  "release": {
    "tag_name": "v1.0.0",
    "name": "Version 1.0.0",
    "draft": false,
    "prerelease": false
  }
}
EOF
}

# Add gitignore entries
add_gitignore_entries() {
    local gitignore_entries=(
        ".github/local-testing/.secrets"
        ".github/local-testing/events/*.json"
        ".github/workflows-test/"
        "*.log"
        "test-local.db"
        "audit-results.json"
        "complexity-report.json"
        "dependency-*.txt"
        "coverage/"
    )

    for entry in "${gitignore_entries[@]}"; do
        if ! grep -q "^$entry$" .gitignore 2>/dev/null; then
            echo "$entry" >> .gitignore
        fi
    done

    log "Updated .gitignore with testing artifacts"
}

# Create initial workflow files
create_initial_workflows() {
    header "Creating Initial Workflow Files"

    # Create workflows directory
    mkdir -p "$WORKFLOWS_DIR"

    # Create basic CI workflow
    cat > "$WORKFLOWS_DIR/ci.yaml" << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'

jobs:
  lint-and-format:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run Biome linting
        run: yarn biome ci

      - name: TypeScript check
        run: yarn check

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run unit tests
        run: yarn test:unit

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint-and-format, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build application
        run: yarn build
EOF

    # Create basic security workflow
    cat > "$WORKFLOWS_DIR/security.yaml" << 'EOF'
name: Security Scans

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'

jobs:
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run security audit
        run: yarn audit --json > audit-results.json || true
EOF

    success "Initial workflow files created in $WORKFLOWS_DIR"
    log "Created files:"
    log "  - ci.yaml (basic CI/CD pipeline)"
    log "  - security.yaml (security scanning)"
}

# Validate workflow syntax
validate_workflows() {
    header "Validating Workflow Syntax"

    # Check if workflows directory exists
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        error "Workflows directory not found: $WORKFLOWS_DIR"
        error "Run './validate-and-test.sh create-workflows' first"
        return 1
    fi

    # Check if there are any workflow files
    local workflow_count
    workflow_count=$(find "$WORKFLOWS_DIR" -name "*.yaml" -o -name "*.yaml" | wc -l)

    if [[ "$workflow_count" -eq 0 ]]; then
        error "No workflow files found in $WORKFLOWS_DIR"
        error "Run './validate-and-test.sh create-workflows' first"
        return 1
    fi

    local validation_failed=false

    # Validate with actionlint
    if command -v actionlint &> /dev/null; then
        log "Running actionlint validation..."
        for workflow in "$WORKFLOWS_DIR"/*.yaml "$WORKFLOWS_DIR"/*.yaml; do
            [[ -f "$workflow" ]] || continue
            if ! actionlint "$workflow"; then
                validation_failed=true
            fi
        done
    else
        warning "actionlint not available, skipping workflow validation"
    fi

    # Validate with yamllint
    if command -v yamllint &> /dev/null; then
        log "Running YAML syntax validation..."
        if ! yamllint -d relaxed "$WORKFLOWS_DIR"/; then
            validation_failed=true
        fi
    else
        warning "yamllint not available, skipping YAML validation"
    fi

    if [[ "$validation_failed" == "true" ]]; then
        error "Workflow validation failed"
        return 1
    fi

    success "All workflows passed syntax validation"
}

# Create safe workflow versions
create_safe_workflows() {
    header "Creating Safe Workflow Versions"

    # Check if workflows directory exists and has files
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        warning "Workflows directory doesn't exist: $WORKFLOWS_DIR"
        warning "Please create workflow files first or run setup with --create-workflows"
        return 0
    fi

    # Check if there are any workflow files
    local workflow_count
    workflow_count=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)

    if [[ "$workflow_count" -eq 0 ]]; then
        warning "No workflow files found in $WORKFLOWS_DIR"
        warning "Please create workflow files first or run setup with --create-workflows"
        return 0
    fi

    # Process existing workflow files
    local files_processed=0
    for workflow in "$WORKFLOWS_DIR"/*.yaml "$WORKFLOWS_DIR"/*.yaml; do
        # Skip if file doesn't exist (handles glob expansion when no files match)
        [[ -f "$workflow" ]] || continue

        local filename
        filename=$(basename "$workflow")
        local safe_filename="safe-$filename"
        local safe_path="$TEST_WORKFLOWS_DIR/$safe_filename"

        log "Creating safe version: $safe_filename"

        # Copy and modify workflow to be safe
        sed -e 's/yarn wrangler deploy/'\''echo "DRY RUN: yarn wrangler deploy"'\''/g' \
            -e 's/yarn wrangler d1 execute/echo "DRY RUN: yarn wrangler d1 execute"/g' \
            -e 's/git push origin/'\''echo "DRY RUN: git push origin"'\''/g' \
            -e 's/npm publish/'\''echo "DRY RUN: npm publish"'\''/g' \
            -e 's/docker push/'\''echo "DRY RUN: docker push"'\''/g' \
            -e '/^name:/s/$/ (Safe Testing)/' \
            -e '/^env:/a\  TESTING_MODE: "true"\n  DRY_RUN: "true"' \
            "$workflow" > "$safe_path"

        ((files_processed++))
    done

    if [[ "$files_processed" -gt 0 ]]; then
        success "Safe workflow versions created in $TEST_WORKFLOWS_DIR ($files_processed files processed)"
    else
        warning "No workflow files were processed"
    fi
}

# Setup mock services
setup_mock_services() {
    header "Setting Up Mock Services"

    # Create docker-compose for mock services
    cat > "$TEST_DIR/docker-compose.yaml" << 'EOF'
version: '3.8'
services:
  mock-slack:
    image: httpd:alpine
    ports:
      - "8080:80"
    volumes:
      - ./mock-responses:/usr/local/apache2/htdocs/

  mock-cloudflare:
    image: wiremock/wiremock:latest
    ports:
      - "8081:8080"
    volumes:
      - ./wiremock:/home/wiremock
EOF

    # Create mock Slack response
    cat > "$TEST_DIR/mock-responses/webhook" << 'EOF'
{"status": "ok", "message": "Mock webhook received"}
EOF

    # Create mock Cloudflare API responses
    cat > "$TEST_DIR/wiremock/mappings/deploy.json" << 'EOF'
{
  "request": {
    "method": "POST",
    "urlPattern": "/.*"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"success\": true, \"result\": {\"id\": \"mock-deployment\"}}"
  }
}
EOF

    success "Mock services configuration created"
}

# Test specific workflow
test_workflow() {
    local workflow_name="$1"
    local event_type="${2:-push-main}"

    header "Testing Workflow: $workflow_name"

    local workflow_path="$TEST_WORKFLOWS_DIR/safe-$workflow_name.yaml"
    local event_path="$TEST_DIR/events/$event_type.json"

    if [[ ! -f "$workflow_path" ]]; then
        error "Safe workflow not found: $workflow_path"
        return 1
    fi

    if [[ ! -f "$event_path" ]]; then
        error "Event file not found: $event_path"
        return 1
    fi

    log "Running workflow with act..."

    # Change to project root for act
    cd "$PROJECT_ROOT"

    # Set act configuration
    export ACT_CONFIG_FILE="$TEST_DIR/.actrc"

    # Run workflow with act
    if act -W "$workflow_path" \
        --eventpath "$event_path" \
        --secret-file "$TEST_DIR/.secrets" \
        --dryrun \
        --artifact-server-path $PWD/.artifacts \
        -s GITHUB_TOKEN="$(gh auth token)"; then
        success "Workflow test completed successfully"
    else
        error "Workflow test failed"
        return 1
    fi
}

# Run comprehensive tests
run_comprehensive_tests() {
    header "Running Comprehensive Tests"

    local test_scenarios=(
        "ci:push-main"
        "ci:pull_request"
        "security:schedule"
        "quality:push-main"
    )

    for scenario in "${test_scenarios[@]}"; do
        IFS=':' read -r workflow event <<< "$scenario"
        log "Testing scenario: $workflow with $event event"

        if test_workflow "$workflow" "$event"; then
            success "✅ $workflow:$event test passed"
        else
            error "❌ $workflow:$event test failed"
        fi
    done
}

# Cleanup function
cleanup() {
    header "Cleaning Up Test Artifacts"

    # Stop any running mock services
    if [[ -f "$TEST_DIR/docker-compose.yaml" ]]; then
        cd "$TEST_DIR"
        docker-compose down -v 2>/dev/null || true
    fi

    # Remove temporary files
    rm -rf "$TEST_WORKFLOWS_DIR"
    rm -f "$TEST_DIR"/*.log

    # Clean up Docker
    docker system prune -f --volumes 2>/dev/null || true

    success "Cleanup completed"
}

# Display usage information
show_usage() {
    cat << 'EOF'
GitHub Actions Local Testing Script

Usage: ./validate-and-test.sh [COMMAND] [OPTIONS]

Commands:
  create-workflows  - Create initial workflow files (if none exist)
  setup             - Set up complete testing environment
  validate          - Validate workflow syntax only
  test-workflow     - Test specific workflow
                      Usage: ./validate-and-test.sh test-workflow <workflow> [event]
  test-all          - Run comprehensive test suite
  cleanup           - Clean up all test artifacts
  help              - Show this help message

Examples:
  ./validate-and-test.sh create-workflows
  ./validate-and-test.sh setup
  ./validate-and-test.sh validate
  ./validate-and-test.sh test-workflow ci push-main
  ./validate-and-test.sh test-all
  ./validate-and-test.sh cleanup

First Time Setup:
  1. ./validate-and-test.sh create-workflows  # Create basic workflow files
  2. ./validate-and-test.sh setup             # Set up testing environment
  3. ./validate-and-test.sh validate          # Validate syntax
  4. ./validate-and-test.sh test-workflow ci  # Test workflows

Environment Variables:
  TESTING_MODE=true     - Enable safe testing mode
  DRY_RUN=true         - Enable dry-run mode
  VERBOSE=true         - Enable verbose output
EOF
}

# Main execution function
main() {
    case "${1:-help}" in
        "create-workflows")
            check_project_structure
            create_initial_workflows
            success "🎉 Initial workflow files created!"
            ;;
        "setup")
            check_project_structure
            install_tools
            setup_testing_environment
            create_safe_workflows
            setup_mock_services
            success "🎉 Testing environment setup completed!"
            ;;
        "validate")
            validate_workflows
            ;;
        "test-workflow")
            if [[ -z "${2:-}" ]]; then
                error "Workflow name required"
                show_usage
                exit 1
            fi
            test_workflow "$2" "${3:-push-main}"
            ;;
        "test-all")
            validate_workflows
            create_safe_workflows
            run_comprehensive_tests
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
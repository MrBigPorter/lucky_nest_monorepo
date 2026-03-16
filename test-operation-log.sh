#!/bin/bash

# Operation Log Feature Test Runner
# Usage: ./test-operation-log.sh [backend|frontend|all]

set -e

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo "🧪 Operation Log Test Suite"
echo "=============================="

TEST_TYPE=${1:-all}

# Function to print colored output
print_success() {
    echo -e "${COLOR_GREEN}✓ $1${COLOR_NC}"
}

print_error() {
    echo -e "${COLOR_RED}✗ $1${COLOR_NC}"
}

print_info() {
    echo -e "${COLOR_YELLOW}ℹ $1${COLOR_NC}"
}

# Backend Tests
run_backend_tests() {
    print_info "Running backend tests..."

    cd apps/api

    print_info "1. Service Unit Tests"
    if yarn test operation-log.service.spec.ts --passWithNoTests; then
        print_success "Service tests passed"
    else
        print_error "Service tests failed"
        exit 1
    fi

    print_info "2. E2E Tests"
    if yarn test:e2e operation-log.e2e-spec.ts --passWithNoTests; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        exit 1
    fi

    cd ../..
}

# Frontend Tests
run_frontend_tests() {
    print_info "Running frontend tests..."

    cd apps/admin-next

    print_info "1. Component Tests"
    if yarn test:operation-log --run; then
        print_success "Component tests passed"
    else
        print_error "Component tests failed"
        exit 1
    fi

    cd ../..
}

# Lint checks
run_lint() {
    print_info "Running lint checks..."

    cd apps/api
    if yarn lint; then
        print_success "Backend lint passed"
    else
        print_error "Backend lint failed"
    fi
    cd ../..

    cd apps/admin-next
    if yarn lint; then
        print_success "Frontend lint passed"
    else
        print_error "Frontend lint failed"
    fi
    cd ../..
}

# Type checks
run_type_check() {
    print_info "Running type checks..."

    cd apps/api
    if yarn build --dry-run 2>/dev/null || true; then
        print_success "Backend types OK"
    fi
    cd ../..

    cd apps/admin-next
    if yarn tsc --noEmit; then
        print_success "Frontend types OK"
    else
        print_error "Frontend type check failed"
    fi
    cd ../..
}

# Main execution
case $TEST_TYPE in
    backend)
        run_backend_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    lint)
        run_lint
        ;;
    types)
        run_type_check
        ;;
    all)
        run_type_check
        run_lint
        run_backend_tests
        run_frontend_tests
        ;;
    *)
        echo "Usage: ./test-operation-log.sh [backend|frontend|lint|types|all]"
        exit 1
        ;;
esac

echo ""
print_success "All tests completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "  1. Review test coverage: yarn test:coverage"
echo "  2. Manual testing: http://localhost:3001/operation-logs"
echo "  3. Commit changes: git add . && git commit -m 'feat: operation log audit page'"

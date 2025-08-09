# Health Check System

PolyDraw includes a comprehensive health check system for monitoring application status and automated deployment validation.

## Health Endpoint

- **URL:** `http://localhost:3000/health`
- **Response:** `healthy` (text/plain)
- **Status:** `200 OK`
- **Use:** Application monitoring and deployment validation

## Manual Health Checks

### Quick Check
```bash
curl http://localhost:3000/health
```

### Using the Monitor Script
```bash
# Single health check
./monitor.sh

# Continuous monitoring
./monitor.sh monitor

# Show help
./monitor.sh help
```

## Docker Health Checks

The application includes built-in Docker health checks:

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## GitHub Actions CI/CD

### Continuous Integration (`.github/workflows/ci.yml`)
- Runs on every push and pull request
- Builds and tests the application
- Validates Docker container health

### Deployment (`.github/workflows/deploy.yml`)
- Deploys to production on main branch pushes
- Performs health checks after deployment
- Automatic rollback on health check failure
- Manual deployment trigger available

### Workflow Features
- ✅ Automated testing
- ✅ Health check validation
- ✅ Rollback on failure
- ✅ Docker image management
- ✅ Deployment notifications

## Production Usage

### Load Balancer Integration
Configure your load balancer to use `/health` for:
- Health checks
- Traffic routing decisions
- Automatic failover

### Monitoring Systems
Integrate with monitoring tools:
- **Prometheus:** Scrape `/health` endpoint
- **Grafana:** Visualize health metrics
- **AlertManager:** Send alerts on failures

### Kubernetes
For Kubernetes deployments:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Files Overview

| File | Purpose |
|------|---------|
| `nginx.conf` | Health endpoint configuration |
| `docker-compose.yml` | Docker health check setup |
| `Dockerfile` | Container health check |
| `monitor.sh` | Manual health monitoring script |
| `.github/workflows/ci.yml` | CI pipeline with health checks |
| `.github/workflows/deploy.yml` | Deployment with health validation |

## Troubleshooting

### Health Check Fails
1. Ensure application is running: `docker ps`
2. Check container logs: `docker logs polydraw`
3. Verify port mapping: `docker port polydraw`
4. Test manually: `curl -v http://localhost:3000/health`

### CI/CD Issues
1. Check GitHub Actions logs
2. Verify Docker daemon is running
3. Ensure port 3000 is available
4. Check for conflicting containers

## Best Practices

1. **Keep it simple** - Health checks should be fast and lightweight
2. **No dependencies** - Don't check external services in basic health
3. **Use for automation** - Integrate with CI/CD and monitoring
4. **Monitor regularly** - Set up continuous monitoring for production
5. **Plan for failure** - Implement automatic rollback strategies

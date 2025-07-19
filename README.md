# DefenSys: Integrated Cybersecurity Platform

**DefenSys** is a comprehensive cyber defense platform that combines intelligent malware detection with dynamic network attack simulation capabilities. Built with a containerized Docker architecture, it provides enterprise-grade cybersecurity tools through an accessible, cost-effective platform suitable for organizations of all scales.

## 🔥 Key Features

- **Containerized Attack Simulation**: Isolated Docker environments for safe DDoS testing
- **AI-Powered Malware Detection**: Deep learning models (ResNet/CNN) achieving >95% accuracy across 25+ malware families
- **Real-time Network Monitoring**: Live dashboard for network health and threat visualization
- **Dynamic IP Blacklisting**: Network-wide automated threat response system
- **Web-based Interface**: Intuitive Flask-based control panel
- **Enterprise Scalability**: Minimal deployment overhead with high reliability


## 🐳 Docker Architecture

### Container-Based Network Simulation

DefenSys leverages **Docker containers** to create isolated network environments where each container represents a live server node capable of:

- Sending and receiving HTTP traffic
- Independent threat detection and response
- Automated communication with centralized parent server
- Local database management for blacklisted IPs


### Attack Simulation Environment

The platform includes a dedicated **lightweight Debian-based Docker container** equipped with:

- **Apache Bench (ab)** - HTTP load testing utility for DoS attack simulation
- **Isolated execution environment** - Prevents interference with production infrastructure
- **Network-integrated deployment** - Seamless communication with target nodes
- **On-demand container provisioning** - Dynamic setup and teardown capabilities


### Container Network Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Attack Node   │    │  Parent Server  │    │  Target Node    │
│  (Docker + ab)  │───▶│   (Flask App)   │◀───│ (Docker + API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───── HTTP Requests ────┼───────────────────────┘
                                 │
                      ┌─────────────────┐
                      │   Blacklist DB  │
                      │   (Centralized) │
                      └─────────────────┘
```


## 🚀 Quick Start with Docker

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Python 3.8+


### Container Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/defensys.git
cd defensys
```

2. **Build Docker images**
```bash
# Build attack simulation container
docker build -t defensys-attacker ./docker/attacker

# Build target node container  
docker build -t defensys-node ./docker/node
```

3. **Deploy the network**
```bash
# Start the complete containerized environment
docker-compose up -d

# Verify containers are running
docker ps
```


### Container Configuration

#### Attack Simulation Container

- **Base Image**: `debian:bullseye-slim`
- **Key Components**: Apache Bench, curl, network utilities
- **Resource Limits**: 512MB RAM, 1 CPU core
- **Network**: Attached to `defensys-network` bridge




### Container Orchestration

```yaml
# docker-compose.yml structure
services:
  web:
    build: ./web
    ports: ["80:5000"]
    depends_on: [db, detector]
    
  detector:
    build: ./ml-engine
    volumes: ["./models:/app/models"]
    
  simulator:
    build: ./simulator
    network_mode: "defensys-network"
    cap_add: ["NET_ADMIN"]
    
  nodes:
    build: ./node
    deploy:
      replicas: 5
    networks: ["defensys-network"]
```

### Isolated Execution Environment

- **Network Segmentation**: Each container operates in isolated network namespace
- **Resource Limits**: Prevents resource exhaustion attacks during simulation
- **Read-only Filesystems**: Attack containers use immutable base configurations
- **Non-root Execution**: All containers run with minimal privileges


### Container Security Best Practices

- **Minimal Base Images**: Debian slim variants reduce attack surface
- **Security Scanning**: Automated vulnerability scanning in CI/CD pipeline
- **Secrets Management**: Environment-based configuration without hardcoded credentials
- **Health Checks**: Automated container health monitoring and restart policies


### Launching Attack Simulation

1. **Access the DefenSys dashboard** at `http://localhost:5000`
2. **Setup Container \& Install ab**: Click to provision attack simulation environment
3. **Configure Target**: Select target node IP from network map
4. **Start Load Testing**: Initialize Apache Bench-based DoS simulation
5. **Monitor Results**: Real-time visualization of attack patterns and defense responses








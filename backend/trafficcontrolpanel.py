from flask import Flask, render_template, request, jsonify
import subprocess
import threading
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

container_id = None
active_attacks = {}  # node -> Popen process

# === Utility Functions ===
def ensure_container():
    if not container_id:
        raise Exception("Container is not set up yet!")

def validate_node(node):
    if not node:
        raise Exception("No node specified!")

# === Routes ===

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/setup-container", methods=["POST"])
def setup_container():
    global container_id
    try:
        run_container_command = [
            "docker", "run", "--rm", "-dit", "--network", "hackathon_my_network", "debian", "bash"
        ]
        container_id = subprocess.check_output(run_container_command, text=True).strip()

        subprocess.run(["docker", "exec", container_id, "apt-get", "update"], check=True)
        subprocess.run(["docker", "exec", container_id, "apt-get", "install", "-y", "apache2-utils", "procps", "sudo"], check=True)

        return jsonify({"status": "success", "message": "Container setup complete and ab installed."})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"Setup failed: {e.stderr}"}), 500

@app.route("/run-ab", methods=["POST"])
def run_ab():
    global container_id, active_attacks
    try:
        ensure_container()
        data = request.json
        print("Payload received:", data)

        nodes = data.get("nodes")
        if not nodes or not isinstance(nodes, list):
            raise Exception("No valid nodes provided.")

        requests = int(data.get("requests", 100000))
        concurrency = int(data.get("concurrency", 100))
        duration_raw = data.get("duration")
        duration = int(duration_raw) if duration_raw else 0

        port_map = {
            "node1": 5001,
            "node2": 5002,
            "node3": 5003
        }

        def launch_ab(node_name, port, req, concur, duration=None):
            ab_command = [
                "docker", "exec", container_id,
                "ab", "-n", str(req), "-c", str(concur), f"http://{node_name}:{port}/"
            ]
            if duration:
                proc = subprocess.Popen(ab_command)
                active_attacks[node_name] = proc
                proc.wait(timeout=duration)
            else:
                proc = subprocess.Popen(ab_command)
                active_attacks[node_name] = proc
                proc.wait()

            if node_name in active_attacks:
                del active_attacks[node_name]

        for node in nodes:
            if node not in port_map:
                continue
            port = port_map[node]

            if node in active_attacks and active_attacks[node].poll() is None:
                continue  # Already running

            thread = threading.Thread(target=launch_ab, args=(node, port, requests, concurrency, duration))
            thread.start()

        return jsonify({"status": "success", "message": f"Started Apache Benchmark on {', '.join(nodes)}."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/stop-ab", methods=["POST"])
def stop_ab():
    global active_attacks
    try:
        data = request.json
        nodes = data.get("nodes")
        if not nodes or not isinstance(nodes, list):
            raise Exception("No valid nodes provided.")

        ensure_container()

        stopped = []
        for node in nodes:
            # Kill all 'ab' processes inside the container
            subprocess.run(["docker", "exec", container_id, "pkill", "-f", "ab"], check=False)
            if node in active_attacks:
                active_attacks.pop(node)
                stopped.append(node)

        if stopped:
            return jsonify({"status": "success", "message": f"Stopped AB on: {', '.join(stopped)}."})
        else:
            return jsonify({"status": "warning", "message": "No active AB processes to stop."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "container_id": container_id,
        "active_attacks": list(active_attacks.keys())
    })

if __name__ == "__main__":
    app.run("0.0.0.0", port=6050, debug=True)

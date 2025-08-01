const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data"); // 👈 Required to fix formData.getHeaders()

const app = express();
app.use(cors());
app.use(express.json());

// Define upload directory relative to project root
const uploadDir = path.join(__dirname, "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save to local 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original file name
  }
});
const upload = multer({ storage });

// Enhanced /upload endpoint to get structured malware analysis from Flask
app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  try {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);
    formData.append("file", file);

    const flaskResponse = await axios.post("http://localhost:5050/predict", formData, {
      headers: formData.getHeaders(), // ✅ Now works with form-data package
    });

    res.json({
      message: "File analyzed successfully",
      result: flaskResponse.data,
    });
  } catch (error) {
    console.error("Error sending file to Flask:", error.message);
    res.status(500).json({ error: "Failed to analyze file", details: error.message });
  }
});

// Endpoint to run the 'ls' command in Docker container (example for node1)
app.get("/run-ls", (req, res) => {
  exec("docker exec hackathon-node1-1 cat blacklisted_macs.log", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`LS Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to run logs from node1
app.get("/run-log1", (req, res) => {
  exec("docker exec hackathon-node1-1 curl -s node1:5001/blacklisted", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`Log Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to run logs from node2
app.get("/run-log2", (req, res) => {
  exec("docker exec hackathon-node1-1 curl -s node2:5002/blacklisted", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`Log Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to run logs from node3
app.get("/run-log3", (req, res) => {
  exec("docker exec hackathon-node1-1 curl -s node3:5003/blacklisted", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`Log Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Reset logs for node1
app.get("/run-reset1", (req, res) => {
  exec("docker exec hackathon-node1-1 rm blacklisted_macs.log", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    exec("docker exec hackathon-node1-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
      res.json({ output: stdout });
    });
  });
});

// Reset logs for node2
app.get("/run-reset2", (req, res) => {
  exec("docker exec hackathon-node2-1 rm blacklisted_macs.log", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    exec("docker exec hackathon-node2-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
      res.json({ output: stdout });
    });
  });
});

// Reset logs for node3
app.get("/run-reset3", (req, res) => {
  exec("docker exec hackathon-node3-1 rm blacklisted_macs.log", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    exec("docker exec hackathon-node3-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
      res.json({ output: stdout });
    });
  });
});

// Get stats from node1
app.get("/run-stat1", (req, res) => {
  exec('docker stats hackathon-node1-1 --no-stream | findstr /R "[0-9].*MiB" | for /F "tokens=4" %A in (\'more\') do @echo %A', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

// Get stats from node2
app.get("/run-stat2", (req, res) => {
  exec('docker stats hackathon-node2-1 --no-stream | findstr /R "[0-9].*MiB" | for /F "tokens=4" %A in (\'more\') do @echo %A', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

// Get stats from node3
app.get("/run-stat3", (req, res) => {
  exec('docker stats hackathon-node3-1 --no-stream | findstr /R "[0-9].*MiB" | for /F "tokens=4" %A in (\'more\') do @echo %A', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

// Start the Express server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Express proxy running at http://localhost:${PORT}`);
});
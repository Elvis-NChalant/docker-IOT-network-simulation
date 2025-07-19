const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const axios = require("axios");
const multer = require("multer"); // For handling file uploads
const app = express();

app.use(cors());
app.use(express.json());

// Set up file storage for uploaded files (you can change the destination as per your needs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be stored in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  }
});

const upload = multer({ storage: storage });

// Endpoint to handle file upload and prediction using 'curl'
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const filePath = req.file.path;
  
      // Construct the form data to send to Flask server
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));
  
      // Send request to Flask server
      const response = await axios.post("http://localhost:5050/predict", form, {
        headers: {
          ...form.getHeaders(),
        },
      });
  
      res.json({
        message: "File uploaded successfully",
        output: response.data,
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({ message: "Error uploading file", error: error.message });
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
    console.log(`LS Output: ${stdout}`);
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
    console.log(`LS Output: ${stdout}`);
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
    console.log(`LS Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to reset the logs (node1 example)
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
    console.log(`LS Output: ${stdout}`);
    exec("docker exec hackathon-node1-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
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
});

// Endpoint to reset the logs (node2 example)
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
    console.log(`LS Output: ${stdout}`);
    exec("docker exec hackathon-node2-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
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
});

// Endpoint to reset the logs (node3 example)
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
    console.log(`LS Output: ${stdout}`);
    exec("docker exec hackathon-node3-1 touch blacklisted_macs.log", (error, stdout, stderr) => {
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
});

// Endpoint to get stats from node1
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
    console.log(`LS Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to get stats from node2
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
    console.log(`LS Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Endpoint to get stats from node3
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
    console.log(`LS Output: ${stdout}`);
    res.json({ output: stdout });
  });
});

// Start the Express server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

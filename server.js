// goDice-WriteToFile server - get die rolls from client and write them to a file to be read by bg3ManipulateRolls

const http = require("http");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Import the CORS middleware
const express = require("express");

const app = express();

// Resolve the path to the target file
const localAppData = process.env.LOCALAPPDATA;
const filePath = path.join(
    localAppData,
    "Larian Studios",
    "Baldur's Gate 3",
    "Script Extender",
    "manualD20RollValueLatest"
);

const filePathPrev = path.join(
    localAppData,
    "Larian Studios",
    "Baldur's Gate 3",
    "Script Extender",
    "manualD20RollValuePrevious"
);

// Ensure the directory exists
fs.mkdir(path.dirname(filePath), { recursive: true }, err => {
    if (err) {
        console.error("Error creating directory:", err);
    }
});


// Use CORS middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

app.post("/save", (req, res) => {
    try {
        const value = String(req.body.value); // Ensure value is a string
        console.log("got /save req", req.body.value);

        fs.readFile(filePath, "utf8", (readErr, currentContents) => {
            if (readErr && readErr.code !== "ENOENT") {
                console.error("Error reading current file:", readErr);
                return res.status(500).send("Error reading current file");
            }

            if (currentContents) {
                // If filePath exists and has contents, transfer them to filePathPrev
                fs.writeFile(filePathPrev, currentContents, (writePrevErr) => {
                    if (writePrevErr) {
                        console.error("Error updating previous file:", writePrevErr);
                        return res.status(500).send("Error updating previous file");
                    }

                    console.log(`New roll! Previous roll moved to ${filePathPrev}`);
                    saveNewValue(value, res);
                });
            } else {
                // If filePath is empty or doesn't exist, skip updating filePathPrev
                console.log(`${filePath} is empty or does not exist. Skipping update of ${filePathPrev}.`);
                saveNewValue(value, res);
            }
        });
    } catch (err) {
        console.error("Invalid JSON data:", err);
        res.status(400).send("Invalid JSON");
    }
});

// Helper function to save the new value to filePath
function saveNewValue(value, res) {
    fs.writeFile(filePath, value, (writeErr) => {
        if (writeErr) {
            console.error("Error writing new value:", writeErr);
            res.status(500).send("Error saving new value");
        } else {
            console.log(`Saved value "${value}" to ${filePath}`);
            res.send("Saved");
        }
    });
}

// Start the server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
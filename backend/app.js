const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const authenticationToken = require('./utilities.js')
const loginuser = require('./loginuser.js')
const signupuser = require('./signupuser.js')
const forgotpassword = require('./forgotpassword.js')
const resetpassword = require('./resetpassword.js')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();
app.use(cors({ origin: "*" }));


const fs = require('fs');
const multer = require('multer');
const path = require('path');
const stream = require('stream');
const { google } = require('googleapis');
const { PDFDocument } = require('pdf-lib');


const upload = multer(); // In-memory upload
const google_api_folder = '1-roKtREw4PrQrCjs_RDeMtl_CGRnJh4m'; // Replace with your folder ID

// Upload buffer to Google Drive
async function uploadToDrive(buffer, fileName) {
    const auth = new google.auth.GoogleAuth({
        keyFile: './creda.json',
        scopes: ['https://www.googleapis.com/auth/drive']
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const response = await drive.files.create({
        resource: {
            name: fileName,
            parents: [google_api_folder],
        },
        media: {
            mimeType: 'application/pdf',
            body: bufferStream,
        },
        fields: 'id',
    });

    return response.data.id;
}

// Main upload route
app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "No PDF uploaded." });
        }

        const userPassword = req.body.password;
        if (!userPassword) {
            return res.status(400).json({ message: "Password is required for PDF protection." });
        }

        // Load and protect PDF from buffer
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        const protectedPdfBytes = await pdfDoc.save({
            userPassword: userPassword,
            ownerPassword: userPassword,
        });

        const protectedFileName = `Protected_${req.file.originalname}`;

        // Upload to Drive
        const fileId = await uploadToDrive(protectedPdfBytes, protectedFileName);

        return res.status(201).json({
            message: "File uploaded and password-protected successfully.",
            fileId: fileId,
            fileName: protectedFileName
        });

    } catch (error) {
        console.error("❌ Upload error:", error);
        return res.status(500).json({
            message: "File upload and protection failed. Please try again."
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const result = await loginuser({ email, password });

        if (result.success) {
            return res.status(201).json({
                message: "User logged in successfully.",
                user: result.user,
                authToken: result.authToken
            });
        } else {
            return res.status(
                result.message === "Email not found." || result.message === "Incorrect password."
                    ? 401
                    : 500
            ).json({ message: result.message });
        }
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "An error occurred." });
    }
});
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const result = await signupuser({ name, email, password });

        if (result.success) {
            return res.status(201).json({
                message: "User registered successfully.",
                user: result.user,
                authToken: result.authToken
            });
        } else {
            return res.status(result.message === "Email already in use." ? 409 : 500).json({
                message: result.message
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "An error occurred." });
    }
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: "Name, email, and password are required." });

        const result = await forgotpassword({ email });
        if (result.success) {
            return res.status(201).json({
                message: "Mail sent.",
                authToken: result.authToken
            });
        } else {
            return res.status(500).json({
                message: result.message
            });
        }


    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "An error occurred." });
    }
})

app.post('/reset-password/:name/:token', async (req, res) => {
    const { name, token } = req.params;
    const { newPassword } = req.body;

    try {
        // const decoded = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await resetpassword({ name, hashedPassword });

        if (result.success) {
            return res.status(200).json({ success: true, message: "Password reset successful" });
        } else {
            return res.status(500).json({ success: false, message: "Could not reset password" });
        }

    } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
})

app.get("/", (req, res) => {
    res.send("hello");
})

app.listen(8080, () => {
    console.log("Server is listning on port 8080");
})
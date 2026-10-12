"use strict";

/* =========================
   SHARED HELPERS
========================= */

async function copyText(text) {
    try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            throw new Error("Clipboard unavailable");
        }

        await navigator.clipboard.writeText(text);
        alert("Copied successfully!");
        return true;
    } catch {
        alert("Copy failed. Please select and copy the text manually.");
        return false;
    }
}

function getElement(id) {
    return document.getElementById(id);
}

function setOutput(id, message, type = "") {
    const output = getElement(id);
    if (!output) return;

    output.textContent = message;
    output.className = type;
}

async function copyOutput(id, emptyMessage) {
    const output = getElement(id);
    const text = output?.textContent ?? "";

    if (!text.trim()) {
        alert(emptyMessage);
        return;
    }

    await copyText(text);
}

/* =========================
   JSON FORMATTER
========================= */

function formatJSON() {
    const input = getElement("jsonInput").value;
    const output = getElement("jsonOutput");

    try {
        output.textContent = JSON.stringify(JSON.parse(input), null, 4);
        output.className = "success";
    } catch {
        output.textContent = "Invalid JSON. Check your input and try again.";
        output.className = "error";
    }
}

function clearJSON() {
    getElement("jsonInput").value = "";
    setOutput("jsonOutput", "");
}

function copyJSON() {
    return copyOutput("jsonOutput", "Please format JSON first.");
}

/* =========================
   JWT DECODER
========================= */

function decodeJWT() {
    const input = getElement("jwtInput").value.trim();
    const output = getElement("jwtOutput");

    try {
        const parts = input.split(".");

        if (parts.length !== 3 || parts.some(part => !part)) {
            throw new Error("A JWT must contain three non-empty parts.");
        }

        function decodeBase64URL(part) {
            if (!/^[A-Za-z0-9_-]+$/.test(part)) {
                throw new Error("Invalid Base64URL characters.");
            }

            const base64 = part
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
            const binary = atob(padded);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

            return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        }

        const header = JSON.parse(decodeBase64URL(parts[0]));
        const payload = JSON.parse(decodeBase64URL(parts[1]));

        output.textContent =
            "HEADER:\n" + JSON.stringify(header, null, 4) +
            "\n\nPAYLOAD:\n" + JSON.stringify(payload, null, 4) +
            "\n\nWARNING: The signature has NOT been verified.";

        output.className = "success";
    } catch {
        output.textContent = "Invalid JWT. Check the token format and contents.";
        output.className = "error";
    }
}

function clearJWT() {
    getElement("jwtInput").value = "";
    setOutput("jwtOutput", "");
}

function copyJWT() {
    return copyOutput("jwtOutput", "Please decode a JWT first.");
}

/* =========================
   IMAGE METADATA CLEANER
========================= */

let cleanedImageURL = null;
let imageProcessingToken = 0;

function clearMetadata() {
    imageProcessingToken++;

    const fileInput = getElement("imageInput");
    if (fileInput) fileInput.value = "";

    const output = getElement("metadataOutput");
    if (output) output.replaceChildren();

    if (cleanedImageURL) {
        URL.revokeObjectURL(cleanedImageURL);
        cleanedImageURL = null;
    }
}

async function cleanImageMetadata() {
    const fileInput = getElement("imageInput");
    const output = getElement("metadataOutput");

    if (!fileInput || !output) return;

    const file = fileInput.files?.[0];

    if (!file) {
        output.textContent = "Please select an image first.";
        return;
    }

    if (!file.type.startsWith("image/")) {
        output.textContent = "Please select an image file.";
        return;
    }

    // Avoid processing unexpectedly large files in the browser.
    if (file.size > 15 * 1024 * 1024) {
        output.textContent = "Please choose an image smaller than 15 MB.";
        return;
    }

    const token = ++imageProcessingToken;
    output.textContent = "Processing image...";

    const sourceURL = URL.createObjectURL(file);

    try {
        const image = new Image();

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error("Image could not be read."));
            image.src = sourceURL;
        });

        if (token !== imageProcessingToken) return;

        if (!image.naturalWidth || !image.naturalHeight ||
            image.naturalWidth * image.naturalHeight > 40000000) {
            throw new Error("Image dimensions are too large to process safely.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas processing is unavailable.");

        context.drawImage(image, 0, 0);

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/png")
        );

        if (token !== imageProcessingToken) return;
        if (!blob) throw new Error("The cleaned image could not be created.");

        if (cleanedImageURL) URL.revokeObjectURL(cleanedImageURL);
        cleanedImageURL = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = cleanedImageURL;
        link.download = "cleaned-image.png";
        link.textContent = "Download Cleaned Image";

        output.replaceChildren(link);
        fileInput.value = "";
    } catch (error) {
        if (token === imageProcessingToken) {
            output.textContent = error.message ||
                "Unable to process this image. Try another file.";
        }
    } finally {
        URL.revokeObjectURL(sourceURL);
    }
}

/* =========================
   PASSWORD GENERATOR
========================= */

function generatePassword() {
    const output = getElement("passwordOutput");
    const length = Number(getElement("passwordLength").value);

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

    if (!Number.isInteger(length) || length < 8 || length > 64) {
        output.textContent = "Choose a password length between 8 and 64.";
        output.className = "error";
        return;
    }

    if (!globalThis.crypto?.getRandomValues) {
        output.textContent = "Secure password generation is unavailable in this browser.";
        output.className = "error";
        return;
    }

    let password = "";
    const range = 2 ** 32;
    const limit = Math.floor(range / characters.length) * characters.length;

    while (password.length < length) {
        const values = new Uint32Array(Math.max(16, length - password.length));
        crypto.getRandomValues(values);

        for (const value of values) {
            if (value >= limit) continue;

            password += characters[value % characters.length];
            if (password.length === length) break;
        }
    }

    output.textContent = password;
    output.className = "success";
}

function copyPassword() {
    return copyOutput("passwordOutput", "Please generate a password first.");
}

function clearPassword() {
    getElement("passwordLength").value = 16;
    setOutput("passwordOutput", "");
}

/* =========================
   BASE64 ENCODER / DECODER
========================= */

function encodeBase64() {
    const input = getElement("base64Input").value;
    const output = getElement("base64Output");

    try {
        const bytes = new TextEncoder().encode(input);
        let binary = "";

        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        output.textContent = btoa(binary);
        output.className = "success";
    } catch {
        output.textContent = "Unable to encode this text.";
        output.className = "error";
    }
}

function decodeBase64() {
    const input = getElement("base64Input").value.trim();
    const output = getElement("base64Output");

    try {
        if (!input || input.length % 4 !== 0 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input)) {
            throw new Error("Invalid Base64");
        }

        const binary = atob(input);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

        output.textContent = new TextDecoder("utf-8", {
            fatal: true
        }).decode(bytes);

        output.className = "success";
    } catch {
        output.textContent = "Invalid Base64 text or unsupported character encoding.";
        output.className = "error";
    }
}

function clearBase64() {
    getElement("base64Input").value = "";
    setOutput("base64Output", "");
}

function copyBase64() {
    return copyOutput("base64Output", "Please encode or decode something first.");
}

/* =========================
   URL ENCODER / DECODER
========================= */

function encodeURL() {
    const input = getElement("urlInput").value;
    setOutput("urlOutput", encodeURIComponent(input), "success");
}

function decodeURL() {
    const input = getElement("urlInput").value;
    const output = getElement("urlOutput");

    try {
        output.textContent = decodeURIComponent(input);
        output.className = "success";
    } catch {
        output.textContent = "Invalid encoded text. Please check your input.";
        output.className = "error";
    }
}

function clearURL() {
    getElement("urlInput").value = "";
    setOutput("urlOutput", "");
}

function copyURL() {
    return copyOutput("urlOutput", "Please encode or decode something first.");
}

/* =========================
   TIMESTAMP CONVERTER
========================= */

function convertTimestamp() {
    const input = getElement("timestampInput").value.trim();
    const output = getElement("timestampOutput");

    if (!input) {
        output.textContent = "Please enter a Unix timestamp in seconds.";
        output.className = "error";
        return;
    }

    const seconds = Number(input);
    const date = new Date(seconds * 1000);

    if (!Number.isFinite(seconds) || !Number.isFinite(date.getTime())) {
        output.textContent = "Please enter a valid timestamp within the supported date range.";
        output.className = "error";
        return;
    }

    output.textContent = date.toLocaleString();
    output.className = "success";
}

function clearTimestamp() {
    getElement("timestampInput").value = "";
    setOutput("timestampOutput", "");
}

function copyTimestamp() {
    return copyOutput("timestampOutput", "Please convert a timestamp first.");
}

/* =========================
   REGEX TESTER
========================= */

function testRegex() {
    const pattern = getElement("regexInput").value;
    const text = getElement("regexText").value;
    const output = getElement("regexOutput");

    if (!pattern) {
        output.textContent = "Please enter a regular expression.";
        output.className = "error";
        return;
    }

    // Limits reduce accidental oversized input but cannot eliminate
    // every risk of a slow regular expression.
    if (pattern.length > 200 || text.length > 20000) {
        output.textContent = "Please use a pattern under 201 characters and text under 20,001 characters.";
        output.className = "error";
        return;
    }

    try {
        const regex = new RegExp(pattern, "g");
        const matches = text.match(regex);

        if (matches?.length) {
            output.textContent = "Matches found:\n" + matches.join("\n");
            output.className = "success";
        } else {
            output.textContent = "No matches found.";
            output.className = "error";
        }
    } catch {
        output.textContent = "Invalid regular expression. Please check your pattern.";
        output.className = "error";
    }
}

function clearRegex() {
    getElement("regexInput").value = "";
    getElement("regexText").value = "";
    setOutput("regexOutput", "");
}

function copyRegex() {
    return copyOutput("regexOutput", "Please test a regular expression first.");
}

/* =========================
   PASSWORD STRENGTH CHECKER
========================= */

function checkPasswordStrength() {
    const password = getElement("strengthPassword").value;
    const output = getElement("strengthOutput");

    if (!password) {
        output.textContent = "Please enter a sample password.";
        output.className = "error";
        return;
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let strength;
    if (score <= 2) strength = "Weak";
    else if (score <= 4) strength = "Medium";
    else strength = "Strong";

    output.textContent =
        "Estimated strength: " + strength +
        "\nThis is a basic estimate, not a guarantee of security.";
    output.className = score <= 2 ? "error" : "success";
}

function clearPasswordStrength() {
    getElement("strengthPassword").value = "";
    setOutput("strengthOutput", "");
}

/* =========================
   SHA-256 HASH GENERATOR
========================= */

async function generateHash() {
    const input = getElement("hashInput").value;
    const output = getElement("hashOutput");

    if (!input) {
        output.textContent = "Please enter some text.";
        output.className = "error";
        return;
    }

    if (!globalThis.crypto?.subtle) {
        output.textContent = "SHA-256 is unavailable in this browser context.";
        output.className = "error";
        return;
    }

    try {
        const data = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);

        output.textContent = Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

        output.className = "success";
    } catch {
        output.textContent = "Unable to generate the SHA-256 hash.";
        output.className = "error";
    }
}

function clearHash() {
    getElement("hashInput").value = "";
    setOutput("hashOutput", "");
}

function copyHash() {
    return copyOutput("hashOutput", "Please generate a hash first.");
}

/* =========================
   TOOL SEARCH
========================= */

function searchTools() {
    const searchText = getElement("toolSearch").value.trim().toLowerCase();

    document.querySelectorAll(".tool-card").forEach(tool => {
        tool.style.display = tool.textContent.toLowerCase().includes(searchText)
            ? ""
            : "none";
    });
}

function clearToolSearch() {
    getElement("toolSearch").value = "";

    document.querySelectorAll(".tool-card").forEach(tool => {
        tool.style.display = "";
    });
}

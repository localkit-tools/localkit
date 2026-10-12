async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert("Copied successfully!");
        return true;
    } catch (error) {
        alert("Copy failed. Please select and copy the text manually.");
        return false;
    }
}

function formatJSON() {
    const input = document.getElementById("jsonInput").value;
    const output = document.getElementById("jsonOutput");

    try {
        const parsed = JSON.parse(input);
        output.textContent = JSON.stringify(parsed, null, 4);
        output.className = "success";
    } catch (error) {
        output.textContent = "Invalid JSON: " + error.message;
        output.className = "error";
    }
}


function clearJSON() {
    document.getElementById("jsonInput").value = "";
    document.getElementById("jsonOutput").textContent = "";
}


async function copyJSON() {
    const output = document.getElementById("jsonOutput").textContent;

    if (output === "") {
        alert("Please format JSON first.");
        return;
    }

    await copyText(output);
}

/* =========================
   JWT DECODER
========================= */



function decodeJWT() {
    const input = document.getElementById("jwtInput").value.trim();
    const output = document.getElementById("jwtOutput");

    try {
        const parts = input.split(".");

        if (parts.length !== 3 || parts.some(part => part === "")) {
            throw new Error("A JWT must contain 3 non-empty parts.");
        }

        function decodeBase64URL(part) {
            const base64 = part
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
            const binary = atob(padded);

            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }

        const header = JSON.parse(decodeBase64URL(parts[0]));
        const payload = JSON.parse(decodeBase64URL(parts[1]));

        output.textContent =
            "HEADER:\n" +
            JSON.stringify(header, null, 4) +
            "\n\nPAYLOAD:\n" +
            JSON.stringify(payload, null, 4) +
            "\n\nSecurity note: The signature has NOT been verified.";

        output.className = "success";

    } catch (error) {
        output.textContent = "Invalid JWT: " + error.message;
        output.className = "error";
    }
}

function clearJWT() {
    document.getElementById("jwtInput").value = "";
    document.getElementById("jwtOutput").textContent = "";
}


async function copyJWT() {
    const output = document.getElementById("jwtOutput").textContent;

    if (output === "") {
        alert("Please decode a JWT first.");
        return;
    }

    await copyText(output);
}
let cleanedImageURL = null;

/* =========================
   METADATA CLEANER
========================= */

function cleanImageMetadata() {
    const fileInput = document.getElementById("imageInput");
    const output = document.getElementById("metadataOutput");

    if (!fileInput || !output) {
        return;
    }

    if (fileInput.files.length === 0) {
        output.textContent = "Please select an image first.";
        return;
    }

    const file = fileInput.files[0];

    const image = new Image();

    const imageURL = URL.createObjectURL(file);

    image.onload = function () {

        const canvas = document.createElement("canvas");

        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext("2d");

        if (!context) {
            output.textContent = "Unable to process this image.";
            URL.revokeObjectURL(imageURL);
            return;
        }

        context.drawImage(image, 0, 0);

        canvas.toBlob(function (blob) {

            URL.revokeObjectURL(imageURL);

            if (!blob) {
                output.textContent = "Unable to clean this image.";
                return;
            }

            if (cleanedImageURL) {
    URL.revokeObjectURL(cleanedImageURL);
}

cleanedImageURL = URL.createObjectURL(blob);

const cleanedURL = cleanedImageURL;

            const link = document.createElement("a");

            link.href = cleanedURL;
            link.download = "cleaned-image.png";
            link.textContent = "Download Cleaned Image";

            output.innerHTML = "";
            output.appendChild(link);

            /*
             * Clear the selected file from the file input
             * after the cleaned image has been created.
             */
            fileInput.value = "";

        }, "image/png");
    };

    image.onerror = function () {
        URL.revokeObjectURL(imageURL);
        output.textContent = "Unable to read this image.";
    };

    image.src = imageURL;
}


function clearMetadata() {
    const fileInput = document.getElementById("imageInput");
    const output = document.getElementById("metadataOutput");

    if (fileInput) {
        fileInput.value = "";
    }

   if (output) {
    output.innerHTML = "";
}

if (cleanedImageURL) {
    URL.revokeObjectURL(cleanedImageURL);
    cleanedImageURL = null;
}
}


/* =========================
   PASSWORD GENERATOR
========================= */

function generatePassword() {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

    const length = Number(
        document.getElementById("passwordLength").value
    );

    const output =
        document.getElementById("passwordOutput");

    if (!Number.isInteger(length) || length < 8 || length > 64) {
        output.textContent =
            "Choose a password length between 8 and 64.";
        return;
    }

    let password = "";

    const range = 2 ** 32;
    const limit =
        Math.floor(range / characters.length) * characters.length;

    while (password.length < length) {
        const remaining = length - password.length;

        const values =
            new Uint32Array(Math.max(16, remaining));

        crypto.getRandomValues(values);

        for (const value of values) {
            if (value >= limit) continue;

            password += characters[value % characters.length];

            if (password.length === length) break;
        }
    }

    output.textContent = password;
}
async function copyPassword() {
    const password =
        document.getElementById("passwordOutput").textContent;

    if (password === "") {
        alert("Please generate a password first.");
        return;
    }

    await copyText(password);
}

function clearPassword() {
    document.getElementById("passwordLength").value = 16;
    document.getElementById("passwordOutput").textContent = "";
}


/* =========================
   BASE64 ENCODER / DECODER
========================= */

function encodeBase64() {
    const input = document.getElementById("base64Input").value;
    const output = document.getElementById("base64Output");

    try {
        output.textContent =
            btoa(unescape(encodeURIComponent(input)));
    } catch (error) {
        output.textContent = "Unable to encode text.";
    }
}


function decodeBase64() {
    const input = document.getElementById("base64Input").value;
    const output = document.getElementById("base64Output");

    try {
        output.textContent =
            decodeURIComponent(escape(atob(input)));
    } catch (error) {
        output.textContent = "Invalid Base64 text.";
    }
}


function clearBase64() {
    document.getElementById("base64Input").value = "";
    document.getElementById("base64Output").textContent = "";
}


async function copyBase64() {
    const output =
        document.getElementById("base64Output").textContent;

    if (output === "") {
        alert("Please encode or decode something first.");
        return;
    }

    await copyText(output);
}

/* =========================
   URL ENCODER / DECODER
========================= */

function encodeURL() {
    const input = document.getElementById("urlInput").value;
    const output = document.getElementById("urlOutput");

    try {
        output.textContent = encodeURIComponent(input);
    } catch (error) {
        output.textContent = "Unable to encode text.";
    }
}


function decodeURL() {
    const input = document.getElementById("urlInput").value;
    const output = document.getElementById("urlOutput");

    try {
        output.textContent = decodeURIComponent(input);
    } catch (error) {
        output.textContent = "Invalid encoded URL.";
    }
}


function clearURL() {
    document.getElementById("urlInput").value = "";
    document.getElementById("urlOutput").textContent = "";
}


async function copyURL() {
    const output =
        document.getElementById("urlOutput").textContent;

    if (output === "") {
        alert("Please encode or decode something first.");
        return;
    }

    await copyText(output);
}
/* =========================
   TIMESTAMP CONVERTER
========================= */

function convertTimestamp() {
    const input =
        document.getElementById("timestampInput").value;

    const output =
        document.getElementById("timestampOutput");

    if (input === "") {
        output.textContent = "Please enter a timestamp.";
        return;
    }

    const date = new Date(Number(input) * 1000);

    if (isNaN(date.getTime())) {
        output.textContent = "Invalid timestamp.";
        return;
    }

    output.textContent = date.toLocaleString();
}


function clearTimestamp() {
    document.getElementById("timestampInput").value = "";
    document.getElementById("timestampOutput").textContent = "";
}


async function copyTimestamp() {
    const output =
        document.getElementById("timestampOutput").textContent;

    if (output === "") {
        alert("Please convert a timestamp first.");
        return;
    }

    await copyText(output);
}
/* =========================
   REGEX TESTER
========================= */

function testRegex() {
    const pattern =
        document.getElementById("regexInput").value;

    const text =
        document.getElementById("regexText").value;

    const output =
        document.getElementById("regexOutput");

    if (pattern === "") {
        output.textContent =
            "Please enter a regular expression.";
        return;
    }

    try {
        const regex = new RegExp(pattern, "g");

        const matches = text.match(regex);

        if (matches) {
            output.textContent =
                "Matches found:\n" + matches.join("\n");
        } else {
            output.textContent = "No matches found.";
        }

    } catch (error) {
        output.textContent =
            "Invalid regular expression.";
    }
}


function clearRegex() {
    document.getElementById("regexInput").value = "";
    document.getElementById("regexText").value = "";
    document.getElementById("regexOutput").textContent = "";
}


async function copyRegex() {
    const output =
        document.getElementById("regexOutput").textContent;

    if (output === "") {
        alert("Please test a regular expression first.");
        return;
    }

    await copyText(output);
}


/* =========================
   PASSWORD STRENGTH CHECKER
========================= */

function checkPasswordStrength() {
    const password =
        document.getElementById("strengthPassword").value;

    const output =
        document.getElementById("strengthOutput");

    if (password === "") {
        output.textContent = "Please enter a password.";
        return;
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
        output.textContent = "Strength: Weak";
    } else if (score <= 4) {
        output.textContent = "Strength: Medium";
    } else {
        output.textContent = "Strength: Strong";
    }
}


function clearPasswordStrength() {
    document.getElementById("strengthPassword").value = "";
    document.getElementById("strengthOutput").textContent = "";
}


/* =========================
   SHA-256 HASH GENERATOR
========================= */

async function generateHash() {
    const input =
        document.getElementById("hashInput").value;

    const output =
        document.getElementById("hashOutput");

    if (input === "") {
        output.textContent = "Please enter some text.";
        return;
    }

    const data = new TextEncoder().encode(input);

    const hashBuffer =
        await crypto.subtle.digest("SHA-256", data);

    const hashArray =
        Array.from(new Uint8Array(hashBuffer));

    const hashHex =
        hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

    output.textContent = hashHex;
}


function clearHash() {
    document.getElementById("hashInput").value = "";
    document.getElementById("hashOutput").textContent = "";
}


async function copyHash() {
    const output =
        document.getElementById("hashOutput").textContent;

    if (output === "") {
        alert("Please generate a hash first.");
        return;
    }

    await copyText(output);
}

/* =========================
   TOOL SEARCH
========================= */

function searchTools() {
    const searchText =
        document.getElementById("toolSearch").value.toLowerCase();

    const tools =
        document.querySelectorAll(".tool-card");

    tools.forEach(function(tool) {

        const toolText =
            tool.textContent.toLowerCase();

        if (toolText.includes(searchText)) {
            tool.style.display = "";
        } else {
            tool.style.display = "none";
        }
    });
}


function clearToolSearch() {
    document.getElementById("toolSearch").value = "";

    const tools =
        document.querySelectorAll(".tool-card");

    tools.forEach(function(tool) {
        tool.style.display = "";
    });
}

# OCR Setup for Windows (Sinhala Text)

## Why You Need OCR

When uploading Sinhala textbooks, many PDFs use legacy non-Unicode fonts (like FM Abhaya, Malithi Web). The PDF text extraction returns garbled Latin characters instead of proper Sinhala.

OCR (Optical Character Recognition) reads the rendered pages as images and extracts the actual text.

## Problem

The `canvas` package requires native compilation on Windows, which needs:
- Python 3.x
- Visual Studio Build Tools (C++ compiler)

## Solution

### Step 1: Install Python 3

Download and install Python 3.12 or higher from:
https://www.python.org/downloads/

During installation, check "Add Python to PATH"

### Step 2: Install Visual Studio Build Tools

1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run installer
3. Select "C++ build tools" workload
4. Click Install

### Step 3: Install canvas

```bash
npm install canvas@2.11.2 --build-from-source
```

### Step 4: Verify Installation

```bash
node -e "const canvas = require('canvas'); console.log('OK:', canvas.version);"
```

You should see: `OK: 2.11.2`

### Step 5: Re-upload Your Textbook

Now when you upload a Sinhala textbook:
1. OCR will be available (`canvas module not installed` warning will disappear)
2. Legacy Sinhala font pages will be OCR'd
3. Lesson titles and content will display properly in Sinhala

## Alternative (No OCR)

If you can't install the build tools:

1. Upload your textbook (OCR skipped)
2. The lesson titles will be garbled (e.g., "9. fldaK")
3. Manually edit lesson titles in the admin panel after upload
4. Generate questions - they'll still work but from garbled text

## Troubleshooting

### Error: "Python not found"
- Make sure Python 3.x is installed
- Restart your terminal after installation

### Error: "MSVC not found"
- Install Visual Studio Build Tools (Step 2)
- Or install Visual Studio Community with C++ workload

### Error: "canvas-prebuilt not found"
- Pre-built binaries aren't available for your Node.js version
- Use the manual build method above

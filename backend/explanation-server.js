const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// Create Express app
const app = express()
const PORT = 3006

// Enable CORS for all routes
app.use(cors())
app.use(express.json())

// Create storage directory if it doesn't exist
const STORAGE_DIR = path.join(__dirname, "app", "storage", "explanations")
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Explanation server is running" })
})

// Function to generate a cache key based on code and language
function generateCacheKey(code, language) {
  const hash = crypto.createHash("md5").update(`${code}-${language}`).digest("hex")
  return hash
}

// Function to check if explanation is cached
function checkCache(cacheKey) {
  const cachePath = path.join(STORAGE_DIR, `${cacheKey}.json`)
  if (fs.existsSync(cachePath)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, "utf8"))
      return cacheData
    } catch (error) {
      console.error("Error reading cache:", error)
    }
  }
  return null
}

// Function to save explanation to cache
function saveToCache(cacheKey, explanation) {
  const cachePath = path.join(STORAGE_DIR, `${cacheKey}.json`)
  try {
    fs.writeFileSync(
      cachePath,
      JSON.stringify({
        explanation,
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    console.error("Error saving to cache:", error)
  }
}

// Endpoint to explain code with streaming response
app.post("/explain-stream", async (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const { code, language } = req.body

    if (!code || !language) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "Code and language are required" })}\n\n`)
      res.end()
      return
    }

    // Generate cache key
    const cacheKey = generateCacheKey(code, language)

    // Check cache
    const cachedExplanation = checkCache(cacheKey)

    if (cachedExplanation) {
      // Send metadata event with cache info
      res.write(`event: metadata\ndata: ${JSON.stringify({ fromCache: true })}\n\n`)

      // Send the cached explanation in chunks to simulate streaming
      const chunks = cachedExplanation.explanation.match(/.{1,100}/g) || []

      for (const chunk of chunks) {
        res.write(`event: data\ndata: ${JSON.stringify({ explanation: chunk })}\n\n`)
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Send completion event
      res.write(`event: complete\ndata: {}\n\n`)
      res.end()
      return
    }

    // Send metadata event
    res.write(`event: metadata\ndata: ${JSON.stringify({ fromCache: false })}\n\n`)

    // Import environment variables
    const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434"
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3"

    // Prepare the prompt for code explanation
    const prompt = `
You are an expert programming tutor. Please explain the following ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive explanation with the following sections:

1. Overview: A high-level summary of what the code does
2. Code Breakdown: Line-by-line or section-by-section explanation
3. Time and Space Complexity: Analysis of the algorithm's efficiency
4. Potential Improvements: Suggestions for optimizing or improving the code

Format your response in a clear, educational manner suitable for a student learning programming.
`

    // Call Ollama API
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    // Process the streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulatedExplanation = ""

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // Decode the chunk
      const chunk = decoder.decode(value)

      // Parse the JSON responses (Ollama sends multiple JSON objects)
      const jsonLines = chunk.split("\n").filter((line) => line.trim())

      for (const line of jsonLines) {
        try {
          const parsedLine = JSON.parse(line)

          if (parsedLine.response) {
            // Send the chunk to the client
            res.write(`event: data\ndata: ${JSON.stringify({ explanation: parsedLine.response })}\n\n`)

            // Accumulate the explanation
            accumulatedExplanation += parsedLine.response
          }
        } catch (error) {
          console.error("Error parsing JSON line:", error)
        }
      }
    }

    // Save to cache
    saveToCache(cacheKey, accumulatedExplanation)

    // Send completion event
    res.write(`event: complete\ndata: {}\n\n`)
    res.end()
  } catch (error) {
    console.error("Error generating explanation:", error)
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Explanation server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

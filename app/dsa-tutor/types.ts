// Update the ProblemAssistance interface if needed
export interface ProblemAssistance {
  explaining: string // Problem Explanation section
  solution: string // Key DSA Topic and Explanation section
  stepByStep: string // This will be empty with the new format, but kept for backward compatibility
  isLoading?: boolean
  error?: string
  fromCache?: boolean
  streamingText?: string
}

// Keep other types as they are
export interface Question {
  id: number
  title: string
  difficulty: string
  question: string
  input_format: string
  output_format: string
  constraints: string
  hint: string
  sample_input: string
  sample_output: string
  hidden_inputs: string[]
  hidden_outputs: string[]
  tags: string[]
}

export interface ExecutionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  time: string
  memory: string
  status: {
    id: number
    description: string
  }
}

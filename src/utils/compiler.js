const JUDGE0_API = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

// Map file extensions/names to Judge0 Language IDs
const LANG_MAP = {
  javascript: 93, // Node 18.15.0
  js: 93,
  typescript: 94, // TS 5.0.3
  ts: 94,
  python: 92,     // Python 3.11.2
  py: 92,
  java: 91,       // Java JDK 17
  cpp: 54,        // C++ (GCC 9.2.0)
  c: 50,          // C (GCC 9.2.0)
  rust: 73,       // Rust 1.40.0
  rs: 73,
  go: 95,         // Go 1.18.5
};

export const executeCode = async (language, code) => {
  const lang = language?.toLowerCase?.() || '';
  const langId = LANG_MAP[lang];

  if (!langId) {
    return `✖ Language "${language}" is not supported.\nSupported: Python, JavaScript, TypeScript, Java, C, C++, Rust, Go`;
  }

  const body = JSON.stringify({
    language_id: langId,
    source_code: code,
  });

  try {
    const res = await fetch(JUDGE0_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!res.ok) {
      if (res.status === 429) {
        return `✖ Execution service rate limited (HTTP 429). Please try again in a few seconds.`;
      }
      return `✖ Execution service error: HTTP ${res.status} ${res.statusText}\nMake sure you are connected to the internet.`;
    }

    const data = await res.json();
    return extractOutput(data);

  } catch (err) {
    return `✖ Network Error: ${err.message}\nMake sure you are connected to the internet or disabling ad-blockers for this API.`;
  }
};

function extractOutput(data) {
  if (!data) return '✖ No response from execution server.';

  // If there's a compilation error
  if (data.compile_output) {
    return `Compilation Error:\n${data.compile_output.trim()}`;
  }

  // If there's an execution error (e.g. Runtime Error)
  if (data.status?.id >= 6 && data.status?.id <= 12) {
    const msg = data.stderr || data.message || data.status.description || 'Unknown Runtime Error';
    return `Runtime Error (${data.status.description}):\n${msg.trim()}`;
  }

  // Success
  const stdout = (data.stdout || '').trimEnd();
  const stderr = (data.stderr || '').trimEnd();

  const combined = [stdout, stderr].filter(Boolean).join('\n');
  return combined || '(Program exited with no output)';
}

const JUDGE0_BASE_URL = "https://judge0-ce.p.rapidapi.com";

export const JUDGE0_LANGUAGE_MAP = {
  54: "C++",
  71: "Python3",
  62: "Java",
  63: "JavaScript",
  60: "Go",
  73: "Rust",
} as const;

export type Judge0LanguageId = keyof typeof JUDGE0_LANGUAGE_MAP;

type Judge0SubmissionPayload = {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
};

type Judge0SubmissionResponse = {
  token: string;
};

export type Judge0StatusResponse = {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
};

function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null) {
  if (!value) {
    return null;
  }
  return Buffer.from(value, "base64").toString("utf8");
}

function buildHeaders() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  return {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  };
}

export async function submitToJudge0(payload: Judge0SubmissionPayload) {
  const response = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      source_code: encodeBase64(payload.source_code),
      language_id: payload.language_id,
      stdin: encodeBase64(payload.stdin ?? ""),
      expected_output: payload.expected_output
        ? encodeBase64(payload.expected_output)
        : undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Judge0 submission failed: ${response.status} ${body}`);
  }

  return (await response.json()) as Judge0SubmissionResponse;
}

export async function submitToJudge0AndWait(payload: Judge0SubmissionPayload) {
  const response = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      source_code: encodeBase64(payload.source_code),
      language_id: payload.language_id,
      stdin: encodeBase64(payload.stdin ?? ""),
      expected_output: payload.expected_output
        ? encodeBase64(payload.expected_output)
        : undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Judge0 wait submission failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as Judge0StatusResponse;
  return {
    ...data,
    stdout: decodeBase64(data.stdout),
    stderr: decodeBase64(data.stderr),
    compile_output: decodeBase64(data.compile_output),
    message: decodeBase64(data.message),
  };
}

export async function getJudge0SubmissionStatus(token: string) {
  const response = await fetch(
    `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true&fields=token,stdout,stderr,compile_output,message,status,time,memory`,
    {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Judge0 status failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as Judge0StatusResponse;
  return {
    ...data,
    stdout: decodeBase64(data.stdout),
    stderr: decodeBase64(data.stderr),
    compile_output: decodeBase64(data.compile_output),
    message: decodeBase64(data.message),
  };
}

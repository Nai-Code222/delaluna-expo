// src/utils/errorParser.ts
export type AppErrorType =
  | "auth"
  | "network"
  | "validation"
  | "firebase-fn"
  | "unknown";

export interface ParsedAppError {
  type: AppErrorType;
  code?: string;
  message: string;
  raw?: unknown;
}

export function parseError(err: unknown): ParsedAppError {
  // Firebase Auth Error
  if (typeof err === "object" && err && "code" in err && typeof (err as any).code === "string") {
    const code = (err as any).code;

    // Network errors Firebase throws
    if (code.includes("network-request-failed")) {
      return {
        type: "network",
        code,
        message: "Network connection lost. Please try again.",
        raw: err,
      };
    }

    // Typical Firebase auth errors
    switch (code) {
      case "auth/email-already-in-use":
        return {
          type: "auth",
          code,
          message: "That email is already registered.",
          raw: err,
        };
      case "auth/invalid-email":
        return {
          type: "auth",
          code,
          message: "Please enter a valid email.",
          raw: err,
        };
      case "auth/weak-password":
        return {
          type: "auth",
          code,
          message: "Your password is too weak.",
          raw: err,
        };
    }

    return {
      type: "auth",
      code,
      message: "Something went wrong with account creation.",
      raw: err,
    };
  }

  // Cloud Function error shape
  if (typeof err === "object" && err && "details" in err) {
    return {
      type: "firebase-fn",
      message: (err as any).message || "A server error occurred.",
      raw: err,
    };
  }

  // JS error
  if (err instanceof Error) {
    return {
      type: "unknown",
      message: err.message,
      raw: err,
    };
  }

  // Fallback
  return {
    type: "unknown",
    message: "An unexpected error occurred.",
    raw: err,
  };
}
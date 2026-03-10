/**
 * @jest-environment node
 */

// Mock Next.js server components before any imports
jest.mock("next/server", () => {
  return {
    NextRequest: jest.fn(),
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => {
        const response = {
          status: init?.status || 200,
          ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
          json: async () => body,
          headers: new Map(),
        };
        return response;
      },
    },
  };
});

// Mock fetch globally
global.fetch = jest.fn();

import { NextRequest } from "next/server";
import { POST } from "../route";

describe("Vercel Webhook Proxy - POST /api/vercel-webhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    // Reset process.env before each test
    process.env = { ...originalEnv };
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // Helper function to create mock NextRequest
  const createMockRequest = (
    headers: Record<string, string>,
    body: unknown,
  ): NextRequest => {
    return {
      headers: {
        get: (key: string) => headers[key.toLowerCase()] || null,
      },
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe("Step 1: Webhook Secret Verification", () => {
    it("should return 500 if WEBHOOK_SECRET is not configured", async () => {
      delete process.env.WEBHOOK_SECRET;

      const request = createMockRequest({ "x-webhook-secret": "test" }, {});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Server configuration error" });
      expect(console.error).toHaveBeenCalledWith(
        "❌ STEP 1 FAILED: WEBHOOK_SECRET not configured",
      );
    });

    it("should return 401 if webhook secret is missing", async () => {
      process.env.WEBHOOK_SECRET = "correct-secret";

      const request = createMockRequest({}, {});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(console.error).toHaveBeenCalledWith(
        "❌ STEP 1 FAILED: Invalid or missing webhook secret",
      );
    });

    it("should return 401 if webhook secret is invalid", async () => {
      process.env.WEBHOOK_SECRET = "correct-secret";

      const request = createMockRequest(
        { "x-webhook-secret": "wrong-secret" },
        {},
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(console.error).toHaveBeenCalledWith(
        "❌ STEP 1 FAILED: Invalid or missing webhook secret",
      );
    });

    it("should pass verification with valid webhook secret", async () => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      delete process.env.GITHUB_TOKEN; // Remove to fail at step 2

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        {},
      );

      await POST(request);

      expect(console.log).toHaveBeenCalledWith(
        "✅ STEP 1 PASSED: Webhook secret verified",
      );
    });
  });

  describe("Step 2: Environment Variables Check", () => {
    it("should return 500 if GITHUB_TOKEN is not configured", async () => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      delete process.env.GITHUB_TOKEN;

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        {},
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Server configuration error" });
      expect(console.error).toHaveBeenCalledWith("❌ STEP 2 FAILED");
    });

    it("should pass environment check with valid GITHUB_TOKEN", async () => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      process.env.GITHUB_TOKEN = "github-token-123";

      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(console.log).toHaveBeenCalledWith("✅ STEP 2 PASSED");
    });
  });

  describe("Step 3-4: Payload Processing", () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      process.env.GITHUB_TOKEN = "github-token-123";
    });

    it("should process minimal Vercel webhook payload", async () => {
      const mockPayload = {
        deployment: {
          url: "test-deployment.vercel.app",
          id: "deploy-123",
          createdAt: 1678886400000,
        },
        project: {
          name: "test-project",
        },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "GitHub Actions workflow triggered",
      });
    });

    it("should process full Vercel webhook payload with meta data", async () => {
      const mockPayload = {
        deployment: {
          url: "test-deployment.vercel.app",
          id: "deploy-456",
          createdAt: 1678886400000,
          meta: {
            githubCommitSha: "abc123def456",
            githubCommitMessage: "feat: add new feature",
            githubCommitRef: "feature/test",
          },
        },
        project: {
          name: "ai-product-search",
        },
        alias: ["production.vercel.app"],
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/yudbox/ai-product-search/dispatches",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer github-token-123",
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Vercel-Webhook-Proxy",
          },
          body: JSON.stringify({
            event_type: "vercel-deployment-ready",
            client_payload: {
              deployment_url: "https://test-deployment.vercel.app",
              production_url: "https://production.vercel.app",
              commit_sha: "abc123def456",
              commit_message: "feat: add new feature",
              project_name: "ai-product-search",
              branch: "feature/test",
              deployment_id: "deploy-456",
              created_at: 1678886400000,
            },
          }),
        }),
      );
    });

    it("should handle payload with missing optional fields", async () => {
      const mockPayload = {
        deployment: {},
        project: {},
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/yudbox/ai-product-search/dispatches",
        expect.objectContaining({
          body: expect.stringContaining('"commit_message":"No commit message"'),
        }),
      );
    });

    it("should handle payload using fallback url field", async () => {
      const mockPayload = {
        url: "fallback-url.vercel.app",
        deployment: {},
        project: {},
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(
            '"deployment_url":"https://fallback-url.vercel.app"',
          ),
        }),
      );
    });

    it("should handle completely empty payload", async () => {
      const mockPayload = {};

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/yudbox/ai-product-search/dispatches",
        expect.objectContaining({
          body: expect.stringContaining('"commit_message":"No commit message"'),
        }),
      );
    });
  });

  describe("Step 5-6: GitHub API Integration", () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      process.env.GITHUB_TOKEN = "github-token-123";
    });

    it("should successfully trigger GitHub Actions with 204 response", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "GitHub Actions workflow triggered",
      });
      expect(console.log).toHaveBeenCalledWith(
        "✅ STEP 6 PASSED: GitHub API accepted the request",
      );
    });

    it("should successfully trigger GitHub Actions with ok=true response", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "GitHub Actions workflow triggered",
      });
    });

    it("should handle GitHub API authentication error (401)", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        ok: false,
        text: jest.fn().mockResolvedValue("Bad credentials"),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: "GitHub API error",
        details: "Bad credentials",
        status: 401,
      });
      expect(console.error).toHaveBeenCalledWith(
        "❌ STEP 6 FAILED: GitHub API error",
      );
    });

    it("should handle GitHub API rate limit error (403)", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 403,
        ok: false,
        text: jest.fn().mockResolvedValue("API rate limit exceeded"),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: "GitHub API error",
        details: "API rate limit exceeded",
        status: 403,
      });
    });

    it("should handle GitHub API not found error (404)", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
        text: jest.fn().mockResolvedValue("Repository not found"),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "GitHub API error",
        details: "Repository not found",
        status: 404,
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      process.env.GITHUB_TOKEN = "github-token-123";
    });

    it("should handle JSON parsing errors", async () => {
      const request = {
        headers: {
          get: (key: string) =>
            key.toLowerCase() === "x-webhook-secret" ? "correct-secret" : null,
        },
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Internal server error",
        message: "Invalid JSON",
      });
      expect(console.error).toHaveBeenCalledWith(
        "\n❌ EXCEPTION CAUGHT: Webhook processing error",
      );
    });

    it("should handle fetch network errors", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Internal server error",
        message: "Network error",
      });
    });

    it("should handle unknown errors", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockRejectedValue("String error");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Internal server error",
        message: "Unknown error",
      });
    });

    it("should handle errors when GitHub API response.text() fails", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 500,
        ok: false,
        text: jest.fn().mockRejectedValue(new Error("Text parsing failed")),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Internal server error",
        message: "Text parsing failed",
      });
    });
  });

  describe("Console Logging", () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = "correct-secret";
      process.env.GITHUB_TOKEN = "github-token-123";
    });

    it("should log all processing steps for successful request", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      await POST(request);

      expect(console.log).toHaveBeenCalledWith("=== WEBHOOK PROXY START ===");
      expect(console.log).toHaveBeenCalledWith(
        "✅ STEP 1 PASSED: Webhook secret verified",
      );
      expect(console.log).toHaveBeenCalledWith("✅ STEP 2 PASSED");
      expect(console.log).toHaveBeenCalledWith(
        "\n--- STEP 3: Parse Vercel webhook payload ---",
      );
      expect(console.log).toHaveBeenCalledWith(
        "\n--- STEP 4: Extract deployment data ---",
      );
      expect(console.log).toHaveBeenCalledWith("Data extracted successfully");
      expect(console.log).toHaveBeenCalledWith(
        "\n✅ STEP 4 PASSED: Data extracted successfully",
      );
      expect(console.log).toHaveBeenCalledWith(
        "\n--- STEP 5: Send request to GitHub API ---",
      );
      expect(console.log).toHaveBeenCalledWith(
        "Sending repository_dispatch event",
      );
      expect(console.log).toHaveBeenCalledWith(
        "\n--- STEP 6: GitHub API Response ---",
      );
      expect(console.log).toHaveBeenCalledWith("Response status:", 204);
      expect(console.log).toHaveBeenCalledWith(
        "✅ STEP 6 PASSED: GitHub API accepted the request",
      );
      expect(console.log).toHaveBeenCalledWith(
        "=== WEBHOOK PROXY SUCCESS ===\n",
      );
    });

    it("should log exception details on error", async () => {
      const mockPayload = {
        deployment: { url: "test.vercel.app" },
        project: { name: "test-project" },
      };

      const request = createMockRequest(
        { "x-webhook-secret": "correct-secret" },
        mockPayload,
      );

      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network failure"),
      );

      await POST(request);

      expect(console.error).toHaveBeenCalledWith(
        "\n❌ EXCEPTION CAUGHT: Webhook processing error",
      );
      expect(console.error).toHaveBeenCalledWith(
        "=== WEBHOOK PROXY EXCEPTION ===\n",
      );
    });
  });

  describe("Integration Tests", () => {
    it("should complete full workflow from webhook to GitHub dispatch", async () => {
      process.env.WEBHOOK_SECRET = "production-secret";
      process.env.GITHUB_TOKEN = "ghp_token123";

      const vercelPayload = {
        deployment: {
          url: "my-app-xyz123.vercel.app",
          id: "dpl_12345",
          createdAt: 1678886400000,
          meta: {
            githubCommitSha: "a1b2c3d4e5",
            githubCommitMessage: "fix: resolve pagination bug",
            githubCommitRef: "main",
          },
        },
        project: {
          name: "ai-product-search",
        },
        alias: ["ai-product-search.com"],
      };

      const request = createMockRequest(
        { "x-webhook-secret": "production-secret" },
        vercelPayload,
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true,
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify successful end-to-end flow
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify GitHub API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/yudbox/ai-product-search/dispatches",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer ghp_token123",
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Vercel-Webhook-Proxy",
          },
          body: JSON.stringify({
            event_type: "vercel-deployment-ready",
            client_payload: {
              deployment_url: "https://my-app-xyz123.vercel.app",
              production_url: "https://ai-product-search.com",
              commit_sha: "a1b2c3d4e5",
              commit_message: "fix: resolve pagination bug",
              project_name: "ai-product-search",
              branch: "main",
              deployment_id: "dpl_12345",
              created_at: 1678886400000,
            },
          }),
        },
      );
    });
  });
});

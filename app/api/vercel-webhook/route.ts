import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Webhook Proxy
 *
 * This endpoint receives webhooks from Vercel after successful deployment
 * and forwards them to GitHub API to trigger GitHub Actions workflow.
 *
 * Flow:
 * 1. Vercel deploys code → deployment.succeeded
 * 2. Vercel sends webhook to this endpoint
 * 3. This endpoint adds GitHub token and forwards to GitHub API
 * 4. GitHub API triggers repository_dispatch event
 * 5. GitHub Actions runs deployment.yml workflow
 * 6. Workflow sends email notification
 */
export async function POST(request: NextRequest) {
  console.log("=== WEBHOOK PROXY START ===");

  // STEP 1: Verify webhook secret for security
  // Secret is sent in custom header: X-Webhook-Secret
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");

  if (!WEBHOOK_SECRET) {
    console.error("❌ STEP 1 FAILED: WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
    console.error("❌ STEP 1 FAILED: Invalid or missing webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("✅ STEP 1 PASSED: Webhook secret verified");

  // STEP 2: Environment variables check
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = "yudbox/ai-product-search";

  // Check if token is set
  if (!GITHUB_TOKEN) {
    console.error("❌ STEP 2 FAILED");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
  console.log("✅ STEP 2 PASSED");

  try {
    // Get payload from Vercel webhook
    const payload = await request.json();

    console.log("\n--- STEP 3: Parse Vercel webhook payload ---");

    // Extract deployment data
    const deployment = payload.deployment || {};
    const project = payload.project || {};
    const meta = deployment.meta || {};

    console.log("\n--- STEP 4: Extract deployment data ---");
    console.log("Data extracted successfully");

    // URLs
    const deploymentUrl = deployment.url || payload.url;
    const productionUrl = payload.alias?.[0] || deploymentUrl;

    // Git information
    const commitSha = meta.githubCommitSha || "";
    const commitMessage = meta.githubCommitMessage || "No commit message";
    const branch = meta.githubCommitRef || "main";

    // Build payload for GitHub
    const githubPayload = {
      event_type: "vercel-deployment-ready",
      client_payload: {
        deployment_url: deploymentUrl ? `https://${deploymentUrl}` : "",
        production_url: productionUrl ? `https://${productionUrl}` : "",
        commit_sha: commitSha,
        commit_message: commitMessage,
        project_name: project.name || "ai-product-search",
        branch: branch,
        deployment_id: deployment.id || "",
        created_at: deployment.createdAt || Date.now(),
      },
    };

    console.log("\n✅ STEP 4 PASSED: Data extracted successfully");

    // Send repository_dispatch event to GitHub
    const githubUrl = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;
    console.log("\n--- STEP 5: Send request to GitHub API ---");
    console.log("Sending repository_dispatch event");

    const response = await fetch(githubUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Vercel-Webhook-Proxy",
      },
      body: JSON.stringify(githubPayload),
    });

    console.log("\n--- STEP 6: GitHub API Response ---");
    console.log("Response status:", response.status);

    // GitHub API returns 204 No Content on success
    if (response.status === 204 || response.ok) {
      console.log("✅ STEP 6 PASSED: GitHub API accepted the request");
      console.log("=== WEBHOOK PROXY SUCCESS ===\n");
      return NextResponse.json({
        success: true,
        message: "GitHub Actions workflow triggered",
      });
    }

    // Handle GitHub API errors
    const errorText = await response.text();
    console.error("❌ STEP 6 FAILED: GitHub API error");

    return NextResponse.json(
      {
        error: "GitHub API error",
        details: errorText,
        status: response.status,
      },
      { status: response.status },
    );
  } catch (error) {
    // Log errors
    console.error("\n❌ EXCEPTION CAUGHT: Webhook processing error");

    console.error("=== WEBHOOK PROXY EXCEPTION ===\n");

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

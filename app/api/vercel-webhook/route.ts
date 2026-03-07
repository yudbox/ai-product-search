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
  console.log("Request method:", request.method);

  // Environment variables check
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = "yudbox/ai-product-search";

  console.log("Environment check:");
  console.log("- GITHUB_TOKEN exists:", !!GITHUB_TOKEN);
  console.log("- GITHUB_TOKEN length:", GITHUB_TOKEN?.length || 0);
  console.log("- GITHUB_REPO:", GITHUB_REPO);

  // Check if token is set
  if (!GITHUB_TOKEN) {
    console.error("❌ STEP 2 FAILED: GITHUB_TOKEN not set in environment");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
  console.log("✅ STEP 2 PASSED: GITHUB_TOKEN is configured");

  try {
    // Get payload from Vercel webhook
    const payload = await request.json();

    console.log("\n--- STEP 3: Parse Vercel webhook payload ---");
    console.log("Full payload:", JSON.stringify(payload, null, 2));
    console.log("Payload type:", payload.type);
    console.log("Deployment ID:", payload.deployment?.id);
    console.log("Project name:", payload.project?.name);

    // Extract deployment data
    const deployment = payload.deployment || {};
    const project = payload.project || {};
    const meta = deployment.meta || {};

    console.log("\n--- STEP 4: Extract deployment data ---");
    console.log("Deployment object keys:", Object.keys(deployment));
    console.log("Project object keys:", Object.keys(project));
    console.log("Meta object keys:", Object.keys(meta));

    // URLs
    const deploymentUrl = deployment.url || payload.url;
    const productionUrl = payload.alias?.[0] || deploymentUrl;

    console.log("URLs:");
    console.log("- Deployment URL:", deploymentUrl);
    console.log("- Production URL:", productionUrl);
    console.log("- Aliases:", payload.alias);

    // Git information
    const commitSha = meta.githubCommitSha || "";
    const commitMessage = meta.githubCommitMessage || "No commit message";
    const branch = meta.githubCommitRef || "main";

    console.log("Git info:");
    console.log("- Commit SHA:", commitSha);
    console.log("- Commit message:", commitMessage);
    console.log("- Branch:", branch);

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
    console.log("GitHub payload to send:");
    console.log(JSON.stringify(githubPayload, null, 2));

    // Send repository_dispatch event to GitHub
    const githubUrl = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;
    console.log("\n--- STEP 5: Send request to GitHub API ---");
    console.log("Target URL:", githubUrl);
    console.log("Method: POST");
    console.log("Headers:");
    console.log("- Authorization: Bearer ghp_***" + GITHUB_TOKEN.slice(-4));
    console.log("- Accept: application/vnd.github.v3+json");
    console.log("- Content-Type: application/json");

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
    console.log("Response statusText:", response.statusText);
    console.log(
      "Response headers:",
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2),
    );

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
    console.error("Status:", response.status);
    console.error("Status text:", response.statusText);
    console.error("Error body:", errorText);
    console.error("=== WEBHOOK PROXY FAILED ===\n");

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
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
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

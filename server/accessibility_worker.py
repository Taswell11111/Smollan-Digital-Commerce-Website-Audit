import asyncio
import json
import os
from typing import List, Literal
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from google import genai
from google.genai import types

# ---------------------------------------------------------------------------
# 1. PYDANTIC SCHEMAS (WCAG 2.2 AA Audit Models)
# ---------------------------------------------------------------------------

class RemediationItem(BaseModel):
    wcag_criteria: str = Field(
        ..., 
        description="The relevant WCAG 2.2 AA success criterion (e.g., '1.4.3 Contrast (Minimum)', '2.4.7 Focus Visible')."
    )
    severity: Literal['CRITICAL', 'SERIOUS', 'MODERATE', 'MINOR'] = Field(
        ..., 
        description="Violation severity level: CRITICAL, SERIOUS, MODERATE, or MINOR."
    )
    element_identifier: str = Field(
        ..., 
        description="CSS selector, HTML tag, or visual location of the affected element."
    )
    issue_description: str = Field(
        ..., 
        description="Clear explanation of the accessibility barrier."
    )
    remediation_fix: str = Field(
        ..., 
        description="Actionable code or design fix required to achieve compliance."
    )

class AuditResult(BaseModel):
    compliance_status: Literal['COMPLIANT', 'NON-COMPLIANT'] = Field(
        ..., 
        description="'NON-COMPLIANT' if any CRITICAL or SERIOUS violation is present, otherwise 'COMPLIANT'."
    )
    critical_count: int = Field(
        ..., 
        description="Count of complete user dead-ends or critical accessibility blockers."
    )
    serious_count: int = Field(
        ..., 
        description="Count of severe user barriers significantly degrading navigation or interaction."
    )
    minor_moderate_count: int = Field(
        ..., 
        description="Count of moderate or minor/cosmetic accessibility issues."
    )
    remediation_backlog: List[RemediationItem] = Field(
        default_factory=list,
        description="Detailed list of detected WCAG 2.2 AA violations with remediation steps."
    )
    accessibility_wins: List[str] = Field(
        default_factory=list,
        description="List of correctly implemented WCAG 2.2 AA accessibility features."
    )

# ---------------------------------------------------------------------------
# 2. SYSTEM INSTRUCTION
# ---------------------------------------------------------------------------

ACCESSIBILITY_ENGINE_SYSTEM_INSTRUCTION = (
    "You are an expert, strict Web Accessibility Automation Bot specialized in WCAG 2.2 AA compliance audits. "
    "You will be provided with BOTH a live-rendered visual screenshot and the corresponding computed HTML source code of a web page. "
    "Your mission is to cross-reference the layout visual indicators (like text contrast, spacing, visible focus design) "
    "with the underlying HTML semantic structure to evaluate the page against the WCAG 2.2 AA Audit Benchmark. "
    "Flag issues and categorize them strictly by severity: CRITICAL, SERIOUS, MODERATE, or MINOR. "
    "If even one CRITICAL or SERIOUS violation is present across the code or the image, compliance_status must be 'NON-COMPLIANT'."
)

# ---------------------------------------------------------------------------
# 3. PLAYWRIGHT DATA COLLECTION FUNCTION
# ---------------------------------------------------------------------------

async def collect_page_data(target_url: str, max_html_chars: int = 60000) -> tuple[str, bytes]:
    """
    Spawns an async Playwright headless browser instance, navigates to target_url,
    waits for network idle, and returns (hydrated_dom_html, screenshot_png_bytes).
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1
        )
        page = await context.new_page()
        
        # Navigate to target URL and wait for full JS execution
        await page.goto(target_url, wait_until="networkidle", timeout=30000)
        
        # Extract hydrated DOM content (truncated to max_html_chars)
        full_html = await page.content()
        truncated_html = full_html[:max_html_chars]
        
        # Capture viewport screenshot PNG buffer
        screenshot_bytes = await page.screenshot(full_page=False, type="png")
        
        await browser.close()
        return truncated_html, screenshot_bytes

# ---------------------------------------------------------------------------
# 4. MAIN ACCESSIBILITY AUDIT PIPELINE
# ---------------------------------------------------------------------------

async def run_wcag_accessibility_audit(
    target_url: str, 
    api_key: str | None = None,
    model_name: str = "gemini-3.8-flash"
) -> AuditResult:
    """
    Runs an end-to-end automated WCAG 2.2 AA accessibility audit against a target URL.
    1. Collects live DOM and screenshot via Playwright.
    2. Packages multimodal input into google-genai SDK format.
    3. Queries Gemini using structured Pydantic output schema and strict temperature.
    4. Returns a typed AuditResult instance.
    """
    # Step 1: Collect live rendered DOM and viewport screenshot
    dom_html, screenshot_bytes = await collect_page_data(target_url)

    # Step 2: Initialize official google-genai SDK client
    client_key = api_key or os.environ.get("GEMINI_API_KEY")
    client = genai.Client(
        api_key=client_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

    # Step 3: Package multimodal payload (binary bytes part + text prompt)
    screenshot_part = types.Part.from_bytes(
        data=screenshot_bytes,
        mime_type="image/png"
    )
    
    user_prompt = (
        f"Perform a comprehensive WCAG 2.2 AA compliance audit on the following web page.\n\n"
        f"Target URL: {target_url}\n\n"
        f"Computed HTML DOM Source Code (truncated to 60,000 characters):\n"
        f"```html\n{dom_html}\n```\n\n"
        f"Cross-reference the visual screenshot with the HTML DOM structure above to evaluate WCAG 2.2 AA compliance."
    )

    contents = [screenshot_part, user_prompt]

    # Step 4: Call Gemini API with structured schema and strict system instruction
    config = types.GenerateContentConfig(
        system_instruction=ACCESSIBILITY_ENGINE_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=AuditResult,
        temperature=0.1
    )

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=config
    )

    # Step 5: Return structured AuditResult
    if response.parsed:
        return response.parsed
    
    raw_json = json.loads(response.text or "{}")
    return AuditResult.model_validate(raw_json)


if __name__ == "__main__":
    # Test execution CLI entrypoint
    import sys
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    print(f"Running WCAG 2.2 AA Audit against: {test_url}...")
    result = asyncio.run(run_wcag_accessibility_audit(test_url))
    print("\n--- Audit Result ---")
    print(result.model_dump_json(indent=2))

/**
 * Strip markdown code fences from AI-generated summary strings.
 *
 * The Gemini API sometimes wraps its HTML output in markdown fences:
 *   ```html
 *   <h2>Summary</h2>...
 *   ```
 *
 * These fences are not valid HTML and leak as visible text when rendered
 * via dangerouslySetInnerHTML or stripped for plain-text previews.
 *
 * This function removes the fences and returns clean HTML.
 *
 * @param {string} raw - The raw aiSummary string from the database
 * @returns {string} Clean HTML with fences removed
 */
const cleanAiSummary = (raw) => {
  if (!raw) return "";
  let cleaned = raw.trim();
  // Remove opening fence: ```html, ```json, ``` or any ```<language>
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*\n?/i, "");
  // Remove closing fence: ``` (possibly with trailing whitespace/newlines)
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
};

export default cleanAiSummary;

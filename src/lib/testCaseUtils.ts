/**
 * Utility functions for test case management
 */

export interface TestCase {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  steps: string[];
  scripts?: any[];
}

/**
 * Extracts unique categories from a list of test cases
 * This should be used when generating test cases with AI to provide existing categories
 * to the LLM so it can classify new test cases appropriately.
 * 
 * @param testCases - Array of test cases
 * @returns Array of unique category names
 * 
 * @example
 * const categories = getUniqueCategories(testCases);
 * // Pass categories to LLM prompt:
 * // "Here are the existing test case categories: Authentication Tests, User Profile Tests, E-Commerce Flow.
 * //  Please assign each generated test case to one of these categories or create a new category if needed."
 */
export function getUniqueCategories(testCases: TestCase[]): string[] {
  const categories = testCases.map(tc => tc.category).filter(Boolean);
  return Array.from(new Set(categories)).sort();
}

/**
 * Formats categories for inclusion in an LLM prompt
 * 
 * @param testCases - Array of test cases
 * @returns Formatted string of categories for LLM prompts
 */
export function formatCategoriesForPrompt(testCases: TestCase[]): string {
  const categories = getUniqueCategories(testCases);
  if (categories.length === 0) {
    return "No existing categories. Please create appropriate categories for the generated test cases.";
  }
  return `Existing test case categories: ${categories.join(", ")}. Please assign each generated test case to one of these categories or create a new category if it doesn't fit any existing ones.`;
}

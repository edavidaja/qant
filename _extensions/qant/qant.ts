// qant: Categorical imperative for Quarto categories
// Validates document categories against a centralized allow-list

// Import YAML parser from Deno stdlib
import { parse as parseYaml } from "https://deno.land/std@0.217.0/yaml/mod.ts";

interface InspectData {
  files: {
    [filepath: string]: {
      metadata?: {
        categories?: string[];
      };
    };
  };
}

interface QantConfig {
  categories: string[];
}

interface Violation {
  file: string;
  category: string;
}

function readAllowedCategories(): Set<string> | null {
  try {
    const content = Deno.readTextFileSync("_qant.yml");
    const config = parseYaml(content) as QantConfig;

    if (!config.categories || !Array.isArray(config.categories)) {
      console.warn("Warning: _qant.yml does not contain a valid 'categories' array.");
      return null;
    }

    return new Set(config.categories);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log("Warning: _qant.yml not found. Skipping category validation.");
      return null;
    }
    throw error;
  }
}

function runQuartoInspect(): InspectData {
  const cmd = new Deno.Command("quarto", {
    args: ["inspect"],
    stdout: "piped",
    stderr: "piped",
  });

  const output = cmd.outputSync();

  if (!output.success) {
    const errorMsg = new TextDecoder().decode(output.stderr);
    throw new Error(`Failed to run quarto inspect: ${errorMsg}`);
  }

  const jsonOutput = new TextDecoder().decode(output.stdout);
  return JSON.parse(jsonOutput) as InspectData;
}

function validateCategories(
  inspectData: InspectData,
  allowedCategories: Set<string>
): Violation[] {
  const violations: Violation[] = [];

  for (const [filepath, filedata] of Object.entries(inspectData.files)) {
    if (filedata.metadata?.categories) {
      for (const category of filedata.metadata.categories) {
        if (!allowedCategories.has(category)) {
          violations.push({ file: filepath, category });
        }
      }
    }
  }

  return violations;
}

// Main execution
const allowed = readAllowedCategories();

if (allowed) {
  const inspectData = runQuartoInspect();
  const violations = validateCategories(inspectData, allowed);

  if (violations.length > 0) {
    console.error("\nCategory validation failed!\n");
    console.error("The following files use categories not listed in _qant.yml:\n");

    for (const v of violations) {
      console.error(`  ${v.file}: '${v.category}'`);
    }

    console.error("\nPlease add these categories to _qant.yml or remove them from the documents.\n");
    Deno.exit(1);
  } else {
    console.log("All categories validated successfully.");
  }
}

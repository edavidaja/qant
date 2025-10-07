-- qant: Categorical imperative for Quarto categories
-- Validates document categories against a centralized allow-list

local function read_allowed_categories()
  -- Read _qant.yml to get allowed categories
  local file = io.open("_qant.yml", "r")
  if not file then
    quarto.log.output("Warning: _qant.yml not found. Skipping category validation.")
    return nil
  end

  local content = file:read("*all")
  file:close()

  -- Simple YAML parsing for categories list
  -- Look for "categories:" followed by list items
  local categories = {}
  for line in content:gmatch("[^\r\n]+") do
    local cat = line:match("^%s*-%s*(.+)$")
    if cat then
      categories[cat] = true
    end
  end

  return categories
end

local function run_quarto_inspect()
  -- Execute quarto inspect and capture output
  local handle = io.popen("quarto inspect")
  if not handle then
    error("Failed to run quarto inspect")
  end

  local json_output = handle:read("*all")
  handle:close()

  return quarto.json.decode(json_output)
end

local function validate_categories(inspect_data, allowed_categories)
  local violations = {}

  -- Iterate through all files in the inspect data
  for filepath, filedata in pairs(inspect_data.fileInformation) do
    if filedata.metadata and filedata.metadata.categories then
      local doc_categories = filedata.metadata.categories

      -- Check each category in the document
      for _, category in ipairs(doc_categories) do
        if not allowed_categories[category] then
          table.insert(violations, {
            file = filepath,
            category = category
          })
        end
      end
    end
  end

  return violations
end

-- Main execution
local allowed = read_allowed_categories()

if allowed then
  local inspect_data = run_quarto_inspect()
  local violations = validate_categories(inspect_data, allowed)

  if #violations > 0 then
    quarto.log.output("\nCategory validation failed!\n")
    quarto.log.output("The following files use categories not listed in _qant.yml:\n")

    for _, v in ipairs(violations) do
      quarto.log.output("  " .. v.file .. ": '" .. v.category .. "'")
    end

    quarto.log.output("\nPlease add these categories to _qant.yml or remove them from the documents.\n")
    error("Category validation failed")
  else
    quarto.log.output("All categories validated successfully.")
  end
end

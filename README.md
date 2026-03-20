# Deal Structurer

M&A deal structure visualization tool. Input a term sheet or deal description, get a structured breakdown of parties, relationships, transfer mechanics, and consideration flows rendered as an interactive deal diagram.

## Architecture

- **Next.js** (TypeScript, Tailwind CSS)
- **Anthropic API** for parsing natural language deal descriptions into structured data
- **React Flow** or **D3** for deal diagram rendering

## How It Works

1. User pastes a term sheet, LOI, or free-text deal description
2. Claude API parses the text and extracts four structured blocks:
   - **Entities** (parties, types, jurisdictions, roles)
   - **Relationships** (ownership, guarantees, management, LP interests)
   - **Structure** (equity/assets, transfer mechanism, pre-reorg)
   - **Consideration** (every cash flow between specific entity pairs)
3. User reviews and edits the extracted data in structured tables
4. Click "Generate" to render the deal diagram and auto-detect flags

## Project Structure

```
docs/           # Spec, schemas, design notes
src/            # Application source (Next.js app dir)
public/         # Static assets
```

## Status

Pre-development. Spec in progress.

# Figma Airtable Sync

Figma to Airtable because why not?

Figma Airtable Sync is a plugin that syncs your Figma Designs with Airtable. It integrates two versatile tools to power some hopefully useful workflow.

- Syncs **Nodes** in a Figma **Page** to an Airtable **Table**
- When Sync is on, listen to Figma changes and update Airtable
- Saves credentials from the last sync to local storage for next sync

## How to use

In Airtable
1. Create the Table you want to sync to in the base you want.
   1. The Table requires the following fields **and types**(or the sync will fail silently)
      1. `figma_id` - Text
      2. `sync_status` - Single Select, with options `active` and `deleted`
      3. `name` - Text
      4. `type` - Single Select, with options `COMPONENT`, `FRAME`, `INSTANCE`, `ELLIPSE`, `GROUP`, `RECTANGLE`, `LINE`, `VECTOR`, `POLYGON`, `BOOLEAN_OPERATION`
      5. `x` - Number Decimal
      6. `y` - Number Decimal
      7. `width` - Number Decimal
      8. `height` - Number Decimal
2. Create a [Personal Access Token for Airtable](https://airtable.com/developers/web/guides/personal-access-tokens)
   1. Limit the token to the base you want to sync to
   2. The Token needs read and edit permissions to sync
3. Get your Base ID and Table Name
   1. The Base ID is the string of characters in the URL after `/base/`
   2. The Table Name is the name of the table you created in step 1

In Figma
*pending pluging marketplace listing*
1. clone this repo
2. In Desktop Figma, go to Plugins > Development > Import Plugin from manifest
   1. Select the `manifest.json` file in the root of this repo

## Roadmap

TBD - Just thought it would be fun to build. Open to suggestions.
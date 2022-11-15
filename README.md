# Rustdoc link check

Checks the codebase for broken links in the documentation.

## Inputs

### `private`

**Optional, default: `true`** Whether or not to check private items' doc links.

### `working-directory`

**Optional, default: `./`** The working directory to run `cargo doc` in.

## Example usage

```yaml
uses: Icelk/rustdoc-link-check@v2
with:
    private: true
```

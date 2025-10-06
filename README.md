# qant

> Act only according to that maxim whereby you can at the same time will that it should become a universal law.

but for quarto categories

## Installing

```bash
quarto add edavidaja/qant
```

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

`qant` adds a pre-render step to your project that validates page categories against a centralized list.
For projects with large numbers of documents and collaborators, this makes it easy to keep the list of categories consistent.

1. Add the `qant` extension to your project
2. Add a `_qant.yml` to the root of your quarto project
   1. List categories you want to be allowed in this file
3. `quarto render` as normal -- if you add a new category to a document without first adding it to `_qant.yml`, rendering will fail.

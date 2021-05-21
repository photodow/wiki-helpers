# Wiki helpers

This action offers a number of helpers to help automate some of the laborious tasks across many files within a wiki. For example generating table of contents or backlinking references.

- [Getting started](#Getting-started)
- [Helpers](#Helpers)
- [How it works](#How-it-works)

## Getting started

### Template
To start off with you need to add as many or as few templating placeholders to your markdown files. Each of the helpers has a beginning and an end. It's identified via it's unique `ID`. Anything you put in-between the start and end will be replaced by auto generated content.

```markdown
<!-- {{ID}} start [...optionName=optionValue] -->
{{auto generated}}
<!-- {{ID}} end -->
```

###### Templating options

| name           | type       | description |
|:---------------|:-----------|:------------|
| `title`        | `String`   | Overrides the title for this template. |
| `count`        | `Number`   | Pass in a number to indicate how many list items are in this section. |
| `reduce`       | `Boolean`  | `true (default)` adds additional space top and bottom `false` removes that extra spacing. |
| `templatePath` | `String`   | Path to your custom template for that specific section. |
| `type`         | `String`   | `accordion (default)`, `contentOnly`, `titleContent` |
| `open`         | `Boolean`  | `false (default)` accordion is closed by default and hides its contents `true` Keeps it open on load. |
| `headingLevel` | `Number`   | `1-6` default is `5`. Determines size and hierarchy of title. |
| `depthStart`   | `Number`   | `1-6` default is `0`. In table of contents it determines what level of hierarchy to begin building from. |
| `depthEnd`     | `Number`   | `1-6` default is `3`. In table of contents it sets how many levels to go down based on `depthStart`.    |
| `group`        | `String`   | Comma separated list of categories to list out. Default lists all. Remove dashes. |

<details>
<summary><strong>Examples</strong></summary>

###### Before

```markdown
<!-- toc start open="true" -->
{{auto generated}}
<!-- toc end -->

---

<!-- toc start title="Content only TOC" type="contentOnly" -->
{{auto generated}}
<!-- toc end -->

---

<!-- toc start title="Title and List Table of Contents" type="titleContent" -->
{{auto generated}}
<!-- toc end -->
```

###### After

> 
> <details>
> <summary><strong>Table of contents</strong></summary><br />
>
> - [Level 1](#)
>   - [Level 2](#)
>
> <br />
> </details>
>
> ---
>
> - [Level 1](#)
>   - [Level 2](#)
>
> ---
>
> ##### Title and List Table
> - [Level 1](#)
>   - [Level 2](#)

</details>

### GitHub Actions
You can find this script in the [GitHub Action Marketplace](https://github.com/marketplace/actions/wiki-helpers). Below are a two ways you can use this within your action workflow.

#### Usage

```yml
- name: Wiki Helpers
  uses: photodow/wiki-helpers@1.2.2
```

<details>
<summary><strong>Edit wiki files directly</strong></summary>

```yml
name: Edit wiki files
on:
  gollum:
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          repository: ${{github.repository}}.wiki
      - uses: photodow/wiki-helpers@1.2.2
        with:
          rootPath: ./
          buildPath: ./
      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: Github Actions - Wiki helpers
```

</details>

<details>
<summary><strong>Edit in repo, and copy to wiki</strong></summary>

```yml
name: Repo to wiki
on:
  workflow_dispatch:
  push:
    branches:
    - main

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: photodow/wiki-helpers@1.2.2
        with:
          rootPath: "./samples"
          flattenDir: true
      - name: Upload Documentation to Wiki
        uses: joeizzard/action-wiki-sync@master
        with:
          username: ${{ github.event.pusher.name }}
          access_token: ${{ secrets.GITHUB_TOKEN }}
          wiki_folder: "./build"
          commit_username: ${{ github.event.pusher.name }}
          commit_email: ${{ github.event.pusher.email }}
          commit_message: 'action wiki sync: ${{ github.event.commits[0].message }}'
```

</details>

### Run script

###### First install script
```terminal
npm install wiki-helpers --save
```

###### Then run script
```terminal
node node_modules/wiki-helpers/index.js [...optionName=optionValue]
```

### Options

| name            | type      | description |
|:----------------|:----------|:------------|
| `rootPath`      | `String`  | `./ (default)` sets path of markdown files. |
| `resetOnly`     | `Boolean` | `false (default)` runs and builds everything as expected. `true` resets all files to original state before the automated content was added.  |
| `templatePath`  | `String`  | Path to your custom template for everything. |
| `depsTitleHook` | `String`  | Title of your dependencies list. Defaults to `Dependencies`. Case sensitive. |
| `buildPath`     | `String`  | `./build (default)` Indicate a directory you would like the updated files to build into. |
| `flattenDir`     | `Boolean`  | `false (default)` By default it maintains folder structure. `true` flattens all the files into a flat structure within the `buildPath`. |

## Helpers

- [Table of contents](#Table-of-contents)
- [Used by](#Used-by)
- [Backlinks](#Backlinks)
- [Category tagging](#Category-tagging)
- [Categories](#Categories)
- [Dependency count](#Dependency-count)


### Table of contents

The table of content searches a document for all the markdown titles `#`, formats them into a list, and inserts into the placeholder code you position.

- Looks for markdown titles, and builds a table of contents list.
- Starts with level 3 titles (###)
- 3 levels depth applied

#### Usage

```markdown
<!-- toc start -->
{{auto generated}}
<!-- toc end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before
```markdown
<!-- toc start -->
<!-- toc end -->

# Level 1
Proin venenatis sagittis placerat.

## Level 2
Duis id diam lectus.

### Level 3
Maecenas rutrum massa risus, et tempor ligula elementum eget.

#### Level 4
Maecenas felis nisl, scelerisque sit amet vestibulum at, porttitor ut felis.

##### Level 5
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

###### Level 6
Donec dictum eros interdum sagittis malesuada.
```

###### After

> <details open="true">
> <summary><strong>Table of contents</strong></summary>
> 
> - [Level 1](#)
> - [Level 2](#)
> - [Level 3](#)
>   - [Level 4](#)
>     - [Level 5](#)
>       - [Level 6](#)
>
> # Level 1
> Proin venenatis sagittis placerat.
> 
> ## Level 2
> Duis id diam lectus.
> 
> ### Level 3
> Maecenas rutrum massa risus, et tempor ligula elementum eget.
> 
> #### Level 4
> Maecenas felis nisl, scelerisque sit amet vestibulum at, porttitor ut felis.
> 
> ##### Level 5
> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
> 
> ###### Level 6
> Donec dictum eros interdum sagittis malesuada.
> 
> </details>

</details>

---

### Used by

The used by dependency tracking looks at a document to see what dependencies it has from a list provided by you. Based on this list it will begin to create used by references in other files found from that list.

- Starts collecting data once line containing `Dependencies` is found.
- Each proceeding line that starts with a `- ` and contains `[[a file name]]` is collected.
- Stops looking after the list ends.

#### Usage

```markdown
<!-- usedby start -->
{{auto generated}}
<!-- usedby end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before

`File-a.md`
```markdown
###### Dependencies
- [[File c]]
```

`File-b.md`
```markdown
###### Dependencies
- [[File c]]
```

`File-c.md`
```markdown
<!-- usedby start -->
<!-- usedby end -->
```

###### After

`File-a.md`

> ###### Dependencies
> - [File c](#)


`File-b.md`

> ###### Dependencies
> - [File c](#)

`File-c.md`
> <details>
> <summary><strong>Used by</strong> (2)</summary>
>
> - [File a](#)
> - [File b](#)
>
> </details>

</details>

---

### Backlinks

Backlinking takes a markdown file and looks for all the markdown files it's being linked back to from. It then compiles that list and inserts the references into the document's placeholder you position.

- Ignores dependency list references.
- Collecting `[[this file name]]` in other files. 
- Collect 50 characters before and after reference.
- Highlight text using [Text fragments](https://web.dev/text-fragments/)

#### Usage
```markdown
<!-- backlinks start -->
{{auto generated}}
<!-- backlinks end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before
`File-a.md`
```
Lorem [[File b]] consectetur adipiscing elit.

<!-- backlinks start -->
<!-- backlinks end -->
```

`File-b.md`
```
Nullam sollicitudin dictum nulla, non iaculis diam sodales eu.

<!-- backlinks start -->
<!-- backlinks end -->

Praesent [[File a]] tristique nisl neque, eu dapibus arcu faucibus elementum. In eu tortor non ex laoreet elementum. Curabitur a mi tempus, egestas ipsum in, eleifend ipsum. Maecenas nisl odio, imperdiet eu magna sed, facilisis porta est. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
```

###### After
`File-a.md`

> Lorem [File b](#) consectetur adipiscing elit.
>
> <details>
> <summary><strong>References</strong> (2)</summary><br />
>
>  **[File a](#)** (2)  
>
> - [Nullam sollicitudin dictum nulla, non iaculis ***File a*** diam sodales eu.](#)
> - [Praesent ***File a*** tristique nisl neque, eu dapibus arcu faucibus ele...](#)
>
> <br />
> </details>

`File-b.md`

> Nullam sollicitudin dictum nulla, non iaculis [File a](#) diam sodales eu.
>
> <details>
> <summary><strong>References</strong> (1)</summary><br />
>
>  **[File a](#)** (1)  
>
> - [Lorem ***File b*** consectetur adipiscing elit.](#)
>
> <br />
> </details>
> 
> Praesent [File a](#) tristique nisl neque, eu dapibus arcu faucibus elementum. In eu tortor non ex laoreet elementum. Curabitur a mi tempus, egestas ipsum in, eleifend ipsum. Maecenas nisl odio, imperdiet eu magna sed, facilisis porta est. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.

</details>

---

### Category tagging

The category tagging determines what category it belongs to based on the folder structure, and inserts into the document based on your placement.

- Categorized by folder names.
- Case sensitive folders.
- Replaces dashes with spaces.


#### Usage

`_File-a.md`

```markdown
<!-- category start -->
{{auto generated}}
<!-- category end -->
```


<details>
<summary><strong>Examples</strong></summary>

###### Before

`Folder structure`

```
| Folder-a
|-- File-a.md
```

`_File-a.md`

```markdown
<!-- category start -->
<!-- category end -->

Curabitur a mi tempus, egestas ipsum in, eleifend ipsum.
```

###### After

> `Folder a`
>
> Curabitur a mi tempus, egestas ipsum in, eleifend ipsum.

</details>

---

### Categories

Categorizes the files by what folders they live in and generates a categorized navigation wherever you place the template placeholder.

- Categorized by folder names.
- Case sensitive folders.
- Replaces dashes with spaces.
- Lists out links by category.

#### Usage

`_Sidebar.md`

```markdown
<!-- categories start -->
{{auto generated}}
<!-- categories end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before

`Folder structure`

```
| Folder-a
|-- File-a.md
| Folder-B
|-- File-b.md
|-- File-c.md
```

`_Sidebar.md`

```markdown
<!-- categories start -->
<!-- categories end -->

Curabitur a mi tempus, egestas ipsum in, eleifend ipsum.
```

###### After

`_Sidebar.md`


> <details>
> <summary><strong>Folder a</strong> (1)</summary>
>
> - [File a](#)
>
> </details>
> <details>
> <summary><strong>Folder B</strong> (2)</summary>
>
> - [File b](#)
> - [File c](#)
>
> </details>
>
> Curabitur a mi tempus, egestas ipsum in, eleifend ipsum.

</details>

---

### Dependency count

After analyzing and collecting the dependencies this helper will count the dependencies and place it wherever you'd like.

- Counts dependencies after collecting.

#### Usage

```markdown
<!-- dependencyCount start -->
{{auto generated}}
<!-- dependencyCount end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before

`File-a.md`
```markdown
###### Dependencies (<!-- dependencyCount start -->{{auto generated}}<!-- dependencyCount end -->)
- [[File b]]
- [[File c]]
```

###### After


`File-a.md`
> ###### Dependencies (2)
> - [File b](#)
> - [File c](#)

</details>


## How it works

The wiki helpers is made up of two types of methods. Miners, and builders. These two different types of methods allows the script to list, read, and write the files only once while also trying to minimize the amount of loops to improve efficiency and performance.

#### Miners
Miners are functions in place to go through each file collect data, and build an organized data object of the wiki files and contents. Some examples might include tracking backlinks, or determining page category type.

| miners | description |
|:--------|:------------|
| `reset`| Resets document by removing all auto generated content so miners can start from a clean slate. |
| `collectDependencies` | Scans all files to find list of dependencies and organizes them by dependency of this file and used by other files |
| `getBacklinks` | Scans all files for references of a given file |

#### Builders
Builders take the mined data that has been organized, formats it into markdown and updates the file before writing.

| builder | description |
|:--------|:------------|
| [`usedby`](#Used-by) | Builds a used by list based on whether it's present in other files' dependency lists. |
| [`backlinks`](#Backlinks) | Builds a list of backlinks if referenced in other files.
| [`toc`](#Table-of-contents) | Scans the given file, and builds a table of contents for that file. |
| [`category`](#category-tagging) | Displays category type for that file. |
| [`dependencyCount`](#Dependency-count) | Counts the number of dependencies and displays that number. |

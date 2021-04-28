# Wiki helpers

This action offers a number of helpers to help automate some of the laborious tasks across many files within a wiki. For example generating table of contents or backlinking references.

- [Helpers](#Helpers)


#### How it works

The wiki helpers is made up of two types of methods. Miners, and builders. These two different types of methods allows the script to list, read, and write the files only once while also trying to minimize the amount of loops to improve efficiency and performance.

###### Miners
Miners are functions in place to go through each file collect data, and build an organized data object of the wiki files and contents. Some examples might include tracking backlinks, or determining page category type.

###### Builders
Builders take the mined data that has been organized, formats it into markdown and updates the file before writing.

#### General usage

Each of the helpers has a beginning and an end. It's identified via it's unique `ID`. Anything you put in-between the start and end will be replaced by auto generated content.

```markdown
<!-- {{ID}} start -->
{{auto generated}}
<!-- {{ID}}} end -->
```


## Helpers

- [Table of contents](#Table-of-contents)
- [Used by](#Used-by)
- [Backlinks](#Backlinks)
- [Category tagging](#Category-tagging)
- [Sidebar navigation by categories](#Sidebar-navigation-by-categories)


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

### Sidebar navigation by categories

Categorizes the files by what folders they live in and generates a categorized navigation within the `_Sidebar.md` file.

- Categorized by folder names.
- Case sensitive folders.
- Replaces dashes with spaces.

#### Usage

`_Sidebar.md`

```markdown
<!-- categories start -->
<!-- categories end -->
```

<details>
<summary><strong>Examples</strong></summary>

###### Before

`Folder structure`

```
| Folder-a
|-- File-a.md
|Folder-B
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
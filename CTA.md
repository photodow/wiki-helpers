`UI Component`

This [[CTA]] (call to action) component allows one to quickly switch between a couple different [[CTA]] easily based on a given scenario. This makes it easy to offer them all without building that logic every-time, or just as easily limit the number of options for a specific pattern. [[Content block]] uses this component.

<!-- toc start -->
###### Table of contents  

- [1. Type](#1.-type)
  - [1.1 Jump](#1.1-jump)
- [2. Style](#2.-style)
  - [2.1 Text (default)](#2.1-text-(default))
- [Resources](#resources)
- [Usage](#usage)
- [References](#references)
  

<br />
<!-- toc end -->

###### Dependencies
- [[Button group]]
- [[Card]]
- [[Card link]]
- [[Link with icon]]
- [[Feature card]]
- [[Video player]]
- [[Lightbox media viewer]]

### 1. Type

#### 1.1 Jump
The jump link visually uses the down arrow to indicate to the user this link jumps down the page.

<img src="https://user-images.githubusercontent.com/3793636/115884368-74c06880-a414-11eb-967e-2986ec080c75.png" height="30px" />

###### Logic

| key | condition | description |
|:-----|:-----------|:-------------|
| 1.1 | `type === 'jump'` | Icon should be set to Arrow Down |
| 1.1 | `type === 'jump'` and `onClick` | When this particular CTA link type is clicked it’ll disable the anchor link and smoothly scroll the user down the page to the provided name or id. |

<br />[Back to top](#table-of-contents)<br /><br /><br />

### 2. Style

#### 2.1 Text (default)

<img src="https://user-images.githubusercontent.com/3793636/115885886-011f5b00-a416-11eb-9e6f-a3bcc7e812ee.png" height="30px;" />

The default text style is just a textual link with an icon. This type of [[CTA]] can be used at low levels within the page hierarchy.

###### Logic

| key | condition | description |
|:-----|:-----------|:-------------|
| 2.1 | `style === 'text'` | Set the data model and component to leverage: [[Link with icon]] |

> 👀 &nbsp; See [[Link with icon]] for more information.

<br />[Back to top](#table-of-contents)<br /><br /><br />





----

## Resources
- r5: [@carbon/icons]()
- [r6: @carbon/icons-react]()
- [r7: Carbon Icons]()

<!-- usedby start -->
## Usage  

 - [[Content block]]  

<br />
<!-- usedby end -->

<!-- backlinks start -->
## References  


**[[Card]]** (1)
- <a href="Card#:~:text=The card is highly used core component CTA .">The card is highly used core component  ***CTA*** .</a>

**[[Content block]]** (2)
- <a href="Content-block#:~:text=Depends on CTA asdf asdf">Depends on  ***CTA***  asdf asdf</a>
- <a href="Content-block#:~:text=- CTA ">-  ***CTA*** </a>
  

<br />
<!-- backlinks end -->
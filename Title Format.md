Title Format
	•	Display Title:
{Main Book Title} - Used ({Condition})
Example:
	•	For a new book titled “The Great Gatsby”:
	•	New Book: “The Great Gatsby”
	•	Used Book: “The Great Gatsby - Used [Very Good]”
	•	Product Handle:
{main-book-handle}-used-{condition}
Example:
	•	For “The Great Gatsby”:
	•	New Book Handle: the-great-gatsby
	•	Used Book Handle: the-great-gatsby-used-very-good

⸻

Condition Options

You can define a set of standard conditions such as:
	•	Like New
	•	Very Good
	•	Good
	•	Acceptable

Notes:
	•	When creating used book products, the condition should be appended both to the title (for display) and to the handle (for consistency and dynamic linking).
	•	For product handles, ensure that the condition is in lowercase and that spaces (if any) are replaced with hyphens (e.g., like-new).

⸻

Usage in Dynamic Liquid Code

For example, if your new book product’s handle is test-book-title, then a used version in “Very Good” condition would be:
	•	Display Title: Test Book Title - Used (Very Good)
	•	Handle: test-book-title-used-very-good

Your dynamic linking code can then append -used-{condition} to the main product’s handle to find the appropriate used book.

⸻

This schema provides a clear and consistent structure for titling used book products, making it easier to manage dynamic links, automate inventory updates, and maintain SEO consistency across your storefront.
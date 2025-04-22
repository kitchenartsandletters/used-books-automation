Title Format
	•	Display Title:
{Main Book Title} - hurt ({Condition})
Example:
	•	For a new book titled “The Great Gatsby”:
	•	New Book: “The Great Gatsby”
	•	hurt Book: “The Great Gatsby - hurt [Very Good]”
	•	Product Handle:
{main-book-handle}-hurt-{condition}
Example:
	•	For “The Great Gatsby”:
	•	New Book Handle: the-great-gatsby
	•	hurt Book Handle: the-great-gatsby-hurt-very-good

⸻

Condition Options

You can define a set of standard conditions such as:
	•	Like New
	•	Very Good
	•	Good
	•	Acceptable

Notes:
	•	When creating hurt book products, the condition should be appended both to the title (for display) and to the handle (for consistency and dynamic linking).
	•	For product handles, ensure that the condition is in lowercase and that spaces (if any) are replaced with hyphens (e.g., like-new).

⸻

Usage in Dynamic Liquid Code

For example, if your new book product’s handle is test-book-title, then a hurt version in “Very Good” condition would be:
	•	Display Title: Test Book Title - hurt (Very Good)
	•	Handle: test-book-title-hurt-very-good

Your dynamic linking code can then append -hurt-{condition} to the main product’s handle to find the appropriate hurt book.

⸻

This schema provides a clear and consistent structure for titling hurt book products, making it easier to manage dynamic links, automate inventory updates, and maintain SEO consistency across your storefront.
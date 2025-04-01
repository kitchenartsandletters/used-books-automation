# 📚 Used Books Automation System: Staff Guide

## Table of Contents
- [Introduction](#introduction)
- [How the System Works](#how-the-system-works)
- [Creating New Used Book Product Pages](#creating-new-used-book-product-pages)
- [Updating Existing Used Book Product Pages](#updating-existing-used-book-product-pages)
- [Checking System Status](#checking-system-status)
- [Handling Special Cases](#handling-special-cases)
- [Troubleshooting](#troubleshooting)

## Introduction

Welcome to the Used Books Automation System! This tool helps manage our used book inventory by automatically showing or hiding used book listings based on their inventory status. When a used book sells out, the system will automatically hide it and redirect customers to the new version of that book.

## How the System Works

### 🔄 The Basic Process

1. **Inventory Tracking**: The system monitors inventory levels of all used books
2. **Automatic Publishing/Unpublishing**:
   - When a used book has stock available → it will be visible on the website
   - When a used book is out of stock → it will be hidden from the website
3. **Customer Redirection**: If a customer tries to access an out-of-stock used book (through a bookmark or link), they will be automatically redirected to the new version of that book

### 🏷️ The Naming Convention (Very Important!)

For the system to work properly, all used books must follow this specific naming pattern:

- **New books**: `Book Title`
- **Used books**: `Book Title - Used (Condition)`

For example:
- New book: "Harry Potter and the Sorcerer's Stone"
- Used book: "Harry Potter and the Sorcerer's Stone - Used (Very Good)"

For the product handle (the part that appears in the URL), the pattern is:
- **New books**: `book-title`
- **Used books**: `book-title-used-condition`

For example:
- New book handle: `harry-potter-and-the-sorcerers-stone`
- Used book handle: `harry-potter-and-the-sorcerers-stone-used-very-good`

## Creating New Used Book Product Pages

### Step 1: Find the New Book Counterpart ✍️
First, find the new version of the book you're creating a used listing for. You'll need this to make sure the used book is named correctly.

### Step 2: Create a New Product 🆕
1. Log in to your Shopify admin
2. Go to **Products** → **Add product**
3. Enter the product information:
   - **Title**: Copy the new book's title and add " - Used (Condition)" at the end
   - Example: "The Great Gatsby - Used (Good)"

### Step 3: Set Up the Product Details 📝
1. **Description**: Describe the used book's condition
2. **Media**: Add appropriate images of the used book
3. **Price**: Set the used book's price
4. **Inventory**:
   - Set the quantity available
   - **IMPORTANT**: Uncheck "Continue selling when out of stock" ❗
   - This setting must be off for the automation to work properly!

### Step 4: Ensure Correct Handle Format 🔗
1. Look at the "URL and handle" section
2. Make sure the handle follows this format: `original-book-handle-used-condition`
3. If it doesn't match, click "Edit" next to the handle and fix it

### Step 5: Publish the Product 🚀
1. If you have inventory for this used book, set its status to "Active"
2. Click "Save"

## Updating Existing Used Book Product Pages

### Updating Inventory 📦
1. Go to **Products** → find the used book product
2. Click on the product to edit it
3. Update the "Inventory" section with the new quantity
4. Click "Save"

The system will automatically:
- Make the product visible if you added inventory (going from 0 to some positive number)
- Hide the product if you reduced inventory to 0

### Updating Product Information ✏️
1. Go to **Products** → find the used book product
2. Click on the product to edit it
3. Make your changes to title, description, price, etc.
4. **IMPORTANT**: Never change the handle format! It must maintain the pattern `original-book-handle-used-condition`
5. Click "Save"

## Checking System Status - Future Feature (In Development)

### Dashboard Overview 📊
1. Go to the Used Books Automation Dashboard (you'll be provided with a link)
2. Log in with your provided credentials
3. The dashboard shows:
   - Total number of used books
   - How many are published (visible) vs. unpublished (hidden)
   - Recent system activity
   - Any issues that need attention

### Book Status Check 🔍
1. From the dashboard, click on "Used Books"
2. Use the search box to find a specific book
3. The status column shows if the book is currently Published or Unpublished
4. You can also see the current inventory level

## Handling Special Cases

### Multiple Copies of Same Used Book 📚
If you have multiple copies of the same used book in different conditions:
1. Create separate product pages for each condition
2. Use different condition labels in the title and handle:
   - "Book Title - Used (Good)"
   - "Book Title - Used (Very Good)"
   - "Book Title - Used (Like New)"
   
### Condition Standards 📏
Use these standard condition categories:
- **Like New**: Almost indistinguishable from a new book
- **Very Good**: Slight wear, but no tears or major markings
- **Good**: Some wear, possibly minor markings
- **Acceptable**: Noticeable wear, may have markings/highlights

## Troubleshooting

### Product Not Showing Up When It Should 🔎
1. Check that the product is marked as "Active" in Shopify
2. Verify inventory is greater than 0
3. Make sure "Continue selling when out of stock" is unchecked
4. Check the dashboard to see if there are any system errors

### Product Still Showing When Out of Stock 🛑
1. Confirm inventory is set to 0
2. Check the dashboard for any errors in the system logs
3. You can manually unpublish the product from the dashboard if needed

### Redirect Not Working 🔄
1. Verify the product handle follows the correct format
2. Check the dashboard for any redirect errors
3. Contact technical support if redirects aren't functioning properly

### Getting Help 🆘
If you encounter problems not covered in this guide:
1. Check the dashboard for any error messages
2. For technical issues, email support@kitchenartsandletters.com with the specific product details

---

Remember: The key to success with this system is following the naming conventions consistently for all used books! The automation relies on the exact format of product titles and handles to work properly.
# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a self-hosted, user-friendly, and privacy-first bookmarking utility designed for users who want full control over their data. It provides a clean, fast, and modern interface to manage your bookmarks, organize them into folders, and keep your collection tidy and up-to-date.

<img src="https://placehold.co/800x400.png" data-ai-hint="app screenshot" alt="PocketMarks Screenshot" />

## Philosophy: You Own Your Data

The core principle of PocketMarks is **total user control**. There are no cloud servers and no hidden data synchronization. You own your data, and you decide where it goes. Your bookmarks are stored in a simple `bookmarks.json` file, giving you full ownership.

## Features

- **Organize Your Links:** Create bookmarks and nested folders to keep your links organized.
- **Modern Interface:** A clean and responsive UI with both Light and Dark modes.
- **Mark Favorites:** Use the star icon to mark your most important bookmarks for quick access.
- **Robust Import/Export:**
  - Import bookmarks from standard HTML files exported by any browser.
  - Choose to merge new links with your existing collection or replace it entirely.
  - A comparison view shows you exactly which new bookmarks will be added during a merge.
  - Export all or just a selection of your bookmarks back to a standard HTML file.
- **Dead Link Checker:** Scan your entire collection to find and flag links that are no longer working. Folders containing dead links are also highlighted for easy cleanup.
- **Duplicate Detection:** The app automatically detects when you're trying to add a URL that already exists in your collection and asks for confirmation.
- **Privacy First:** No external tracking or AI API calls. All your data stays within the application.
- **Statistics Dashboard:** Get insights into your collection with a dashboard showing total counts, your most frequently saved domains, and more.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/UI](https://ui.shadcn.com/)

---

## Getting Started

PocketMarks is designed to run locally on your computer, ensuring maximum privacy and simplicity. Your data will never leave your machine.

1.  **Download the Code:** Download the project files from this GitHub repository as a ZIP file.
2.  **Install Dependencies:** Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```
3.  **Set Up Credentials:** Create a new file named `.env.local` in the root of the project. This file will hold your private username and password. Add the following lines, replacing the example values:
    ```
    POCKETMARKS_USERNAME=user
    POCKETMARKS_PASSWORD=test1
    ```
    This file is included in `.gitignore` and will not be committed to your repository.
4.  **Run the App:**
    ```bash
    npm run dev
    ```
5.  **Access Your Hub:** Open your browser and navigate to [http://localhost:9002](http://localhost:9002).
    **Tip:** Bookmark this address in your browser for easy access!

## How to Sync Bookmarks Across Devices

The core philosophy of PocketMarks is **total user control**. It is designed to be the single source of truth for all your bookmarks. You consolidate your links from various browsers here, clean them up, and then distribute a pristine, organized collection back to your devices.

This manual synchronization, via import/export of a standard HTML file, is **the essence of true self-hosting**. It gives you unparalleled privacy and control, ensuring no data is ever sent to a third-party server without your explicit action. The order of bookmarks will be preserved.

### Step 1: Consolidating Your Bookmarks into PocketMarks

To start, you'll want to import all your existing bookmarks from your main browser. Here’s how to do it from Firefox, but the process is very similar for Chrome, Edge, and others.

#### Exporting from Firefox
1.  Open Firefox.
2.  Click the menu button (☰) in the top-right corner and select **Bookmarks**, then click **Manage Bookmarks** at the bottom. You can also press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac).
3.  In the Library window that opens, click on **Import and Backup**.
4.  Select **Export Bookmarks to HTML...**.
5.  Choose a location to save the `bookmarks.html` file (e.g., your Desktop) and click **Save**.

#### Importing into PocketMarks
1.  In PocketMarks, click the **Import / Export** button.
2.  Select **Merge from file...**.
3.  Choose the `bookmarks.html` file you just saved from Firefox.
4.  PocketMarks will show you a comparison of new bookmarks to be added. Confirm the import.
5.  Repeat this process for any other browsers you use to consolidate everything in one place.

### Step 2: Syncing Your Curated Collection to Other Devices

Once PocketMarks is your central, organized hub, you can sync this clean collection to all your other browsers and devices.

1.  **Export from PocketMarks**: Use the **Export** function to download a single, up-to-date HTML file containing all your links.
2.  **Transfer the File**: Move this HTML file to your other device. You can use a USB stick, send it to yourself via a private email, or any method you trust.
3.  **Import into Your Browser (e.g., Opera, Chrome)**:
    -   Open the browser on the new device.
    -   Go to the Bookmark Manager (usually `Ctrl+Shift+O` or by finding it in the menu).
    -   For a perfect sync, it's best to first **delete all existing bookmarks** from the browser.
    -   Find the **Import** function and select the HTML file you transferred from PocketMarks.

The browser will **automatically** read the file and recreate the exact structure of folders and links from your PocketMarks collection. You do not need to add them one by one. This ensures every browser is a perfect mirror of your curated hub.

## Password Recovery

Since this is a self-hosted application, there is no traditional "forgot password" feature. You are in full control. Simply open the `.env.local` file on your computer to see the password you set.

## Support the Project

If you find this project useful, please consider supporting its development. Thank you!

- [Sponsor on GitHub](https://github.com/sponsors/YOUR_USERNAME)
- [Support on Patreon](https://patreon.com/YOUR_USERNAME)
- [Donate via PayPal](https://paypal.me/YOUR_USERNAME)

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).

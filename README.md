# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a self-hosted, user-friendly, and privacy-first bookmarking utility designed for users who want full control over their data. It provides a clean, fast, and modern interface to manage your bookmarks, organize them into folders, and keep your collection tidy and up-to-date.

<img src="https://placehold.co/800x400.png" data-ai-hint="app screenshot" alt="PocketMarks Screenshot" />

## Philosophy: You Own Your Data

The core principle of PocketMarks is **total user control**. There are no cloud servers and no hidden data synchronization by default. You own your data, and you decide where it goes. Your bookmarks are stored in a simple `bookmarks.json` file, giving you full ownership.

## Features

- **Organize Your Links:** Create bookmarks and nested folders to keep your links organized.
- **Modern Interface:** A clean and responsive UI with both Light and Dark modes.
- **Mark Favorites:** Use the star icon to mark your most important bookmarks for quick access.
- **Robust Import/Export:**
  - Import bookmarks from standard HTML files exported by any browser.
  - Choose to **merge** new links with your existing collection or replace it entirely.
  - A comparison view shows you exactly which new bookmarks will be added during a merge.
  - Export all or just a selection of your bookmarks back to a standard HTML file. This is perfect for backups, sharing, or providing curated context files for AI projects.
- **Duplicate Detection:** The app automatically detects when you're trying to add a URL that already exists in your collection and asks for confirmation.
- **Statistics Dashboard:** Get insights into your collection with a dashboard showing total counts, your most frequently saved domains, and more.

## Getting Started

PocketMarks is flexible. You can run it entirely on your local machine for maximum privacy, or deploy your own private version to the cloud for access from anywhere. Choose the path that's right for you.

### Option 1: Run Locally (Maximum Privacy & Simplicity)
This is the recommended path for most users. Your data will never leave your computer.

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

### Option 2: Deploy to the Cloud (Access Anywhere - Free)
This option is for users who want to access their bookmarks from multiple devices (like a phone or tablet). It involves deploying your own private copy of PocketMarks to a free cloud hosting service called Vercel.

**Requirements:** This process requires creating a free account on both **GitHub** and **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffirebase%2Fgenkit-pocketmarks-agent-example&env=POCKETMARKS_USERNAME,POCKETMARKS_PASSWORD&envDescription=Enter%20a%20username%20and%20password%20to%20secure%20your%20PocketMarks%20instance.&project-name=pocketmarks-hub&repository-name=my-pocketmarks-hub)

1.  **Click the "Deploy with Vercel" button above.**
2.  You will be redirected to Vercel. It will prompt you to **sign up or log in, preferably using your GitHub account.** This is necessary for Vercel to create your personal copy of the code.
3.  Vercel will then ask you to configure the project. You must enter a `POCKETMARKS_USERNAME` and `POCKETMARKS_PASSWORD`. These are the credentials you will use to log into **your** PocketMarks app.
4.  Click **"Deploy"**. Vercel will build and deploy the application, giving you a unique URL (e.g., `my-pocketmarks-hub.vercel.app`).
5.  Navigate to that URL to access your private, online version of PocketMarks.

## How to Sync Bookmarks Across Devices

The core philosophy of PocketMarks is **total user control**. It is designed to be the single source of truth for all your bookmarks. You consolidate your links from various browsers here, clean them up, and then distribute a pristine, organized collection back to your devices.

This manual synchronization, via import/export of a standard HTML file, is **the essence of true self-hosting**. It gives you unparalleled privacy and control, ensuring no data is ever sent to a third-party server without your explicit action. The order of bookmarks will be preserved.

### Step 1: Consolidating Your Bookmarks into PocketMarks

To start, you'll want to import all your existing bookmarks from your main browser. The process is very similar for Chrome, Firefox, Edge, and others.

#### Exporting from Your Browser
1.  Open your browser.
2.  Find the Bookmark Manager. This is often found in the main menu (usually an icon with three dots or lines in the top-right corner) under "Bookmarks". You can also try the keyboard shortcut `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac).
3.  In the Bookmark Manager, look for an "Export" or "Import and Backup" option.
4.  Select **Export Bookmarks to HTML...**.
5.  Choose a location to save the `bookmarks.html` file (e.g., your Desktop) and click **Save**.

#### Importing into PocketMarks
1.  In PocketMarks, click the **Import / Export** button.
2.  Select **Merge from file...**.
3.  Choose the `bookmarks.html` file you just saved.
4.  PocketMarks will show you a comparison of new bookmarks to be added. Confirm the import.
5.  Repeat this process for any other browsers you use to consolidate everything in one place.

### Step 2: Syncing Your Curated Collection to Other Devices

Once PocketMarks is your central, organized hub, you can sync this clean collection to all your other browsers and devices.

1.  **Export from PocketMarks**: Use the **Export** function to download a single, up-to-date HTML file containing all your links.
2.  **Transfer the File**: Move this HTML file to your other device. You can use a USB stick, send it to yourself via a private email, or any method you trust.
3.  **Import into Your Browser**:
    -   Open the browser on the new device.
    -   Go to the Bookmark Manager.
    -   For a perfect sync, it's best to first **delete all existing bookmarks** from the browser.
    -   Find the **Import** function and select the HTML file you transferred from PocketMarks.

The browser will **automatically** read the file and recreate the exact structure of folders and links from your PocketMarks collection. You do not need to add them one by one. This ensures every browser is a perfect mirror of your curated hub.

### Pro Tip: Reordering Bookmarks
If you need to do a major reorganization of your bookmarks (moving many items between folders), the fastest way is to do it directly in your main browser's bookmark manager, which is optimized for that task. Once you're done, simply use the "Replace from file..." option in PocketMarks to update your central hub with the new, clean structure.

## Password Recovery

-   **For Local Instances:** You are in full control. Simply open the `.env.local` file on your computer to see the password you set.
-   **For Vercel Deployments:** Log in to your Vercel account, navigate to your PocketMarks project settings, and view the "Environment Variables" to see the username and password you configured.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/UI](https://ui.shadcn.com/)

---

## Support the Project

If you find this project useful, please consider supporting its development. Thank you!

- [Sponsor on GitHub](https://github.com/sponsors/YOUR_USERNAME)
- [Support on Patreon](https://patreon.com/YOUR_USERNAME)
- [Donate via PayPal](https://paypal.me/YOUR_USERNAME)

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).

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

## Getting Started: Choose Your Path

You have two main ways to use PocketMarks, depending on your needs.

### Path A: Local-First (For Maximum Privacy on a Single Computer)

This is the recommended path for users who want to run PocketMarks exclusively on their own computer for maximum privacy and simplicity. Your data will never leave your machine.

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

### Path B: Deploy to the Cloud (For Access From Any Device)

This path is for users who want to access their bookmarks from multiple devices (like a laptop, phone, and tablet). By deploying the app to a free cloud service like Vercel, you get your own private, password-protected version of PocketMarks accessible from anywhere via a personal URL.

**Your data remains private.** You are not sharing it with anyone; you are simply creating your own personal instance of the application on the internet.

1.  **Click the Deploy Button:**
    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fyour-repo-name&env=POCKETMARKS_USERNAME,POCKETMARKS_PASSWORD&envDescription=Enter%20your%20desired%20username%20and%20password%20for%20your%20private%20PocketMarks%20instance.&project-name=my-pocketmarks&repository-name=my-pocketmarks)

2.  **Register/Login to Vercel:** Vercel will ask you to log in. The easiest way is to use your GitHub account. This is necessary for Vercel to create a private copy of the PocketMarks code just for you.

3.  **Set Your Credentials:** Vercel will then ask you to enter your desired `POCKETMARKS_USERNAME` and `POCKETMARKS_PASSWORD`. These will be the credentials you use to log into your PocketMarks app.

4.  **Deploy:** Click "Deploy" and wait a few moments. Vercel will build your app and provide you with your personal URL (e.g., `https://my-pocketmarks.vercel.app`).

5.  **Login:** Visit your new URL and log in with the credentials you set in the previous step.

## How to Sync Bookmarks Across Devices

The core philosophy of PocketMarks is **total user control**. This means that if you run separate instances of the app on different machines (e.g., one on a laptop and one on a desktop), you synchronize them manually. This is the essence of true self-hosting and gives you unparalleled privacy.

Here’s how you do it:
1.  **Install PocketMarks:** Follow the "Getting Started" guide to install a separate copy of PocketMarks on each device you want to use.
2.  **Export from Your Main Device:** On the device that has the most up-to-date bookmarks, use the **Export** function to download a single HTML file containing all your links. The order of the bookmarks will be preserved.
3.  **Transfer the File:** Move this HTML file to your other device. You can use a USB stick, send it to yourself via a private email, or any method you trust.
4.  **Import on the Second Device:** On the second device, open PocketMarks and use the **Import** function. It's best to use the **"Replace from file..."** option to ensure the bookmarks are perfectly identical to your main device.

## Password Recovery

Since this is a self-hosted application, there is no traditional "forgot password" feature. You are in full control.

*   **If you are running it locally:** Simply open the `.env.local` file on your computer to see the password you set.
*   **If you deployed it to Vercel:** Log into your Vercel account, go to your PocketMarks project settings, and look for the "Environment Variables" section. Your password will be stored there.

## Support the Project

If you find this project useful, please consider supporting its development. Thank you!

- [Sponsor on GitHub](https://github.com/sponsors/YOUR_USERNAME)
- [Support on Patreon](https://patreon.com/YOUR_USERNAME)
- [Donate via PayPal](https://paypal.me/YOUR_USERNAME)

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).

# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a self-hosted, user-friendly, and privacy-first bookmarking utility designed for users who want full control over their data. It runs entirely on your own computer, ensuring that your bookmarks are never sent to a third-party server. It provides a clean, fast, and modern interface to manage your bookmarks, organize them into folders, and keep your collection tidy and up-to-date.

<img src="https://placehold.co/800x400.png" data-ai-hint="app screenshot" alt="PocketMarks Screenshot" />

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
- **Privacy First:** No external tracking or AI API calls. All your data stays within the application. Your bookmarks are stored in a simple `bookmarks.json` file, giving you full ownership.
- **Statistics Dashboard:** Get insights into your collection with a dashboard showing total counts, your most frequently saved domains, and more.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/UI](https://ui.shadcn.com/)

---

## Getting Started

This application is designed to run locally on your computer for maximum privacy and control. Your data never leaves your machine.

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

## The Self-Hosted Way: Using Across Devices

The core philosophy of PocketMarks is **total user control**. This means no cloud servers, no data synchronization hidden in the background. You own your data, and you decide where it goes.

The idea of synchronizing manually via import/export of HTML files is the essence of true self-hosting. If you want to have the same set of bookmarks on different computers (e.g., a laptop and a desktop), you can follow this simple, manual, and ultra-secure process:

1.  **Install PocketMarks:** Follow the "Getting Started" guide to install a separate copy of PocketMarks on each device you want to use.
2.  **Export from Your Main Device:** On the device that has the most up-to-date bookmarks, use the **Export** function to download a single HTML file containing all your links. The order of the bookmarks will be preserved.
3.  **Transfer the File:** Move this HTML file to your other device. You can use a USB stick, send it to yourself via a private email, or any method you trust.
4.  **Import on the Second Device:** On the second device, open PocketMarks and use the **Import** function. It's best to use the **"Replace from file..."** option to ensure the bookmarks are perfectly identical to your main device.

This manual process guarantees that your data is never stored on a third-party server, giving you unparalleled privacy and control over your digital life.

### A Note on Passwords and Recovery

Since this is a self-hosted application that runs entirely on your machine, there is no traditional "forgot password" feature that sends emails. This is intentional to maximize your privacy.

If you forget your password, simply open the `.env.local` file on your computer to see what you set. You are in full control.

### Privacy and Anonymity

Since this is a self-hosted application that runs entirely on your machine, it is inherently private.
- **VPN:** It works perfectly with any VPN.
- **Tor Browser:** You can access your local server via Tor Browser without any issues.
- **No External Calls:** The application makes no external API calls, except for the "Dead Link Checker" feature, which must contact website domains to verify their status. All bookmark data is stored in the `bookmarks.json` file and is never sent to a third party.

## Support the Project

If you find this project useful, please consider supporting its development. Thank you!

- [Sponsor on GitHub](https://github.com/sponsors/YOUR_USERNAME)
- [Support on Patreon](https://patreon.com/YOUR_USERNAME)
- [Donate via PayPal](https://paypal.me/YOUR_USERNAME)

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).

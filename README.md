# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a self-hosted, user-friendly, and privacy-first bookmarking utility designed for users who want full control over their data. It provides a clean, fast, and modern interface to manage your bookmarks, organize them into folders, and keep your collection tidy and up-to-date.

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

## Getting Started: Two Ways to Use PocketMarks

You can use PocketMarks in two ways: locally on your computer for maximum privacy, or deployed on a free cloud service to access it from any device.

### Option 1: Local Development (For Private Use on One Computer)

This method runs the app entirely on your machine. Your data never leaves your computer.

1.  **Install Dependencies:** Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Set Up Credentials:** Create a new file named `.env.local` in the root of the project. This file will hold your private username and password. Add the following lines, replacing the example values:
    ```
    POCKETMARKS_USERNAME=user
    POCKETMARKS_PASSWORD=test1
    ```
    This file is included in `.gitignore` and will not be committed to your repository.

3.  **Run the App:**
    ```bash
    npm run dev
    ```

4.  **Access Your Hub:** Open your browser and navigate to [http://localhost:9002](http://localhost:9002).
    **Tip:** Bookmark this address in your browser for easy access!

### Option 2: Deployment (Access from Anywhere via Vercel)

This method deploys your own **private copy** of the app to a free cloud service, Vercel. Your data is still yours and is not shared with anyone. This is the recommended way to access your bookmarks from multiple devices (phone, tablet, etc.).

1.  **Push to GitHub:** The easiest way to deploy to a service like Vercel is by using a Git repository. Create a free account on [GitHub](https://github.com) and push your project code there.
2.  **Import to Vercel:** Sign up for [Vercel](https://vercel.com/) (you can use your GitHub account for a seamless setup) and import the PocketMarks repository.
3.  **Configure Environment Variables:** During the import process, Vercel will ask for Environment Variables. This is the secure, cloud-based equivalent of the `.env.local` file. Add your `POCKETMARKS_USERNAME` and `POCKETMARKS_PASSWORD` here.
4.  **Deploy:** Vercel will automatically build and deploy the app, giving you a public URL (e.g., `your-project-name.vercel.app`). Only you can access it with the credentials you set.

---

### A Note on Passwords and Recovery

Since this is a self-hosted application, there is no traditional "forgot password" feature that sends emails. Your credentials are saved directly by you.

-   **For local setups:** If you forget your password, simply open the `.env.local` file on your computer to see it.
-   **For deployed setups (like Vercel):** If you forget your password, log in to your Vercel account, navigate to your project's settings, and view the Environment Variables you set.

### Privacy and Anonymity

Since this is a self-hosted application that runs entirely on your machine or your private instance, it is inherently private.
- **VPN:** It works perfectly with any VPN.
- **Tor Browser:** You can access your local server or deployed instance via Tor Browser without any issues.
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
